import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const replies = await prisma.reply.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      discoveredPost: true,
      author: { select: { name: true, image: true } },
      platformAccount: { select: { id: true, displayName: true, platform: true } },
    },
  });

  return NextResponse.json(replies);
}
