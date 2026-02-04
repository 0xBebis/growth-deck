import { prisma } from "@/lib/prisma";
import type { ListenerResult } from "./base";

interface ApifyLinkedInPost {
  urn?: string;
  url?: string;
  text?: string;
  postedAtTimestamp?: number;
  postedAtISO?: string;
  authorFullName?: string;
  authorProfileUrl?: string;
  authorProfileId?: string;
  // Some actor versions use nested structures
  author?: {
    name?: string;
    profileUrl?: string;
    profileId?: string;
  };
  postedAt?: {
    date?: string;
    timestamp?: number;
  };
}

const APIFY_ACTOR = "supreme_coder~linkedin-post";
const APIFY_API = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;

// High-intent search queries for AI trading/finance on LinkedIn
// LinkedIn doesn't support complex boolean, so we use targeted phrase combinations
const LINKEDIN_SEARCH_QUERIES = [
  // People seeking solutions
  "looking for trading bot",
  "looking for algo trading",
  "need automated trading",
  "recommend trading algorithm",
  "anyone using AI trading",
  // People exploring/building
  "building trading bot",
  "trying to automate trading",
  "experimenting with algo trading",
  "learning quant trading",
  // Discussion/question posts
  "AI trading strategy",
  "machine learning finance",
  "GPT for trading",
  "LLM financial analysis",
  "automated portfolio management",
];

// Keywords to match in post content (for scoring relevance)
const RELEVANCE_KEYWORDS = [
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "automated trading",
  "quant",
  "quantitative",
  "AI trading",
  "machine learning",
  "GPT",
  "LLM",
  "financial analysis",
  "portfolio",
  "backtesting",
  "systematic trading",
];

// Keywords that indicate low-value content (job posts, promotions)
const EXCLUDE_PATTERNS = [
  /hiring|we're looking for|job opportunity|open position|apply now/i,
  /join our team|career|vacancy|remote position/i,
  /webinar registration|sign up for|limited spots/i,
  /\$\d+k|\d+% off|discount|promo code/i,
];

function extractPostId(post: ApifyLinkedInPost): string | null {
  // Try URN first: "urn:li:activity:7123456789012345678"
  if (post.urn) {
    const match = post.urn.match(/(\d+)$/);
    if (match) return match[1];
  }
  // Try URL: contains activity ID
  if (post.url) {
    const match = post.url.match(/activity[:-](\d+)/);
    if (match) return match[1];
  }
  return null;
}

function extractAuthorName(post: ApifyLinkedInPost): string | null {
  return post.authorFullName || post.author?.name || null;
}

function extractAuthorHandle(post: ApifyLinkedInPost): string | null {
  return (
    post.authorProfileUrl ||
    post.author?.profileUrl ||
    post.authorProfileId ||
    post.author?.profileId ||
    null
  );
}

function extractTimestamp(post: ApifyLinkedInPost): Date {
  if (post.postedAtTimestamp) return new Date(post.postedAtTimestamp);
  if (post.postedAtISO) return new Date(post.postedAtISO);
  if (post.postedAt?.timestamp) return new Date(post.postedAt.timestamp);
  if (post.postedAt?.date) return new Date(post.postedAt.date);
  return new Date();
}

function isLowValueContent(text: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(text));
}

function scoreRelevance(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score++;
    }
  }
  return score;
}

async function searchLinkedIn(query: string): Promise<ApifyLinkedInPost[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN not configured");
  }

  // Add datePosted=past-week to only get recent content (saves API costs)
  const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&datePosted=%22past-week%22&sortBy=%22date_posted%22`;

  const response = await fetch(`${APIFY_API}?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls: [searchUrl],
      limitPerSource: 20, // Reduced from 25 to save costs
      deepScrape: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status}`);
  }

  return response.json();
}

export async function runLinkedInListener(): Promise<ListenerResult[]> {
  // Get user-defined keywords from DB (optional extra targeting)
  const userKeywords = await prisma.keyword.findMany({
    where: { isActive: true },
  });
  const userPhrases = userKeywords.map((k) => k.phrase);

  // Use built-in optimized queries + user-defined keywords
  const queries = [...LINKEDIN_SEARCH_QUERIES];
  if (userPhrases.length > 0) {
    queries.push(...userPhrases);
  }

  // All keywords for matching (built-in + user-defined)
  const allKeywords = [...RELEVANCE_KEYWORDS, ...userPhrases];

  const results: ListenerResult[] = [];
  const seen = new Set<string>();

  // Limit queries to control costs (LinkedIn API is more expensive)
  const maxQueries = 10;
  const queriesToRun = queries.slice(0, maxQueries);

  for (const query of queriesToRun) {
    try {
      const posts = await searchLinkedIn(query);

      for (const post of posts) {
        const postId = extractPostId(post);
        if (!postId || seen.has(postId)) continue;
        seen.add(postId);

        const content = post.text || "";
        if (!content) continue;

        // Skip low-value content (job posts, promotions)
        if (isLowValueContent(content)) continue;

        // Check relevance score
        const relevanceScore = scoreRelevance(content);
        if (relevanceScore === 0) continue; // Must match at least one keyword

        const matchedKeywords = allKeywords.filter((kw) =>
          content.toLowerCase().includes(kw.toLowerCase())
        );

        results.push({
          platform: "LINKEDIN",
          externalId: postId,
          // Always use the canonical feed URL format - Apify URLs are often malformed
          externalUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${postId}`,
          authorName: extractAuthorName(post),
          authorHandle: extractAuthorHandle(post),
          content,
          threadContext: null,
          matchedKeywords,
          discoveredAt: extractTimestamp(post),
        });
      }

      // Longer delay for LinkedIn (more expensive, be conservative)
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`LinkedIn search error for "${query}":`, error);
    }
  }

  return results;
}
