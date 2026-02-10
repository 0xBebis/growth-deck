import type { Platform } from "@prisma/client";
import { isLowValueContent, stripHtmlTags } from "@/lib/content/filters";
import { getCacheKey, withCache } from "@/lib/cache/query-cache";
import {
  extractLinkedInPostId,
  extractLinkedInTimestamp,
  buildLinkedInPostUrl,
  type ApifyLinkedInPost,
} from "@/lib/platforms/linkedin";
import { scrapeLinkedInSerper, isSerperConfigured } from "./linkedin-serper";

// Cache TTLs
const TWITTER_CACHE_TTL = 30 * 60 * 1000; // 30 min (fast-moving)
const REDDIT_CACHE_TTL = 60 * 60 * 1000;  // 1 hour
const HN_CACHE_TTL = 60 * 60 * 1000;      // 1 hour

export interface FocusScrapeResult {
  platform: string;
  externalId: string;
  externalUrl: string;
  authorName: string | null;
  authorHandle: string | null;
  content: string;
  threadContext: string | null;
  matchedKeywords: string[];
  discoveredAt: string;
}

/**
 * Runs a focus scrape for a specific platform with given queries.
 * Returns results without persisting to database.
 */
export async function runFocusScrape(
  platform: Platform,
  queries: string[]
): Promise<FocusScrapeResult[]> {
  switch (platform) {
    case "X":
      return scrapeTwitterFocus(queries);
    case "REDDIT":
      return scrapeRedditFocus(queries);
    case "LINKEDIN":
      return scrapeLinkedInFocus(queries);
    case "HN":
      return scrapeHNFocus(queries);
    default:
      return [];
  }
}

/**
 * Twitter/X focus scraping using SocialData API
 */
