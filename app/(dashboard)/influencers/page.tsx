import { prisma } from "@/lib/prisma";
import { InfluencersContainer } from "@/components/influencers/influencers-container";

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tier = params.tier;
  const platform = params.platform;
  const sort = params.sort || "relationship";

  const where: Record<string, unknown> = {};
  if (tier) where.tier = tier;
  if (platform) where.platform = platform;

  const orderBy =
    sort === "followers"
      ? { followerCount: "desc" as const }
      : sort === "engagement"
      ? { engagementRate: "desc" as const }
      : sort === "recent"
      ? { lastInteractionAt: "desc" as const }
      : { relationshipScore: "desc" as const };

  const influencers = await prisma.influencer.findMany({
    where,
    orderBy,
    take: 100,
    include: {
      interactions: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { interactions: true },
      },
    },
  });

  // Get stats
  const stats = await getInfluencerStats();

  // Get tier breakdown
  const tierBreakdown = await prisma.influencer.groupBy({
    by: ["tier"],
    _count: true,
    _avg: { relationshipScore: true },
  });

  // Get platform breakdown
  const platformBreakdown = await prisma.influencer.groupBy({
    by: ["platform"],
    _count: true,
  });

  return (
    <InfluencersContainer
      influencers={influencers}
      stats={stats}
      tierBreakdown={tierBreakdown.map((t) => ({
        tier: t.tier,
        count: t._count,
        avgScore: Math.round(t._avg.relationshipScore || 0),
      }))}
      platformBreakdown={platformBreakdown.map((p) => ({ platform: p.platform, count: p._count }))}
      currentFilters={{ tier, platform, sort }}
    />
  );
}

async function getInfluencerStats() {
  const total = await prisma.influencer.count();
  const ambassadors = await prisma.influencer.count({ where: { isAmbassador: true } });
  const avgRelationship = await prisma.influencer.aggregate({ _avg: { relationshipScore: true } });
  const totalInteractions = await prisma.influencerInteraction.count();
  const responses = await prisma.influencerInteraction.count({ where: { theyResponded: true } });

  return {
    total,
    ambassadors,
    avgRelationship: Math.round(avgRelationship._avg.relationshipScore || 0),
    totalInteractions,
    responseRate: totalInteractions > 0 ? Math.round((responses / totalInteractions) * 100) : 0,
  };
}
