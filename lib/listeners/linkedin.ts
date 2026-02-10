import { prisma } from "@/lib/prisma";
import { isLowValueContent, scoreRelevance, getMatchedKeywords } from "@/lib/content/filters";
import {
  extractLinkedInPostId,
  extractLinkedInAuthorName,
  extractLinkedInAuthorHandle,
  extractLinkedInTimestamp,
  buildLinkedInPostUrl,
  type ApifyLinkedInPost,
} from "@/lib/platforms/linkedin";
import type { ListenerResult } from "./base";

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
        const postId = extractLinkedInPostId(post);
        if (!postId || seen.has(postId)) continue;
        seen.add(postId);

        const content = post.text || "";
        if (!content) continue;

        // Skip low-value content (job posts, promotions)
        if (isLowValueContent(content)) continue;

        // Check relevance score
        const relevanceScore = scoreRelevance(content, allKeywords);
        if (relevanceScore === 0) continue; // Must match at least one keyword

        const matchedKeywords = getMatchedKeywords(content, allKeywords);

        results.push({
          platform: "LINKEDIN",
          externalId: postId,
          externalUrl: buildLinkedInPostUrl(postId),
          authorName: extractLinkedInAuthorName(post),
          authorHandle: extractLinkedInAuthorHandle(post),
          content,
          threadContext: null,
          matchedKeywords,
          discoveredAt: extractLinkedInTimestamp(post),
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
