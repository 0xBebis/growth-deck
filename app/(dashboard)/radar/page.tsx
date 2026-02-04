import { prisma } from "@/lib/prisma";
import { RadarContainer } from "@/components/radar/radar-container";
import { subDays } from "date-fns";

export default async function RadarPage() {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Get all competitors
  const competitors = await prisma.competitor.findMany({
    where: { isActive: true },
    include: {
      mentions: {
        where: { discoveredAt: { gte: thirtyDaysAgo } },
        orderBy: { discoveredAt: "desc" },
        take: 50,
      },
      _count: {
        select: { mentions: true },
      },
    },
  });

  // Get share of voice data
  const shareOfVoice = await prisma.shareOfVoice.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: "desc" },
    take: 30,
  });

  // Get sentiment breakdown for each competitor
  const competitorStats = await Promise.all(
    competitors.map(async (comp) => {
      const sentimentCounts = await prisma.competitorMention.groupBy({
        by: ["sentiment"],
        where: { competitorId: comp.id, discoveredAt: { gte: thirtyDaysAgo } },
        _count: true,
      });

      const platformCounts = await prisma.competitorMention.groupBy({
        by: ["platform"],
        where: { competitorId: comp.id, discoveredAt: { gte: thirtyDaysAgo } },
        _count: true,
      });

      const opportunities = await prisma.competitorMention.count({
        where: { competitorId: comp.id, isOpportunity: true, discoveredAt: { gte: thirtyDaysAgo } },
      });

      return {
        id: comp.id,
        name: comp.name,
        domain: comp.domain,
        totalMentions: comp._count.mentions,
        sentiment: {
          positive: sentimentCounts.find((s) => s.sentiment === "positive")?._count || 0,
          neutral: sentimentCounts.find((s) => s.sentiment === "neutral")?._count || 0,
          negative: sentimentCounts.find((s) => s.sentiment === "negative")?._count || 0,
        },
        platforms: platformCounts.map((p) => ({ platform: p.platform, count: p._count })),
        opportunities,
        recentMentions: comp.mentions.slice(0, 10),
      };
    })
  );

  // Get recent opportunities (negative mentions about competitors)
  const opportunities = await prisma.competitorMention.findMany({
    where: {
      sentiment: "negative",
      isOpportunity: false,
      discoveredAt: { gte: thirtyDaysAgo },
    },
    orderBy: { discoveredAt: "desc" },
    take: 20,
    include: {
      competitor: {
        select: { name: true },
      },
    },
  });

  return (
    <RadarContainer
      competitors={competitorStats}
      shareOfVoice={shareOfVoice}
      opportunities={opportunities}
    />
  );
}
