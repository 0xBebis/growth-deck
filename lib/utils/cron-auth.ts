import { NextResponse } from "next/server";

/**
 * Validates cron secret from request Authorization header.
 * Fails closed: rejects if CRON_SECRET is not configured.
 * Returns null if authorized, or a NextResponse error to return immediately.
 */
export function verifyCronAuth(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
