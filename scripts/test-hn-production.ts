/**
 * Test the HN listener against the database
 * Run with: npx tsx scripts/test-hn-production.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface HNHit {
  objectID: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  story_text?: string;
  author: string;
  created_at_i: number;
  _tags: string[];
}

const HN_API = "https://hn.algolia.com/api/v1";

const HN_SEARCH_QUERIES = [
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "automated trading",
  "machine learning trading",
  "backtest",
];

const RELEVANCE_KEYWORDS = [
  "trading bot", "algo trading", "algorithmic trading", "AI trading",
  "automated trading", "machine learning", "quant", "quantitative",
  "backtest", "backtesting", "algorithm", "trading strategy",
  "finance", "fintech", "portfolio", "stock", "crypto",
];

async function searchHN(query: string, type: "story" | "comment"): Promise<HNHit[]> {
  const sinceTimestamp = Math.floor(Date.now() / 1000) - 604800; // Last 7 days
  const url = `${HN_API}/search_by_date?query=${encodeURIComponent(query)}&tags=${type}&numericFilters=created_at_i>${sinceTimestamp}&hitsPerPage=20`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HN API error: ${response.status}`);
  const data = await response.json();
  return data.hits || [];
}

function getMatchedKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return RELEVANCE_KEYWORDS.filter((kw) => lowerText.includes(kw.toLowerCase()));
}

async function main() {
  console.log("📰 Testing Hacker News (Algolia) API\n");
  console.log("─".repeat(60));

  await prisma.$connect();
  console.log("✅ Database connected\n");

  console.log("Running searches...");
  console.log("─".repeat(60));

  const results: Array<{
    id: string;
    author: string;
    content: string;
    url: string;
    type: string;
    threadContext: string | null;
    matchedKeywords: string[];
    createdAt: Date;
  }> = [];
  const seen = new Set<string>();

  for (const type of ["story", "comment"] as const) {
    console.log(`\nSearching ${type}s...`);
    for (const query of HN_SEARCH_QUERIES.slice(0, 4)) {
      try {
        console.log(`   Query: "${query}"...`);
        const hits = await searchHN(query, type);
        console.log(`   Found ${hits.length} hits`);

        for (const hit of hits) {
          if (seen.has(hit.objectID)) continue;
          seen.add(hit.objectID);

          const content = type === "story"
            ? [hit.title, hit.story_text].filter(Boolean).join("\n\n")
            : hit.comment_text || "";

          if (!content) continue;

          const plainContent = content.replace(/<[^>]+>/g, "");
          const matchedKeywords = getMatchedKeywords(plainContent);
          if (matchedKeywords.length === 0) continue;

          results.push({
            id: hit.objectID,
            author: hit.author,
            content: plainContent,
            url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            type,
            threadContext: type === "comment" && hit.story_title ? `Re: ${hit.story_title}` : null,
            matchedKeywords,
            createdAt: new Date(hit.created_at_i * 1000),
          });
        }

        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.error(`   Error: ${error}`);
      }
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`\n✅ Found ${results.length} relevant posts\n`);

  if (results.length > 0) {
    const stories = results.filter((r) => r.type === "story");
    const comments = results.filter((r) => r.type === "comment");
    console.log(`   Stories: ${stories.length}, Comments: ${comments.length}\n`);

    console.log("Sample posts:\n");
    for (const post of results.slice(0, 8)) {
      const label = post.type === "story" ? "📖" : "💬";
      console.log(`${label} ${post.content.slice(0, 80)}...`);
      console.log(`   Author: ${post.author} | Keywords: ${post.matchedKeywords.slice(0, 3).join(", ")}`);
      console.log(`   ${post.url}\n`);
    }

    // Save to database
    console.log("─".repeat(60));
    console.log("\nSaving to database...");

    let saved = 0;
    for (const post of results) {
      try {
        await prisma.discoveredPost.upsert({
          where: {
            platform_externalId: { platform: "HN", externalId: post.id },
          },
          update: {},
          create: {
            platform: "HN",
            externalId: post.id,
            externalUrl: post.url,
            authorName: null,
            authorHandle: post.author,
            content: post.content,
            threadContext: post.threadContext,
            matchedKeywords: post.matchedKeywords.join(", "),
            discoveredAt: post.createdAt,
          },
        });
        saved++;
      } catch (error) {
        const e = error as { code?: string };
        if (e.code !== "P2002") console.error(`Failed to save: ${error}`);
      }
    }

    console.log(`✅ Saved ${saved} posts to database`);

    const total = await prisma.discoveredPost.count({ where: { platform: "HN" } });
    console.log(`   Total HN posts in database: ${total}`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("HN test complete!");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Test failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
