/**
 * LinkedIn Scraper via Google Search (Serper.dev)
 *
 * Cost comparison:
 * - Apify: ~$0.10-0.25 per actor run
 * - Serper: ~$0.001 per search (100x cheaper)
 *
 * Approach: Search Google for LinkedIn posts matching keywords,
 * then extract post content from search snippets.
 */

import { getCacheKey, withCache } from "@/lib/cache/query-cache";
import { isLowValueContent } from "@/lib/content/filters";
import type { FocusScrapeResult } from "./focus-scraper";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface SerperResponse {
  organic: SerperResult[];
  searchParameters?: {
    q: string;
  };
}

// Cache LinkedIn results for 2 hours (posts don't change often)
const LINKEDIN_CACHE_TTL = 2 * 60 * 60 * 1000;

/**
 * Search LinkedIn via Google using Serper.dev API
 */
async function searchLinkedInViaGoogle(query: string): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return [];
  }

  // Search for LinkedIn posts specifically
  const googleQuery = `site:linkedin.com/posts OR site:linkedin.com/feed "${query}"`;

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: googleQuery,
      num: 20, // Results per search
      tbs: "qdr:w", // Past week
    }),
  });

  if (!response.ok) {
    console.error(`Serper API error: ${response.status}`);
    return [];
  }

  const data: SerperResponse = await response.json();
  return data.organic || [];
}

/**
 * Extract LinkedIn post ID from URL
 */
function extractPostIdFromUrl(url: string): string | null {
  // LinkedIn post URLs:
  // https://www.linkedin.com/posts/username_activity-1234567890_...
  // https://www.linkedin.com/feed/update/urn:li:activity:1234567890

  const activityMatch = url.match(/activity[:\-](\d+)/);
  if (activityMatch) {
    return activityMatch[1];
  }

  const postMatch = url.match(/linkedin\.com\/posts\/[^\/]+_([^\/]+)/);
  if (postMatch) {
    return postMatch[1];
  }

  return null;
}

/**
 * Extract author handle from LinkedIn URL
 */
function extractAuthorFromUrl(url: string): string | null {
  const match = url.match(/linkedin\.com\/(?:posts|in)\/([^\/\?_]+)/);
  return match ? match[1] : null;
}

/**
 * Scrape LinkedIn using Serper (Google Search)
 * Primary method - 100x cheaper than Apify
 */
export async function scrapeLinkedInSerper(
  queries: string[]
): Promise<FocusScrapeResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn("SERPER_API_KEY not configured, LinkedIn via Google disabled");
    return [];
  }

  const results: FocusScrapeResult[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 10)) {
    const cacheKey = getCacheKey("LINKEDIN_SERPER", query);

    try {
      const { data: searchResults, cached } = await withCache(
        cacheKey,
        () => searchLinkedInViaGoogle(query),
        LINKEDIN_CACHE_TTL
      );

      if (cached) {
        console.log(`[LinkedIn/Serper] Cache hit for: ${query}`);
      }

      for (const result of searchResults) {
        // Only process LinkedIn post URLs
        if (!result.link.includes("linkedin.com/posts") &&
            !result.link.includes("linkedin.com/feed")) {
          continue;
        }

        const postId = extractPostIdFromUrl(result.link);
        if (!postId || seen.has(postId)) continue;
        seen.add(postId);

        // Use snippet as content (from Google's index)
        const content = `${result.title}\n\n${result.snippet}`;

        if (isLowValueContent(content)) continue;

        const authorHandle = extractAuthorFromUrl(result.link);

        results.push({
          platform: "LINKEDIN",
          externalId: postId,
          externalUrl: result.link,
          authorName: null,
          authorHandle: authorHandle,
          content,
          threadContext: null,
          matchedKeywords: [query],
          discoveredAt: result.date
            ? new Date(result.date).toISOString()
            : new Date().toISOString(),
        });
      }

      // Small delay between queries
      await new Promise(r => setTimeout(r, 200));

    } catch (error) {
      console.error(`LinkedIn/Serper error for "${query}":`, error);
    }
  }

  return results;
}

/**
 * Check if Serper is available
 */
export function isSerperConfigured(): boolean {
  return !!process.env.SERPER_API_KEY;
}
