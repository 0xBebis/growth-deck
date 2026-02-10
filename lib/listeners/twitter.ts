import { prisma } from "@/lib/prisma";
import type { ListenerResult } from "./base";

interface SocialDataTweet {
  id_str: string;
  full_text: string;
  text: string | null;
  tweet_created_at: string;
  in_reply_to_status_id_str: string | null;
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

// Hashtags that indicate AI trading/finance interest
const TARGET_HASHTAGS = [
  "#algotrading",
  "#quanttrading",
  "#tradingbot",
  "#AItrading",
  "#systematictrading",
  "#quant",
  "#fintwit",
  "#tradingalgorithm",
];

// Phrases indicating buying intent or active exploration
const INTENT_PHRASES = [
  '"looking for"',
  '"anyone recommend"',
  '"best tool"',
  '"trying to build"',
  '"want to automate"',
  '"help with"',
  '"struggling with"',
  '"anyone use"',
  '"how do I"',
  '"can I use"',
];

// Terms to exclude (job posts, spam, news)
const EXCLUDE_TERMS = [
  "-hiring",
  "-job",
  "-vacancy",
  "-position",
  "-salary",
  "-remote",
  "-apply",
  "-is:retweet", // Exclude retweets
];

// Core topic keywords (used in API queries)
const TOPIC_KEYWORDS = [
  "trading bot",
  "algo trading",
  "AI trading",
  "automated trading",
  "quant trading",
  "trading algorithm",
  "GPT trading",
  "LLM trading",
  "AI finance",
  "AI stock",
  "machine learning trading",
];

// Keywords that MUST be present in content for a post to be saved
// These are more specific than query keywords to filter out false positives
const REQUIRED_FINANCE_KEYWORDS = [
  // Trading-specific
  "trading bot",
  "trading algorithm",
  "algo trading",
  "algotrading",
  "algorithmic trading",
  "automated trading",
  "quant trading",
  "quantitative trading",
  "systematic trading",
  "high frequency trading",
  "hft",
  "market making",
  // AI + Finance combinations
  "ai trading",
  "gpt trading",
  "llm trading",
  "machine learning trading",
  "ml trading",
  "ai finance",
  "ai stock",
  // Platforms/tools
  "backtest",
  "backtesting",
  "openbb",
  "numerai",
  "alpaca api",
  "trading api",
  "polymarket",
  "prediction market",
  // Finance terms
  "trading strategy",
  "trading system",
  "portfolio optimization",
  "trade execution",
  "order book",
  "crypto trading",
  "forex trading",
  "options trading",
  "futures trading",
  // Community signals
  "#algotrading",
  "#quanttrading",
  "#tradingbot",
  "#aitrading",
  "#fintwit",
  // Products/companies in space
  "trade automation",
  "automate trades",
  "trading signals",
  "financial ai",
  "fintech ai",
];

async function getLastFetchTimestamp(): Promise<number> {
  const latest = await prisma.discoveredPost.findFirst({
    where: { platform: "X" },
    orderBy: { discoveredAt: "desc" },
    select: { discoveredAt: true },
  });
  if (latest) {
    return Math.floor(latest.discoveredAt.getTime() / 1000);
  }
  // Default to 24 hours ago
  return Math.floor(Date.now() / 1000) - 86400;
}

async function searchTwitter(
  query: string,
  sinceTimestamp: number
): Promise<SocialDataTweet[]> {
  const apiKey = process.env.SOCIALDATA_API_KEY;
  if (!apiKey) {
    throw new Error("SOCIALDATA_API_KEY not configured");
  }

  const fullQuery = `${query} since_time:${sinceTimestamp} lang:en`;
  const url = `${SOCIALDATA_API}?query=${encodeURIComponent(fullQuery)}&type=Latest`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`SocialData API error: ${response.status}`);
  }

  const data: SocialDataResponse = await response.json();
  return data.tweets || [];
}

