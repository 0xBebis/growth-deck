/**
 * Typed API client for frontend components.
 * Provides consistent error handling, retries, and type safety for all API calls.
 */

import {
  ApiError,
  NetworkError,
  RateLimitError,
  ValidationError,
  AuthenticationError,
  isRetryableError,
} from "./errors";

export interface ApiClientConfig {
  /** Base URL for API requests (defaults to empty for same-origin) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts for retryable errors (default: 2) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseUrl: "",
  timeout: 30000,
  retries: 2,
  retryDelay: 1000,
};

let globalConfig: Required<ApiClientConfig> = { ...DEFAULT_CONFIG };

/**
 * Configure the global API client settings.
 */
export function configureApiClient(config: ApiClientConfig): void {
  globalConfig = { ...DEFAULT_CONFIG, ...config };
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes an API request with automatic error handling and retries.
 */
async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  options?: {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    config?: ApiClientConfig;
  }
): Promise<T> {
  const config = { ...globalConfig, ...options?.config };
  const url = new URL(path, config.baseUrl || window.location.origin);

  // Add query params
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(config.timeout),
  };

  if (options?.body && method !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= config.retries) {
    try {
      const response = await fetch(url.toString(), fetchOptions);

      // Handle rate limiting with Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : config.retryDelay;
        throw new RateLimitError("Rate limit exceeded", retryMs);
      }

      // Parse response
      let data: unknown;
      const contentType = response.headers.get("Content-Type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const errorMessage =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : `Request failed with status ${response.status}`;

        if (response.status === 400) {
          throw new ValidationError(errorMessage, data);
        }
        if (response.status === 401) {
          throw new AuthenticationError(errorMessage);
        }
        throw new ApiError(errorMessage, response.status, "API_ERROR", data);
      }

      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Convert fetch errors to NetworkError
      if (error instanceof TypeError && error.message.includes("fetch")) {
        lastError = new NetworkError(error.message);
      }

      // Only retry on retryable errors
      if (isRetryableError(lastError) && attempts < config.retries) {
        attempts++;
        const delay =
          lastError instanceof RateLimitError && lastError.retryAfter
            ? lastError.retryAfter
            : config.retryDelay * attempts;
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new NetworkError("Request failed after retries");
}

// ─── Convenience Methods ─────────────────────────────────────────────────────

function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return request<T>("GET", path, { params });
}

function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, { body });
}

function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, { body });
}

function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, { body });
}

function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

// ─── Domain-Specific API Methods ─────────────────────────────────────────────

import type { DiscoveredPost, Reply, Platform, ReplyStatus } from "@prisma/client";

export interface DiscoveryParams {
  platform?: Platform;
  status?: string;
  intent?: string;
  limit?: number;
  offset?: number;
}

export interface ReplyParams {
  platform?: Platform;
  status?: ReplyStatus;
  limit?: number;
}

export interface AnalyticsSummary {
  totalSpend: number;
  monthlyBudget: number;
  budgetUsedPercent: number;
  postsDiscovered: number;
  repliesSent: number;
  avgRelevanceScore: number;
}

export interface SpendData {
  monthlySpend: number;
  weeklySpend: number;
}

/**
 * Typed API client with domain-specific methods.
 */
export const api = {
  discovery: {
    /** Get discovered posts with optional filters */
    get: (params?: DiscoveryParams) =>
      apiGet<DiscoveredPost[]>("/api/discovery", params as Record<string, string | number | boolean | undefined>),

    /** Get a single discovered post by ID */
    getById: (id: string) => apiGet<DiscoveredPost>(`/api/discovery/${id}`),

    /** Generate a draft reply for a post */
    draft: (postId: string) =>
      apiPost<Reply>(`/api/discovery/${postId}/draft`),

    /** Bulk dismiss posts */
    dismiss: (ids: string[]) =>
      apiPost<{ dismissed: number }>("/api/discovery/dismissed", { ids }),

    /** Get dismissed posts */
    getDismissed: (params?: { search?: string; platform?: string; page?: number }) =>
      apiGet<DiscoveredPost[]>("/api/discovery/dismissed", params),

    /** Restore a dismissed post */
    restore: (id: string) =>
      apiPost<DiscoveredPost>(`/api/discovery/${id}/restore`),
  },

  replies: {
    /** Get replies with optional filters */
    get: (params?: ReplyParams) => apiGet<Reply[]>("/api/replies", params as Record<string, string | number | boolean | undefined>),

    /** Get a single reply by ID */
    getById: (id: string) => apiGet<Reply>(`/api/replies/${id}`),

    /** Update reply content */
    update: (id: string, data: { finalContent?: string; platformAccountId?: string }) =>
      apiPatch<Reply>(`/api/replies/${id}`, data),

    /** Regenerate reply with AI */
    regenerate: (id: string) => apiPost<Reply>(`/api/replies/${id}/regenerate`),

    /** Mark reply as sent */
    send: (id: string) => apiPost<Reply>(`/api/replies/${id}/send`),

    /** Delete a reply */
    delete: (id: string) => apiDelete<void>(`/api/replies/${id}`),
  },

  analytics: {
    /** Get analytics summary */
    getSummary: () => apiGet<AnalyticsSummary>("/api/analytics/summary"),

    /** Get spend data */
    getSpend: () => apiGet<SpendData>("/api/analytics/spend"),
  },

  openrouter: {
    /** Send a chat completion request */
    chat: (data: { model: string; messages: unknown[]; temperature?: number }) =>
      apiPost<{ content: string }>("/api/openrouter/chat", data),

    /** Get available models */
    getModels: () => apiGet<unknown[]>("/api/openrouter/models"),
  },

  autopilot: {
    /** Get autopilot config */
    getConfig: () => apiGet<unknown>("/api/autopilot/config"),

    /** Update autopilot config */
    updateConfig: (data: unknown) => apiPatch<unknown>("/api/autopilot/config", data),
  },

  scrape: {
    /** Start a focus scrape (returns SSE stream) */
    focus: (data: { focus: string; platforms: string[] }) =>
      // Note: This returns a Response for SSE streaming, not JSON
      fetch("/api/scrape/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  },
};

export default api;
