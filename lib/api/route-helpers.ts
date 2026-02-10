/**
 * API route helpers for consistent authentication, validation, and error handling.
 * Eliminates boilerplate from API route handlers.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodSchema, ZodError } from "zod";
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  InternalError,
  toApiError,
} from "./errors";
import type { Session } from "next-auth";

/**
 * Handler function that receives an authenticated session.
 * Returns data that will be JSON-serialized or a NextResponse.
 */
type AuthenticatedHandler<T> = (
  session: Session,
  request: Request
) => Promise<NextResponse<T> | T>;

/**
 * Handler function that receives an admin session.
 */
type AdminHandler<T> = (
  session: Session & { user: { role: "ADMIN" } },
  request: Request
) => Promise<NextResponse<T> | T>;

/**
 * Wraps a route handler with authentication.
 * Returns 401 if user is not authenticated.
 *
 * @example
 * ```typescript
 * export const GET = withAuth(async (session, request) => {
 *   const posts = await prisma.post.findMany({ where: { userId: session.user.id } });
 *   return posts;
 * });
 * ```
 */
export function withAuth<T>(
  handler: AuthenticatedHandler<T>
): (request: Request) => Promise<NextResponse<T | { error: string }>> {
  return async (request: Request) => {
    try {
      const session = await auth();

      if (!session?.user) {
        throw new AuthenticationError();
      }

      const result = await handler(session, request);

      if (result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wraps a route handler with admin authentication.
 * Returns 401 if not authenticated, 403 if not admin.
 *
 * @example
 * ```typescript
 * export const DELETE = withAdminAuth(async (session, request) => {
 *   await prisma.user.delete({ where: { id: params.id } });
 *   return { success: true };
 * });
 * ```
 */
export function withAdminAuth<T>(
  handler: AdminHandler<T>
): (request: Request) => Promise<NextResponse<T | { error: string }>> {
  return async (request: Request) => {
    try {
      const session = await auth();

      if (!session?.user) {
        throw new AuthenticationError();
      }

      const user = session.user as { role?: string };
      if (user.role !== "ADMIN") {
        throw new AuthorizationError("Admin access required");
      }

      const result = await handler(
        session as Session & { user: { role: "ADMIN" } },
        request
      );

      if (result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Parses and validates request body with a Zod schema.
 *
 * @example
 * ```typescript
 * const body = await parseBody(request, createPostSchema);
 * // body is typed according to the schema
 * ```
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let data: unknown;

  try {
    data = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      path: e.path.map(String).join("."),
      message: e.message,
    }));
    throw new ValidationError("Validation failed", errors);
  }

  return result.data;
}

/**
 * Parses and validates URL query parameters with a Zod schema.
 *
 * @example
 * ```typescript
 * const params = parseQuery(request, querySchema);
 * // params.limit, params.offset are typed
 * ```
 */
export function parseQuery<T>(request: Request, schema: ZodSchema<T>): T {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      path: e.path.map(String).join("."),
      message: e.message,
    }));
    throw new ValidationError("Invalid query parameters", errors);
  }

  return result.data;
}

/**
 * Parses URL path parameters.
 *
 * @example
 * ```typescript
 * const { id } = parseParams<{ id: string }>(params);
 * ```
 */
export function parseParams<T extends Record<string, string>>(
  params: Record<string, string | string[] | undefined>
): T {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value[0] || "";
    }
  }

  return result as T;
}

/**
 * Converts any error to a proper API response.
 */
export function handleApiError(error: unknown): NextResponse<{ error: string; code?: string; details?: unknown }> {
  // Log error for debugging (but not validation errors)
  if (!(error instanceof ValidationError)) {
    console.error("API Error:", error);
  }

  // Handle Zod errors directly
  if (error instanceof ZodError) {
    const errors = error.issues.map((e) => ({
      path: e.path.map(String).join("."),
      message: e.message,
    }));
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: errors },
      { status: 400 }
    );
  }

  // Handle our custom ApiError types
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  const prismaError = error as { code?: string; meta?: unknown };
  if (prismaError.code === "P2002") {
    return NextResponse.json(
      { error: "Resource already exists", code: "CONFLICT" },
      { status: 409 }
    );
  }
  if (prismaError.code === "P2025") {
    return NextResponse.json(
      { error: "Resource not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Generic error
  const apiError = toApiError(error);
  return NextResponse.json(
    { error: apiError.message, code: apiError.code },
    { status: apiError.statusCode }
  );
}

/**
 * Creates a success response with optional status code.
 */
export function success<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Creates a created response (201).
 */
export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Creates a no content response (204).
 */
export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}
