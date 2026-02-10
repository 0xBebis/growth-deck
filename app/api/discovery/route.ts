import { prisma } from "@/lib/prisma";
import { withAuth, parseQuery, discoveryQuerySchema } from "@/lib/api";

export const GET = withAuth(async (session, request) => {
  const { platform, intent, audience, limit } = parseQuery(request, discoveryQuerySchema);

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

  return posts;
});
