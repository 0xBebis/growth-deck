import { prisma } from "@/lib/prisma";
import { isLowValueContent, getMatchedKeywords, stripHtmlTags } from "@/lib/content/filters";
import type { ListenerResult } from "./base";

interface HNHit {
  objectID: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  story_text?: string;
  author: string;
  url?: string;
  story_url?: string;
  created_at_i: number;
  parent_id?: number;
  num_comments?: number;
  points?: number;
  _tags: string[];
}

interface HNSearchResponse {
  hits: HNHit[];
}

const HN_API = "https://hn.algolia.com/api/v1";

// Optimized search queries for AI trading/finance on HN
const HN_SEARCH_QUERIES = [
  "trading bot",
  "algo trading",
  "algorithmic trading",
  "quantitative trading",
  "automated trading",
  "machine learning trading",
  "AI finance",
  "backtest",
  "trading strategy",
  "quant finance",
];

// Keywords for relevance matching
const RELEVANCE_KEYWORDS = [
  "trading bot", "algo trading", "algorithmic trading", "AI trading",
  "automated trading", "machine learning", "quant", "quantitative",
  "backtest", "backtesting", "algorithm", "trading strategy",
  "finance", "fintech", "portfolio", "stock", "crypto",
  "LLM", "GPT", "neural network", "reinforcement learning",
];

async function getLastFetchTimestamp(): Promise<number> {
  // Use the most recent HN DiscoveredPost's discoveredAt as the watermark,
  // falling back to 1 hour ago if no posts exist yet.
  const latest = await prisma.discoveredPost.findFirst({
    where: { platform: "HN" },
    orderBy: { discoveredAt: "desc" },
    select: { discoveredAt: true },
  });
  if (latest) {
    return Math.floor(latest.discoveredAt.getTime() / 1000);
  }
  return Math.floor(Date.now() / 1000) - 3600;
}

async function searchHN(
  query: string,
  type: "story" | "comment",
  sinceTimestamp: number
): Promise<HNHit[]> {
  const tags = type === "story" ? "story" : "comment";
  const url = `${HN_API}/search_by_date?query=${encodeURIComponent(query)}&tags=${tags}&numericFilters=created_at_i>${sinceTimestamp}&hitsPerPage=50`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HN API error: ${response.status}`);
  }

  const data: HNSearchResponse = await response.json();
  return data.hits;
}

export async function runHNListener(): Promise<ListenerResult[]> {
  // Get user-defined keywords from DB
  const userKeywords = await prisma.keyword.findMany({
    where: { isActive: true },
  });
  const userPhrases = userKeywords.map((k) => k.phrase);

  // Use built-in optimized queries + user-defined keywords
  const queries = [...HN_SEARCH_QUERIES, ...userPhrases.slice(0, 5)];

  // Search last 24 hours for fresh content
  const lastFetchTimestamp = Math.floor(Date.now() / 1000) - 86400;
  const results: ListenerResult[] = [];
  const seen = new Set<string>();

  // Search stories and comments separately
  for (const type of ["story", "comment"] as const) {
    for (const query of queries.slice(0, 8)) {
      try {
        const hits = await searchHN(query, type, lastFetchTimestamp);

        for (const hit of hits) {
          if (seen.has(hit.objectID)) continue;
          seen.add(hit.objectID);

          const content =
            type === "story"
              ? [hit.title, hit.story_text].filter(Boolean).join("\n\n")
              : hit.comment_text || "";

          if (!content) continue;

          // Strip HTML and check for low-value content
          const plainContent = stripHtmlTags(content);
          if (isLowValueContent(plainContent)) continue;

          // Check relevance using local + user keywords
          const allKeywords = [...RELEVANCE_KEYWORDS, ...userPhrases];
          const matchedKeywords = getMatchedKeywords(plainContent, allKeywords);
          if (matchedKeywords.length === 0) continue;

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
            matchedKeywords,
            discoveredAt: new Date(hit.created_at_i * 1000),
          });
        }

        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.error(`HN search error for "${query}" (${type}):`, error);
      }
    }
  }

  return results;
}
