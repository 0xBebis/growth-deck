/**
 * API module exports.
 * Import from '@/lib/api' for all API utilities.
 */

// Error types
export {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  NetworkError,
  isRetryableError,
  getErrorMessage,
  toApiError,
} from "./errors";

// Route helpers (server-side)
export {
  withAuth,
  withAdminAuth,
  parseBody,
  parseQuery,
  parseParams,
  handleApiError,
  success,
  created,
  noContent,
} from "./route-helpers";

// Validation schemas
export * from "./schemas";

// Client (browser-side)
export { api, configureApiClient } from "./client";
export type { ApiClientConfig, ApiResponse, DiscoveryParams, ReplyParams } from "./client";
