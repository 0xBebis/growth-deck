import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklySpend } from "@/lib/openrouter/cost-tracker";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [postsFound, repliesSent, queueDepth, llmSpend] = await Promise.all([
    prisma.discoveredPost.count({
      where: { createdAt: { gte: startOfWeek } },
    }),
    prisma.reply.count({
      where: { status: "SENT", sentAt: { gte: startOfWeek } },
    }),
    prisma.reply.count({
      where: { status: "DRAFT" },
    }),
    getWeeklySpend(),
  ]);

  return NextResponse.json({ postsFound, repliesSent, queueDepth, llmSpend });
}
