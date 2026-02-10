import { prisma } from "@/lib/prisma";
import { withAuth, parseQuery, replyQuerySchema } from "@/lib/api";

export const GET = withAuth(async (session, request) => {
  const { status, platform, limit } = parseQuery(request, replyQuerySchema);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const replies = await prisma.reply.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      discoveredPost: true,
      author: { select: { name: true, image: true } },
      platformAccount: { select: { id: true, displayName: true, platform: true } },
    },
  });

  return replies;
});
