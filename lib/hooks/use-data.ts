/**
 * SWR hooks for client-side data fetching with caching and revalidation.
 *
 * These hooks provide automatic caching, background revalidation, and optimistic updates
 * for client components that need to fetch data from the API.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, error, isLoading, mutate } = useDiscovery({ platform: "REDDIT" });
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error />;
 *   return <PostList posts={data} />;
 * }
 * ```
 */

import useSWR from "swr";
import type { DiscoveredPost, Reply, Platform, ReplyStatus } from "@prisma/client";

/**
 * Generic fetcher that handles errors and JSON parsing.
 * Used internally by all SWR hooks.
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

// ─── Discovery Hooks ─────────────────────────────────────────────────────────

interface UseDiscoveryParams {
  platform?: Platform;
  status?: string;
  intent?: string;
  limit?: number;
}

/**
 * Fetches discovered posts with optional filters.
 *
 * @param params - Optional filter parameters
 * @returns SWR response with posts, loading state, error, and mutate function
 */
export function useDiscovery(params?: UseDiscoveryParams) {
  const searchParams = new URLSearchParams();
  if (params?.platform) searchParams.set("platform", params.platform);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.intent) searchParams.set("intent", params.intent);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const url = `/api/discovery${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR<DiscoveredPost[]>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

/**
 * Fetches dismissed posts with optional search and platform filter.
 *
 * @param params - Optional search and platform filter
 * @returns SWR response with dismissed posts
 */
export function useDismissedPosts(params?: { search?: string; platform?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.platform) searchParams.set("platform", params.platform);

  const url = `/api/discovery/dismissed${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR<DiscoveredPost[]>(url, fetcher, {
    revalidateOnFocus: false,
  });
}

// ─── Replies Hooks ───────────────────────────────────────────────────────────

interface UseRepliesParams {
  platform?: Platform;
  status?: ReplyStatus;
  limit?: number;
}

/**
 * Fetches replies with optional platform, status, and limit filters.
 *
 * @param params - Optional filter parameters
 * @returns SWR response with replies
 */
export function useReplies(params?: UseRepliesParams) {
  const searchParams = new URLSearchParams();
  if (params?.platform) searchParams.set("platform", params.platform);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const url = `/api/replies${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR<Reply[]>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

// ─── Analytics Hooks ─────────────────────────────────────────────────────────

interface AnalyticsSummary {
  totalSpend: number;
  monthlyBudget: number;
  budgetUsedPercent: number;
  postsDiscovered: number;
  repliesSent: number;
  avgRelevanceScore: number;
}

interface SpendData {
  monthlySpend: number;
  weeklySpend: number;
}

/**
 * Fetches analytics summary data with automatic refresh.
 * Refreshes every 60 seconds for near real-time updates.
 *
 * @returns SWR response with analytics summary
 */
export function useAnalyticsSummary() {
  return useSWR<AnalyticsSummary>("/api/analytics/summary", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });
}

/**
 * Fetches current spend data with automatic refresh.
 * Refreshes every 60 seconds for near real-time budget tracking.
 *
 * @returns SWR response with monthly and weekly spend
 */
export function useSpend() {
  return useSWR<SpendData>("/api/analytics/spend", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });
}

// ─── Autopilot Hooks ─────────────────────────────────────────────────────────

/**
 * Fetches autopilot configuration settings.
 *
 * @returns SWR response with autopilot config
 */
export function useAutopilotConfig() {
  return useSWR("/api/autopilot/config", fetcher, {
    revalidateOnFocus: false,
  });
}

// ─── OpenRouter Hooks ────────────────────────────────────────────────────────

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

/**
 * Fetches available OpenRouter models with extended caching.
 * Caches for 5 minutes since model list changes infrequently.
 *
 * @returns SWR response with available models and pricing
 */
export function useOpenRouterModels() {
  return useSWR<OpenRouterModel[]>("/api/openrouter/models", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // Cache for 5 minutes
  });
}
