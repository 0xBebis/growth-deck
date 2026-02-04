import { prisma } from "@/lib/prisma";
import { LeadsContainer } from "@/components/leads/leads-container";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const status = params.status;
  const source = params.source;
  const sort = params.sort || "score";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (source) where.source = source;

  const orderBy =
    sort === "recent"
      ? { lastSeenAt: "desc" as const }
      : sort === "interactions"
      ? { totalInteractions: "desc" as const }
      : { score: "desc" as const };

  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    take: 100,
    include: {
      interactions: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { interactions: true, conversions: true },
      },
    },
  });

  // Get stats
  const stats = await getLeadStats();

  // Get lead sources breakdown
  const sourceBreakdown = await prisma.lead.groupBy({
    by: ["source"],
    _count: true,
  });

  // Get status breakdown
  const statusBreakdown = await prisma.lead.groupBy({
    by: ["status"],
    _count: true,
  });

  return (
    <LeadsContainer
      leads={leads}
      stats={stats}
      sourceBreakdown={sourceBreakdown.map((s) => ({ source: s.source, count: s._count }))}
      statusBreakdown={statusBreakdown.map((s) => ({ status: s.status, count: s._count }))}
      currentFilters={{ status, source, sort }}
    />
  );
}

async function getLeadStats() {
  const total = await prisma.lead.count();
  const hot = await prisma.lead.count({ where: { status: "HOT" } });
  const warm = await prisma.lead.count({ where: { status: "WARM" } });
  const converted = await prisma.lead.count({ where: { status: "CONVERTED" } });
  const avgScore = await prisma.lead.aggregate({ _avg: { score: true } });

  return {
    total,
    hot,
    warm,
    converted,
    avgScore: Math.round(avgScore._avg.score || 0),
  };
}
