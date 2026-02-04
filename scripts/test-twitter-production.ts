/**
 * Test the Twitter listener against the database
 * Run with: npx tsx scripts/test-twitter-production.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SocialDataTweet {
  id_str: string;
  full_text: string;
  text: string | null;
  tweet_created_at: string;
  in_reply_to_screen_name: string | null;
  user: {
    name: string;
    screen_name: string;
  };
}

interface SocialDataResponse {
  tweets: SocialDataTweet[];
  next_cursor: string | null;
}

const SOCIALDATA_API = "https://api.socialdata.tools/twitter/search";

const SEARCH_QUERIES = [
  '"looking for" "trading bot"',
  '"algo trading" recommend',
  '"AI trading" strategy',
  'automated trading help',
];

async function searchTwitter(query: string): Promise<SocialDataTweet[]> {
  const apiKey = process.env.SOCIALDATA_API_KEY;
  if (!apiKey) {
    throw new Error("SOCIALDATA_API_KEY not set in environment");
  }

  // Search last 24 hours
  const sinceTimestamp = Math.floor(Date.now() / 1000) - 86400;
  const fullQuery = `${query} -is:retweet lang:en since_time:${sinceTimestamp}`;
  const url = `${SOCIALDATA_API}?query=${encodeURIComponent(fullQuery)}&type=Latest`;

  console.log(`   Query: ${fullQuery.slice(0, 60)}...`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SocialData API error ${response.status}: ${text}`);
  }

  const data: SocialDataResponse = await response.json();
  return data.tweets || [];
}

async function main() {
  console.log("🐦 Testing Twitter (SocialData.tools) API\n");
  console.log("─".repeat(60));

  // Check for API key
  if (!process.env.SOCIALDATA_API_KEY) {
    console.error("❌ SOCIALDATA_API_KEY not found in environment");
    console.error("   Make sure it's set in .env.local");
    process.exit(1);
  }
  console.log("✅ API key found\n");

  // Check database
  console.log("Checking database connection...");
  await prisma.$connect();
  console.log("✅ Database connected\n");

  console.log("Running searches...");
  console.log("─".repeat(60));

  const results: Array<{
    id: string;
    author: string;
    handle: string;
    content: string;
    url: string;
    createdAt: Date;
  }> = [];
  const seen = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    try {
      const tweets = await searchTwitter(query);
      console.log(`   Found ${tweets.length} tweets\n`);

      for (const tweet of tweets) {
        if (seen.has(tweet.id_str)) continue;
        seen.add(tweet.id_str);

        results.push({
          id: tweet.id_str,
          author: tweet.user.name,
          handle: `@${tweet.user.screen_name}`,
          content: tweet.full_text || tweet.text || "",
          url: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
          createdAt: new Date(tweet.tweet_created_at),
        });
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`   Error: ${error}\n`);
    }
  }

  console.log("─".repeat(60));
  console.log(`\n✅ Found ${results.length} unique tweets\n`);

  if (results.length > 0) {
    console.log("Sample tweets:\n");
    for (const tweet of results.slice(0, 8)) {
      console.log(`📌 ${tweet.handle}: ${tweet.content.slice(0, 80)}...`);
      console.log(`   ${tweet.url}\n`);
    }

    // Save to database
    console.log("─".repeat(60));
    console.log("\nSaving to database...");

    let saved = 0;
    for (const tweet of results) {
      try {
        await prisma.discoveredPost.upsert({
          where: {
            platform_externalId: { platform: "X", externalId: tweet.id },
          },
          update: {},
          create: {
            platform: "X",
            externalId: tweet.id,
            externalUrl: tweet.url,
            authorName: tweet.author,
            authorHandle: tweet.handle,
            content: tweet.content,
            threadContext: null,
            matchedKeywords: "twitter test",
            discoveredAt: tweet.createdAt,
          },
        });
        saved++;
      } catch (error) {
        const e = error as { code?: string };
        if (e.code !== "P2002") console.error(`Failed to save: ${error}`);
      }
    }

    console.log(`✅ Saved ${saved} tweets to database`);

    const total = await prisma.discoveredPost.count({ where: { platform: "X" } });
    console.log(`   Total Twitter posts in database: ${total}`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("Twitter test complete!");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Test failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
