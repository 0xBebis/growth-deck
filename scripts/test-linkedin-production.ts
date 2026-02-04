/**
 * Test the LinkedIn listener (Apify) against the database
 * Run with: npx tsx scripts/test-linkedin-production.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ApifyLinkedInPost {
  urn?: string;
  url?: string;
  text?: string;
  postedAtTimestamp?: number;
  postedAtISO?: string;
  authorFullName?: string;
  authorProfileUrl?: string;
}

const APIFY_ACTOR = "supreme_coder~linkedin-post";
const APIFY_API = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;

const SEARCH_QUERIES = [
  "looking for trading bot",
  "AI trading strategy",
  "automated trading",
];

function extractPostId(post: ApifyLinkedInPost): string | null {
  if (post.urn) {
    const match = post.urn.match(/(\d+)$/);
    if (match) return match[1];
  }
  if (post.url) {
    const match = post.url.match(/activity[:-](\d+)/);
    if (match) return match[1];
  }
  return null;
}

async function searchLinkedIn(query: string): Promise<ApifyLinkedInPost[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN not set in environment");
  }

  const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&datePosted=%22past-week%22`;

  console.log(`   Query: "${query}"`);

  const response = await fetch(`${APIFY_API}?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls: [searchUrl],
      limitPerSource: 10,
      deepScrape: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  console.log("💼 Testing LinkedIn (Apify) API\n");
  console.log("─".repeat(60));

  // Check for API token
  if (!process.env.APIFY_TOKEN) {
    console.error("❌ APIFY_TOKEN not found in environment");
    console.error("   Make sure it's set in .env.local");
    process.exit(1);
  }
  console.log("✅ API token found\n");

  // Check database
  console.log("Checking database connection...");
  await prisma.$connect();
  console.log("✅ Database connected\n");

  console.log("Running searches (this may take 1-2 minutes per query)...");
  console.log("─".repeat(60));

  const results: Array<{
    id: string;
    author: string | null;
    content: string;
    url: string;
    createdAt: Date;
  }> = [];
  const seen = new Set<string>();

  // Only run 2 queries to save API costs during testing
  for (const query of SEARCH_QUERIES.slice(0, 2)) {
    try {
      console.log(`\n   Searching LinkedIn for: "${query}"...`);
      const posts = await searchLinkedIn(query);
      console.log(`   Found ${posts.length} posts`);

      for (const post of posts) {
        const postId = extractPostId(post);
        if (!postId || seen.has(postId)) continue;
        seen.add(postId);

        if (!post.text) continue;

        results.push({
          id: postId,
          author: post.authorFullName || null,
          content: post.text,
          url: post.url || `https://www.linkedin.com/feed/update/urn:li:activity:${postId}`,
          createdAt: post.postedAtTimestamp
            ? new Date(post.postedAtTimestamp)
            : new Date(),
        });
      }

      // Longer delay for LinkedIn
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`   Error: ${error}\n`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`\n✅ Found ${results.length} unique posts\n`);

  if (results.length > 0) {
    console.log("Sample posts:\n");
    for (const post of results.slice(0, 5)) {
      console.log(`📌 ${post.author || "Unknown"}: ${post.content.slice(0, 80)}...`);
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
            platform_externalId: { platform: "LINKEDIN", externalId: post.id },
          },
          update: {},
          create: {
            platform: "LINKEDIN",
            externalId: post.id,
            externalUrl: post.url,
            authorName: post.author,
            authorHandle: null,
            content: post.content,
            threadContext: null,
            matchedKeywords: "linkedin test",
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

    const total = await prisma.discoveredPost.count({ where: { platform: "LINKEDIN" } });
    console.log(`   Total LinkedIn posts in database: ${total}`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("LinkedIn test complete!");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Test failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
