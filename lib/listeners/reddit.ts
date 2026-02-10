import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/utils/encryption";
import { isLowValueContent, scoreRelevance, getMatchedKeywords } from "@/lib/content/filters";
import type { ListenerResult } from "./base";

interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface RedditPost {
  data: {
    id: string;
    name: string;
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

// Search queries (what we send to Reddit search)
const SEARCH_QUERIES = [
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "AI trading",
  "automated trading",
  "machine learning trading",
  "backtest strategy",
  "quant trading",
  "GPT trading",
  "LLM finance",
];

// Keywords for local matching (broader, catches more posts)
const RELEVANCE_KEYWORDS = [
  // Phrases
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "AI trading",
  "automated trading",
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
  "neural network",
  "predict",
  "prediction",
  "strategy",
];

let cachedToken: { token: string; expiresAt: number } | null = null;

async function authenticate(credentials: RedditCredentials): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const basicAuth = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`
  ).toString("base64");

  const response = await fetch(
    "https://www.reddit.com/api/v1/access_token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "GrowthDeck:v1.0.0 (by /u/growthdeck_bot)",
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: credentials.username,
        password: credentials.password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Reddit auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

// Authenticated search (higher rate limits)
async function searchRedditAuth(
  token: string,
  query: string,
  subreddits: string[]
): Promise<RedditPost[]> {
  const subredditStr = subreddits.join("+");
  const url = `https://oauth.reddit.com/r/${subredditStr}/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=25&restrict_sr=on`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "GrowthDeck:v1.0.0 (by /u/growthdeck_bot)",
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.children || [];
}

// Unauthenticated search (public API, lower rate limits but no credentials needed)
async function searchRedditPublic(
  query: string,
  subreddits: string[]
): Promise<RedditPost[]> {
  const subredditStr = subreddits.join("+");
  const url = `https://www.reddit.com/r/${subredditStr}/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=15&restrict_sr=on`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit public API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.children || [];
}

export async function runRedditListener(): Promise<ListenerResult[]> {
  // Get user-defined keywords from DB (optional extra targeting)
  const userKeywords = await prisma.keyword.findMany({
    where: { isActive: true },
  });
  const userPhrases = userKeywords.map((k) => k.phrase);

  // Try to get Reddit credentials for authenticated access
  const account = await prisma.platformAccount.findFirst({
    where: { platform: "REDDIT", isActive: true },
  });

  let token: string | null = null;
  if (account?.credentials) {
    try {
      const decrypted = decrypt(account.credentials);
      const credentials: RedditCredentials = JSON.parse(decrypted);
      token = await authenticate(credentials);
      console.log("Reddit: Using authenticated API");
    } catch (error) {
      // Log error but don't expose credentials - fall back to public API
      console.warn("Reddit auth failed (credentials may need re-encryption), falling back to public API:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  } else {
    console.log("Reddit: No credentials found, using public API");
  }

  // Build search queries: built-in + user-defined
  const queries = [...SEARCH_QUERIES];
  if (userPhrases.length > 0) {
    // Add user keywords in batches
    const batchSize = 2;
    for (let i = 0; i < userPhrases.length; i += batchSize) {
      const batch = userPhrases.slice(i, i + batchSize);
      queries.push(batch.join(" OR "));
    }
  }

  const results: ListenerResult[] = [];
  const seen = new Set<string>();

  // Limit queries to control API usage
  const maxQueries = token ? 12 : 8; // More queries if authenticated
  const queriesToRun = queries.slice(0, maxQueries);
  const delay = token ? 1000 : 2000; // Longer delay for public API

  for (const query of queriesToRun) {
    try {
      const posts = token
        ? await searchRedditAuth(token, query, TARGET_SUBREDDITS)
        : await searchRedditPublic(query, TARGET_SUBREDDITS);

      for (const post of posts) {
        if (seen.has(post.data.id)) continue;
        seen.add(post.data.id);

        const content = post.data.selftext
          ? `${post.data.title}\n\n${post.data.selftext}`
          : post.data.title;

        // Skip low-value content (job posts, promos)
        if (isLowValueContent(content)) continue;

        // Check relevance using local + user keywords
        const allKeywords = [...RELEVANCE_KEYWORDS, ...userPhrases];
        const relevanceScore = scoreRelevance(content, allKeywords);
        if (relevanceScore === 0) continue;

        const matchedKeywords = getMatchedKeywords(content, allKeywords);

        results.push({
          platform: "REDDIT",
          externalId: post.data.id,
          externalUrl: `https://reddit.com${post.data.permalink}`,
          authorName: null,
          authorHandle: `u/${post.data.author}`,
          content,
          threadContext: `r/${post.data.subreddit}`,
          matchedKeywords,
          discoveredAt: new Date(post.data.created_utc * 1000),
        });
      }

      await new Promise((r) => setTimeout(r, delay));
    } catch (error) {
      console.error(`Reddit search error for "${query}":`, error);
    }
  }

  // Update last fetched if we have an account
  if (account) {
    await prisma.platformAccount.update({
      where: { id: account.id },
      data: { lastFetchedAt: new Date() },
    });
  }

  return results;
}

export async function saveDiscoveredPosts(
  results: ListenerResult[]
): Promise<number> {
  if (results.length === 0) return 0;

  // Batch insert with skipDuplicates - single query instead of N queries
  const createResult = await prisma.discoveredPost.createMany({
    data: results.map((result) => ({
      platform: result.platform,
      externalId: result.externalId,
      externalUrl: result.externalUrl,
      authorName: result.authorName,
      authorHandle: result.authorHandle,
      content: result.content,
      threadContext: result.threadContext,
      matchedKeywords: result.matchedKeywords.join(", "),
      discoveredAt: result.discoveredAt,
    })),
    skipDuplicates: true,
  });

  // Batch keyword match count updates in a transaction
  const keywordCounts = new Map<string, number>();
  for (const result of results) {
    for (const kw of result.matchedKeywords) {
      keywordCounts.set(kw, (keywordCounts.get(kw) ?? 0) + 1);
    }
  }

  if (keywordCounts.size > 0) {
    await prisma.$transaction(
      Array.from(keywordCounts.entries()).map(([phrase, count]) =>
        prisma.keyword.updateMany({
          where: { phrase },
          data: { postsMatched: { increment: count } },
        })
      )
    );
  }

  return createResult.count;
}
