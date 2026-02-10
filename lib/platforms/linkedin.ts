/**
 * LinkedIn-specific utilities for data extraction from Apify scraped posts.
 * Consolidates duplicate extraction logic from linkedin.ts listener and focus-scraper.ts.
 */

/**
 * Shape of LinkedIn post data from Apify scraper.
 * Apify actors may return data in various structures depending on version.
 */
export interface ApifyLinkedInPost {
  urn?: string;
  url?: string;
  text?: string;
  postedAtTimestamp?: number;
  postedAtISO?: string;
  authorFullName?: string;
  authorProfileUrl?: string;
  authorProfileId?: string;
  /** Some actor versions use nested structures */
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

/**
 * Extracts the LinkedIn activity ID from a post.
 * Handles both URN format and URL format.
 *
 * @param post - Apify LinkedIn post data
 * @returns Activity ID string or null if not found
 *
 * @example
 * ```typescript
 * const id = extractLinkedInPostId(post);
 * // From URN: "urn:li:activity:7123456789012345678" → "7123456789012345678"
 * // From URL: "...activity-7123456789012345678..." → "7123456789012345678"
 * ```
 */
export function extractLinkedInPostId(post: ApifyLinkedInPost): string | null {
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

/**
 * Extracts the author's display name from a LinkedIn post.
 * Handles various Apify actor response formats.
 *
 * @param post - Apify LinkedIn post data
 * @returns Author name or null if not found
 */
export function extractLinkedInAuthorName(post: ApifyLinkedInPost): string | null {
  return post.authorFullName || post.author?.name || null;
}

/**
 * Extracts the author's profile URL or ID from a LinkedIn post.
 *
 * @param post - Apify LinkedIn post data
 * @returns Profile URL/ID or null if not found
 */
export function extractLinkedInAuthorHandle(post: ApifyLinkedInPost): string | null {
  return (
    post.authorProfileUrl ||
    post.author?.profileUrl ||
    post.authorProfileId ||
    post.author?.profileId ||
    null
  );
}

/**
 * Extracts and normalizes the post timestamp from a LinkedIn post.
 * Handles various timestamp formats from Apify actors.
 *
 * @param post - Apify LinkedIn post data
 * @returns Date object (defaults to current time if no timestamp found)
 *
 * @example
 * ```typescript
 * const timestamp = extractLinkedInTimestamp(post);
 * console.log(timestamp.toISOString());
 * ```
 */
export function extractLinkedInTimestamp(post: ApifyLinkedInPost): Date {
  // Direct timestamp (milliseconds)
  if (post.postedAtTimestamp) {
    return new Date(post.postedAtTimestamp);
  }

  // ISO string format
  if (post.postedAtISO) {
    return new Date(post.postedAtISO);
  }

  // Nested timestamp object
  if (post.postedAt?.timestamp) {
    return new Date(post.postedAt.timestamp);
  }

  // Nested date string
  if (post.postedAt?.date) {
    return new Date(post.postedAt.date);
  }

  // Fallback to current time
  return new Date();
}

/**
 * Builds the LinkedIn post URL from an activity ID.
 *
 * @param activityId - LinkedIn activity ID
 * @returns Full LinkedIn post URL
 */
export function buildLinkedInPostUrl(activityId: string): string {
  return `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`;
}

/**
 * Builds the LinkedIn search URL for a query.
 *
 * @param query - Search query
 * @param options - Search options (date filter, sort order)
 * @returns LinkedIn search URL
 */
export function buildLinkedInSearchUrl(
  query: string,
  options?: { datePosted?: "past-week" | "past-month"; sortBy?: "date_posted" | "relevance" }
): string {
  const { datePosted = "past-week", sortBy = "date_posted" } = options || {};
  const params = new URLSearchParams({
    keywords: query,
    datePosted: `"${datePosted}"`,
    sortBy: `"${sortBy}"`,
  });
  return `https://www.linkedin.com/search/results/content/?${params.toString()}`;
}
