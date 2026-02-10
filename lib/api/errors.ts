/**
 * Structured error types for consistent API error handling.
 * Provides typed errors with status codes and error codes for client handling.
 */

/**
 * Base API error class with status code and error code.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * 400 Bad Request - Invalid input or validation failure.
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication.
 */
export class AuthenticationError extends ApiError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized.
 */
export class AuthorizationError extends ApiError {
  constructor(message = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

/**
 * 404 Not Found - Resource does not exist.
 */
export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict.
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded.
 */
export class RateLimitError extends ApiError {
  constructor(
    message = "Rate limit exceeded",
    public readonly retryAfter?: number
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { retryAfter });
    this.name = "RateLimitError";
  }
}

/**
 * 500 Internal Server Error - Unexpected server error.
 */
export class InternalError extends ApiError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR");
    this.name = "InternalError";
  }
}

/**
 * 503 Service Unavailable - External service is down.
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service: string) {
    super(`${service} is currently unavailable`, 503, "SERVICE_UNAVAILABLE");
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Network error - Failed to connect to server.
 */
export class NetworkError extends ApiError {
  constructor(message = "Network error") {
    super(message, 0, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

/**
 * Checks if an error is retryable (network issues, rate limits, server errors).
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Retry on network errors, rate limits, and 5xx errors
    return (
      error instanceof NetworkError ||
      error instanceof RateLimitError ||
      error instanceof ServiceUnavailableError ||
      error.statusCode >= 500
    );
  }

  // Retry on fetch/network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  return false;
}

/**
 * Extracts error message from various error types.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Converts an unknown error to an ApiError.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new InternalError(error.message);
  }
  return new InternalError(String(error));
}