function buildOptimizedQueries(): string[] {
  const excludeStr = EXCLUDE_TERMS.join(" ");
  const queries: string[] = [];

  // Strategy 1: Intent phrases + topic keywords (highest value)
  // "looking for" + "trading bot" -> people actively seeking solutions
  for (const intent of INTENT_PHRASES.slice(0, 5)) {
    const topicOr = TOPIC_KEYWORDS.slice(0, 4)
      .map((t) => `"${t}"`)
      .join(" OR ");
    queries.push(`${intent} (${topicOr}) ${excludeStr} min_faves:2`);
  }

  // Strategy 2: Hashtag-based discovery (community participants)
  // People using #algotrading are likely interested in the space
  const hashtagOr = TARGET_HASHTAGS.slice(0, 4).join(" OR ");
  const intentOr = INTENT_PHRASES.slice(0, 3).join(" OR ");
  queries.push(`(${hashtagOr}) (${intentOr}) ${excludeStr}`);

  // Strategy 3: Direct topic mentions with engagement filter
  // Filters out low-quality/bot content
  for (let i = 0; i < TOPIC_KEYWORDS.length; i += 3) {
    const batch = TOPIC_KEYWORDS.slice(i, i + 3);
    const topicOr = batch.map((t) => `"${t}"`).join(" OR ");
    queries.push(`(${topicOr}) ${excludeStr} min_faves:3 lang:en`);
  }

  return queries;
}

export async function runTwitterListener(): Promise<ListenerResult[]> {
  // Get user-defined keywords from DB (optional extra targeting)
  const userKeywords = await prisma.keyword.findMany({
    where: { isActive: true },
  });
  const userPhrases = userKeywords.map((k) => k.phrase);

  // Build optimized queries
  const queries = buildOptimizedQueries();

  // Add user-defined keyword queries if any
  if (userPhrases.length > 0) {
    const excludeStr = EXCLUDE_TERMS.join(" ");
    const batchSize = 3;
    for (let i = 0; i < userPhrases.length; i += batchSize) {
      const batch = userPhrases.slice(i, i + batchSize);
      const batchOr = batch.map((p) => `"${p}"`).join(" OR ");
      queries.push(`(${batchOr}) ${excludeStr} min_faves:2 lang:en`);
    }
  }

  const lastFetchTimestamp = await getLastFetchTimestamp();
  const results: ListenerResult[] = [];
  const seen = new Set<string>();

  // All keywords for matching (built-in + user-defined)
  const allKeywords = [...TOPIC_KEYWORDS, ...userPhrases];

  for (const query of queries) {
    try {
      const tweets = await searchTwitter(query, lastFetchTimestamp);

      for (const tweet of tweets) {
        if (seen.has(tweet.id_str)) continue;
        seen.add(tweet.id_str);

        const content = tweet.full_text || tweet.text || "";
        if (!content) continue;

        const contentLower = content.toLowerCase();

        // CRITICAL: Require at least one finance keyword to filter false positives
        // The API query might return tweets that matched intent phrases but aren't about trading
        const hasFinanceKeyword = REQUIRED_FINANCE_KEYWORDS.some((kw) =>
          contentLower.includes(kw.toLowerCase())
        );

        if (!hasFinanceKeyword) {
          continue; // Skip tweets without actual finance/trading content
        }

        const matchedKeywords = allKeywords.filter((kw) =>
          contentLower.includes(kw.toLowerCase())
        );

        results.push({
          platform: "X",
          externalId: tweet.id_str,
          externalUrl: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
          authorName: tweet.user.name,
          authorHandle: `@${tweet.user.screen_name}`,
          content,
          threadContext: tweet.in_reply_to_screen_name
            ? `Reply to @${tweet.in_reply_to_screen_name}`
            : null,
          matchedKeywords,
          discoveredAt: new Date(tweet.tweet_created_at),
        });
      }

      // Rate limiting between queries
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`Twitter search error for query:`, error);
    }
  }

  return results;
}
