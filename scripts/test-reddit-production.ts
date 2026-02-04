/**
 * Test the production Reddit listener against the database
 *
 * Run with: npx tsx scripts/test-reddit-production.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Re-implement the listener logic here to avoid path alias issues
// This mirrors lib/listeners/reddit.ts

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    subreddit: string;
    permalink: string;
    created_utc: number;
    score: number;
  };
}

const TARGET_SUBREDDITS = [
  "algotrading",
  "quant",
  "MachineLearning",
  "LocalLLaMA",
  "reinforcementlearning",
  "fintech",
  "datascience",
  "trading",
  "stocks",
  "cryptocurrency",
];

const SEARCH_QUERIES = [
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "AI trading",
  "automated trading",
  "machine learning trading",
  "backtest strategy",
  "quant trading",
];

const RELEVANCE_KEYWORDS = [
  "trading bot", "algo trading", "algorithmic trading", "AI trading",
  "automated trading", "machine learning", "quant trading",
  "backtest", "backtesting", "quantitative", "algorithm",
  "automate", "automation", "bot", "ML", "LLM", "GPT",
  "neural network", "predict", "prediction", "strategy",
];

const EXCLUDE_PATTERNS = [
  /\b(hiring|job posting|we're looking for|career|vacancy)\b/i,
  /\b(check out my course|enroll now|limited spots|sign up)\b/i,
  /\b(affiliate|promo code|discount|use code)\b/i,
];

function isLowValueContent(text: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(text));
}

function scoreRelevance(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) score++;
  }
  return score;
}

function getMatchedKeywords(text: string, extraKeywords: string[] = []): string[] {
  const lowerText = text.toLowerCase();
  const allKeywords = [...RELEVANCE_KEYWORDS, ...extraKeywords];
  return allKeywords.filter((kw) => lowerText.includes(kw.toLowerCase()));
}

async function searchRedditPublic(query: string, subreddits: string[]): Promise<RedditPost[]> {
  const subredditStr = subreddits.join("+");
  const url = `https://www.reddit.com/r/${subredditStr}/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=15&restrict_sr=on`;

  const response = await fetch(url, {
    headers: { "User-Agent": "GrowthDeck:v1.0.0" },
  });

  if (!response.ok) throw new Error(`Reddit API error: ${response.status}`);
  const data = await response.json();
  return data.data?.children || [];
}

interface ListenerResult {
  platform: "REDDIT";
  externalId: string;
  externalUrl: string;
  authorHandle: string;
  content: string;
  threadContext: string;
  matchedKeywords: string[];
  discoveredAt: Date;
}

async function runListener(userPhrases: string[]): Promise<ListenerResult[]> {
  const queries = [...SEARCH_QUERIES];
  if (userPhrases.length > 0) {
    for (let i = 0; i < userPhrases.length; i += 2) {
      const batch = userPhrases.slice(i, i + 2);
      queries.push(batch.join(" OR "));
    }
  }

  const results: ListenerResult[] = [];
  const seen = new Set<string>();
  const queriesToRun = queries.slice(0, 8);

  for (const query of queriesToRun) {
    console.log(`   Searching: "${query}"...`);
    try {
      const posts = await searchRedditPublic(query, TARGET_SUBREDDITS);
      console.log(`   Found ${posts.length} posts`);

      for (const post of posts) {
        if (seen.has(post.data.id)) continue;
        seen.add(post.data.id);

        const content = post.data.selftext
          ? `${post.data.title}\n\n${post.data.selftext}`
          : post.data.title;

        if (isLowValueContent(content)) continue;
        const relevanceScore = scoreRelevance(content);
        if (relevanceScore === 0) continue;

        results.push({
          platform: "REDDIT",
          externalId: post.data.id,
          externalUrl: `https://reddit.com${post.data.permalink}`,
          authorHandle: `u/${post.data.author}`,
          content,
          threadContext: `r/${post.data.subreddit}`,
          matchedKeywords: getMatchedKeywords(content, userPhrases),
          discoveredAt: new Date(post.data.created_utc * 1000),
        });
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`   Error: ${error}`);
    }
  }

  return results;
}

async function saveResults(results: ListenerResult[]): Promise<number> {
  let saved = 0;
  for (const result of results) {
    try {
      await prisma.discoveredPost.upsert({
        where: {
          platform_externalId: {
            platform: result.platform,
            externalId: result.externalId,
          },
        },
        update: {},
        create: {
          platform: result.platform,
          externalId: result.externalId,
          externalUrl: result.externalUrl,
          authorName: null,
          authorHandle: result.authorHandle,
          content: result.content,
          threadContext: result.threadContext,
          matchedKeywords: result.matchedKeywords.join(", "),
          discoveredAt: result.discoveredAt,
        },
      });
      saved++;
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code !== "P2002") {
        console.error(`Failed to save post ${result.externalId}:`, error);
      }
    }
  }
  return saved;
}

async function main() {
  console.log("🔍 Testing production Reddit listener\n");
  console.log("─".repeat(60));

  // Check database connection
  console.log("\n1. Checking database connection...");
  try {
    await prisma.$connect();
    console.log("   ✅ Database connected");
  } catch (error) {
    console.error("   ❌ Database connection failed:", error);
    process.exit(1);
  }

  // Check for Reddit credentials
  console.log("\n2. Checking for Reddit credentials...");
  const account = await prisma.platformAccount.findFirst({
    where: { platform: "REDDIT", isActive: true },
  });
  if (account?.credentials) {
    console.log(`   ✅ Found Reddit account: ${account.displayName}`);
  } else {
    console.log("   ⚠️  No Reddit credentials found - will use public API");
  }

  // Check for keywords
  console.log("\n3. Checking for user-defined keywords...");
  const keywords = await prisma.keyword.findMany({
    where: { isActive: true },
  });
  const userPhrases = keywords.map((k) => k.phrase);
  if (keywords.length > 0) {
    console.log(`   ✅ Found ${keywords.length} active keywords:`);
    keywords.slice(0, 5).forEach((k) => console.log(`      - ${k.phrase}`));
    if (keywords.length > 5) console.log(`      ... and ${keywords.length - 5} more`);
  } else {
    console.log("   ⚠️  No user keywords found - will use built-in keywords only");
  }

  // Run the listener
  console.log("\n4. Running Reddit listener...");
  console.log("─".repeat(60));

  const startTime = Date.now();
  const results = await runListener(userPhrases);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("─".repeat(60));
  console.log(`\n✅ Listener completed in ${elapsed}s`);
  console.log(`   Found ${results.length} relevant posts\n`);

  if (results.length === 0) {
    console.log("No posts found. This could mean:");
    console.log("- The search queries didn't match recent posts");
    console.log("- All posts were filtered as low-value content");
    console.log("- Rate limiting from Reddit\n");
  } else {
    // Show top results
    console.log("Top posts found:\n");
    const sorted = results.sort((a, b) =>
      b.matchedKeywords.length - a.matchedKeywords.length
    );

    for (const post of sorted.slice(0, 10)) {
      const title = post.content.split("\n")[0].slice(0, 70);
      console.log(`📌 [${post.threadContext}] ${title}${title.length >= 70 ? "..." : ""}`);
      console.log(`   Author: ${post.authorHandle}`);
      console.log(`   Keywords: ${post.matchedKeywords.slice(0, 5).join(", ")}`);
      console.log(`   ${post.externalUrl}\n`);
    }

    if (results.length > 10) {
      console.log(`... and ${results.length - 10} more posts\n`);
    }

    // Save to database
    console.log("─".repeat(60));
    console.log("\n5. Saving to database...");

    const saved = await saveResults(results);
    console.log(`   ✅ Saved ${saved} posts to DiscoveredPost table`);

    // Show current totals
    const totalPosts = await prisma.discoveredPost.count({
      where: { platform: "REDDIT" },
    });
    console.log(`   Total Reddit posts in database: ${totalPosts}`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("Test complete!");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Test failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
