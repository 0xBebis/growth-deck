/**
 * Query Cache - Prevents duplicate API calls within a time window.
 * Uses in-memory cache with TTL. For production, consider Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 1 hour
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Generate a cache key for a query
 */
export function getCacheKey(platform: string, query: string): string {
  return `${platform}:${query.toLowerCase().trim()}`;
}

/**
 * Get cached result if available and not expired
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store result in cache
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clear expired entries (call periodically)
 */
export function clearExpired(): number {
  let cleared = 0;
  const now = Date.now();

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleared++;
    }
  }

  return cleared;
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Wrapper for cached API calls
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<{ data: T; cached: boolean }> {
  const cached = getCached<T>(key);
  if (cached !== null) {
    return { data: cached, cached: true };
  }

  const data = await fetcher();
  setCache(key, data, ttlMs);
  return { data, cached: false };
}