async function scrapeTwitterFocus(queries: string[]): Promise<FocusScrapeResult[]> {
  const apiKey = process.env.SOCIALDATA_API_KEY;
  if (!apiKey) {
    console.warn("SOCIALDATA_API_KEY not configured, skipping Twitter");
    return [];
  }

  const results: FocusScrapeResult[] = [];
  const seen = new Set<string>();

  // Search last 24 hours
  const sinceTimestamp = Math.floor(Date.now() / 1000) - 86400;

  for (const query of queries.slice(0, 5)) {
    const cacheKey = getCacheKey("TWITTER", query);

    try {
      const { data, cached } = await withCache(
        cacheKey,
        async () => {
          const fullQuery = `${query} since_time:${sinceTimestamp} lang:en`;
          const url = `https://api.socialdata.tools/twitter/search?query=${encodeURIComponent(fullQuery)}&type=Latest`;

          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Twitter API error: ${response.status}`);
          }

          return response.json();
        },
        TWITTER_CACHE_TTL
      );

      if (cached) {
        console.log(`[Twitter] Cache hit for: ${query}`);
      }

      const tweets = data.tweets || [];

      for (const tweet of tweets) {
        if (seen.has(tweet.id_str)) continue;
        seen.add(tweet.id_str);

        const content = tweet.full_text || tweet.text || "";
        if (!content) continue;

        // Skip tweets without user data (suspended/deleted accounts)
        if (!tweet.user?.screen_name) continue;

        // Skip low-quality content
        if (isLowValueContent(content)) continue;

        results.push({
          platform: "X",
          externalId: tweet.id_str,
          externalUrl: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
          authorName: tweet.user.name || null,
          authorHandle: `@${tweet.user.screen_name}`,
          content,
          threadContext: tweet.in_reply_to_screen_name
            ? `Reply to @${tweet.in_reply_to_screen_name}`
            : null,
          matchedKeywords: [query],
          discoveredAt: new Date(tweet.tweet_created_at).toISOString(),
        });
      }

      await delay(500);
    } catch (error) {
      console.error(`Twitter focus search error for "${query}":`, error);
    }
  }

  return results;
}

/**
 * Reddit focus scraping using public API
 */
async function scrapeRedditFocus(queries: string[]): Promise<FocusScrapeResult[]> {
  const results: FocusScrapeResult[] = [];
  const seen = new Set<string>();

  // Target relevant subreddits
  const subreddits = [
    "algotrading",
    "MachineLearning",
    "LocalLLaMA",
    "fintech",
    "startups",
    "SideProject",
    "EntrepreneurRideAlong",
    "smallbusiness",
  ];
  const subredditStr = subreddits.join("+");

  for (const query of queries.slice(0, 5)) {
    try {
      const url = `https://www.reddit.com/r/${subredditStr}/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=15&restrict_sr=on`;

      const response = await fetch(url, {
        headers: { "User-Agent": "GrowthDeck:v1.0.0 (Focus Scrape)" },
      });

      if (!response.ok) {
        console.error(`Reddit API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const posts = data.data?.children || [];

      for (const post of posts) {
        const postData = post.data;
        if (seen.has(postData.id)) continue;
        seen.add(postData.id);

        const content = postData.selftext
          ? `${postData.title}\n\n${postData.selftext}`
          : postData.title;

        // Skip low-quality content
        if (isLowValueContent(content)) continue;

        results.push({
          platform: "REDDIT",
          externalId: postData.id,
          externalUrl: `https://reddit.com${postData.permalink}`,
          authorName: null,
          authorHandle: `u/${postData.author}`,
          content,
          threadContext: `r/${postData.subreddit}`,
          matchedKeywords: [query],
          discoveredAt: new Date(postData.created_utc * 1000).toISOString(),
        });
      }

      await delay(2000);
    } catch (error) {
      console.error(`Reddit focus search error for "${query}":`, error);
    }
  }

  return results;
}

/**
 * Hacker News focus scraping using Algolia API
 */
async function scrapeHNFocus(queries: string[]): Promise<FocusScrapeResult[]> {
  const results: FocusScrapeResult[] = [];
  const seen = new Set<string>();

  // Search last 24 hours
  const sinceTimestamp = Math.floor(Date.now() / 1000) - 86400;

  for (const query of queries.slice(0, 5)) {
    for (const type of ["story", "comment"] as const) {
      try {
        const tags = type === "story" ? "story" : "comment";
        const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=${tags}&numericFilters=created_at_i>${sinceTimestamp}&hitsPerPage=25`;

        const response = await fetch(url);
        if (!response.ok) {
          console.error(`HN API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const hits = data.hits || [];

        for (const hit of hits) {
          if (seen.has(hit.objectID)) continue;
          seen.add(hit.objectID);

          const content =
            type === "story"
              ? [hit.title, hit.story_text].filter(Boolean).join("\n\n")
              : hit.comment_text || "";

          if (!content) continue;

          // Strip HTML tags
          const plainContent = stripHtmlTags(content);

          // Skip low-quality content
          if (isLowValueContent(plainContent)) continue;

          results.push({
            platform: "HN",
            externalId: hit.objectID,
            externalUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            authorName: null,
            authorHandle: hit.author,
            content: plainContent,
            threadContext:
              type === "comment" && hit.story_title
                ? `Re: ${hit.story_title}`
                : null,
            matchedKeywords: [query],
            discoveredAt: new Date(hit.created_at_i * 1000).toISOString(),
          });
        }

        await delay(300);
      } catch (error) {
        console.error(`HN focus search error for "${query}" (${type}):`, error);
      }
    }
  }

  return results;
}

/**
 * LinkedIn focus scraping
 * Primary: Serper.dev (Google Search) - ~$0.001/search
 * Fallback: Apify - ~$0.10+/run
 */
async function scrapeLinkedInFocus(queries: string[]): Promise<FocusScrapeResult[]> {
  // Try Serper first (100x cheaper)
  if (isSerperConfigured()) {
    console.log("[LinkedIn] Using Serper.dev (Google Search)");
    const results = await scrapeLinkedInSerper(queries);
    if (results.length > 0) {
      return results;
    }
    console.log("[LinkedIn] Serper returned no results, trying Apify fallback");
  }

  // Fallback to Apify (expensive, but more comprehensive)
  return scrapeLinkedInApify(queries);
}

/**
 * LinkedIn scraping via Apify (fallback - expensive)
 */
async function scrapeLinkedInApify(queries: string[]): Promise<FocusScrapeResult[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.warn("APIFY_TOKEN not configured, skipping LinkedIn");
    return [];
  }

  const results: FocusScrapeResult[] = [];
  const seen = new Set<string>();

  // LinkedIn is expensive, limit to 3 queries
  for (const query of queries.slice(0, 3)) {
    const cacheKey = getCacheKey("LINKEDIN_APIFY", query);

    try {
      const { data: posts, cached } = await withCache(
        cacheKey,
        async () => {
          const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&datePosted=%22past-week%22&sortBy=%22date_posted%22`;

          const response = await fetch(
            `https://api.apify.com/v2/acts/supreme_coder~linkedin-post/run-sync-get-dataset-items?token=${token}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                urls: [searchUrl],
                limitPerSource: 10,
                deepScrape: false,
              }),
              signal: AbortSignal.timeout(90_000),
            }
          );

          if (!response.ok) {
            throw new Error(`Apify API error: ${response.status}`);
          }

          return response.json();
        },
        2 * 60 * 60 * 1000 // 2 hour cache
      );

      if (cached) {
        console.log(`[LinkedIn/Apify] Cache hit for: ${query}`);
      }

      for (const post of posts) {
        const linkedInPost = post as ApifyLinkedInPost;
        const postId = extractLinkedInPostId(linkedInPost);
        if (!postId || seen.has(postId)) continue;
        seen.add(postId);

        const content = linkedInPost.text || "";
        if (!content) continue;

        if (isLowValueContent(content)) continue;

        results.push({
          platform: "LINKEDIN",
          externalId: postId,
          externalUrl: buildLinkedInPostUrl(postId),
          authorName: linkedInPost.authorFullName || linkedInPost.author?.name || null,
          authorHandle: linkedInPost.authorProfileUrl || null,
          content,
          threadContext: null,
          matchedKeywords: [query],
          discoveredAt: extractLinkedInTimestamp(linkedInPost).toISOString(),
        });
      }

      await delay(2000);
    } catch (error) {
      console.error(`LinkedIn/Apify error for "${query}":`, error);
    }
  }

  return results;
}

// Helper functions

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
