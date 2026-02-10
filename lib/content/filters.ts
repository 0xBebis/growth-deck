/**
 * Shared content filtering utilities for social media listeners and scrapers.
 * Consolidates duplicate filtering logic from reddit.ts, linkedin.ts, hackernews.ts, and focus-scraper.ts
 */

export interface ContentFilterConfig {
  /** Additional patterns to exclude beyond defaults */
  additionalPatterns?: RegExp[];
  /** Minimum content length (default: 50) */
  minLength?: number;
  /** Skip default exclusion patterns */
  skipDefaultPatterns?: boolean;
}

/**
 * Default patterns to exclude low-value content.
 * Matches job postings, promotional content, spam, and low-effort posts.
 */
export const DEFAULT_EXCLUDE_PATTERNS: RegExp[] = [
  // Job postings
  /\b(hiring|we're hiring|job opening|apply now|join our team|job posting|we're looking for|career|vacancy)\b/i,
  // Promotional/spam
  /\b(check out my course|enroll now|limited spots|sign up for|webinar registration)\b/i,
  /\b(affiliate|promo code|discount|use code|limited time|free trial|click here)\b/i,
  // Low-value HN patterns
  /\b(ask hn: what|tell hn: i)\b/i,
];

/**
 * Checks if content should be filtered out as low-value.
 *
 * @param text - The text content to evaluate
 * @param config - Optional configuration for filtering behavior
 * @returns true if content should be excluded, false if it should be kept
 *
 * @example
 * ```typescript
 * // Basic usage
 * if (isLowValueContent(post.text)) {
 *   continue; // Skip this post
 * }
 *
 * // With custom config
 * const filtered = isLowValueContent(text, {
 *   minLength: 100,
 *   additionalPatterns: [/\bspam pattern\b/i]
 * });
 * ```
 */
export function isLowValueContent(text: string, config?: ContentFilterConfig): boolean {
  const {
    additionalPatterns = [],
    minLength = 50,
    skipDefaultPatterns = false,
  } = config || {};

  // Check minimum length
  if (text.length < minLength) {
    return true;
  }

  // Combine patterns
  const patterns = skipDefaultPatterns
    ? additionalPatterns
    : [...DEFAULT_EXCLUDE_PATTERNS, ...additionalPatterns];

  // Check against exclusion patterns
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Scores content relevance based on keyword matches.
 * Higher scores indicate more relevant content.
 *
 * @param text - The text content to score
 * @param keywords - Array of keywords to match against
 * @returns Number of keyword matches found
 *
 * @example
 * ```typescript
 * const keywords = ['trading bot', 'algo trading', 'backtest'];
 * const score = scoreRelevance(post.content, keywords);
 * if (score >= 2) {
 *   // High relevance post
 * }
 * ```
 */
export function scoreRelevance(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score++;
    }
  }

  return score;
}

/**
 * Returns the list of keywords that match within the given text.
 *
 * @param text - The text content to search
 * @param keywords - Array of keywords to match against
 * @returns Array of matched keywords
 *
 * @example
 * ```typescript
 * const matched = getMatchedKeywords(post.content, userKeywords);
 * // matched = ['trading bot', 'backtest']
 * ```
 */
export function getMatchedKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter((kw) => lowerText.includes(kw.toLowerCase()));
}

/**
 * Strips HTML tags from text content.
 * Useful for cleaning HN comments and other HTML-formatted content.
 *
 * @param html - Text potentially containing HTML tags
 * @returns Plain text with HTML tags removed
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}
