import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const intent = searchParams.get("intent");
  const audience = searchParams.get("audience");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {
    status: { not: "DISMISSED" },
  };
  if (platform) where.platform = platform;
  if (intent) where.intentType = intent;
  if (audience) where.audienceType = audience;

  const posts = await prisma.discoveredPost.findMany({
    where,
    orderBy: { relevanceScore: "desc" },
    take: limit,
  });

  return NextResponse.json(posts);
}
