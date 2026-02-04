/**
 * Standalone Reddit scraping test - no auth required
 * Uses Reddit's public JSON API (rate limit: 60 req/min)
 *
 * Run with: npx tsx scripts/test-reddit.ts
 */

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    subreddit: string;
    permalink: string;
    created_utc: number;
    num_comments: number;
    score: number;
  };
}

// Target subreddits for AI trading/finance
const SUBREDDITS = [
  "algotrading",
  "quant",
  "MachineLearning",
  "LocalLLaMA",
  "fintech",
  "trading",
];

// Keywords to search for (include single words and phrases)
const KEYWORDS = [
  // Phrases
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "AI trading",
  "automated trading",
  "GPT trading",
  "machine learning",
  "quant trading",
  // Single words (broader matching)
  "backtest",
  "backtesting",
  "quantitative",
  "algorithm",
  "automate",
  "automation",
  "bot",
  "ML",
  "LLM",
  "GPT",
];

async function searchRedditPublic(
  query: string,
  subreddits: string[]
): Promise<RedditPost[]> {
  const subredditStr = subreddits.join("+");
  const url = `https://www.reddit.com/r/${subredditStr}/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=10&restrict_sr=on`;

  const response = await fetch(url, {
    headers: {
      // Reddit requires a user agent, but no auth for public endpoints
      "User-Agent": "GrowthDeck-Test/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.children || [];
}

async function main() {
  console.log("🔍 Testing Reddit scraping (no auth required)\n");
  console.log(`Subreddits: ${SUBREDDITS.join(", ")}`);
  console.log(`Keywords: ${KEYWORDS.join(", ")}\n`);
  console.log("─".repeat(60));

  const seen = new Set<string>();
  const results: Array<{
    title: string;
    subreddit: string;
    author: string;
    url: string;
    score: number;
    matchedKeywords: string[];
  }> = [];

  // Search in batches
  const batchSize = 2;
  for (let i = 0; i < KEYWORDS.length; i += batchSize) {
    const batch = KEYWORDS.slice(i, i + batchSize);
    const query = batch.join(" OR ");

    console.log(`\nSearching: "${query}"...`);

    try {
      const posts = await searchRedditPublic(query, SUBREDDITS);
      console.log(`  Found ${posts.length} posts`);

      for (const post of posts) {
        if (seen.has(post.data.id)) continue;
        seen.add(post.data.id);

        const content = `${post.data.title} ${post.data.selftext}`.toLowerCase();
        const matchedKeywords = KEYWORDS.filter((kw) =>
          content.includes(kw.toLowerCase())
        );

        if (matchedKeywords.length === 0) continue;

        results.push({
          title: post.data.title.slice(0, 80) + (post.data.title.length > 80 ? "..." : ""),
          subreddit: post.data.subreddit,
          author: post.data.author,
          url: `https://reddit.com${post.data.permalink}`,
          score: post.data.score,
          matchedKeywords,
        });
      }

      // Rate limiting: be nice to Reddit
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`\n✅ Found ${results.length} relevant posts:\n`);

  // Sort by score (most upvoted first)
  results.sort((a, b) => b.score - a.score);

  for (const post of results.slice(0, 15)) {
    console.log(`📌 [r/${post.subreddit}] ${post.title}`);
    console.log(`   Score: ${post.score} | Author: u/${post.author}`);
    console.log(`   Keywords: ${post.matchedKeywords.join(", ")}`);
    console.log(`   ${post.url}\n`);
  }

  if (results.length > 15) {
    console.log(`... and ${results.length - 15} more posts`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("Test complete! The public API works for basic scraping.");
  console.log("For production (higher rate limits), set up Reddit OAuth.");
}

main().catch(console.error);
