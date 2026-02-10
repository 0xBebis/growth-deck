import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

const AnalyticsContainer = dynamic(
  () => import("@/components/analytics/analytics-container").then((mod) => mod.AnalyticsContainer),
  {
    loading: () => (
      <div className="space-y-6 p-6">
        <div className="h-8 w-36 animate-pulse rounded bg-zinc-800" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-64 animate-pulse rounded-lg bg-zinc-800" />
        </div>
      </div>
    ),
  }
);

export default async function AnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysAgo = subDays(now, 7);

  // Get daily stats for the past 30 days
  const dailyStats = await getDailyStats(thirtyDaysAgo);

  // Get engagement breakdown
  const engagementBreakdown = await getEngagementBreakdown(thirtyDaysAgo);

  // Get platform performance
  const platformStats = await getPlatformStats(thirtyDaysAgo);

  // Get top performing replies
  const topReplies = await getTopReplies();

  // Get conversion funnel data
  const funnelData = await getFunnelData(thirtyDaysAgo);

  // Get week-over-week comparison
  const weekComparison = await getWeekComparison(sevenDaysAgo);

  return (
    <AnalyticsContainer
      dailyStats={dailyStats}
      engagementBreakdown={engagementBreakdown}
      platformStats={platformStats}
      topReplies={topReplies}
      funnelData={funnelData}
      weekComparison={weekComparison}
    />
  );
}

async function getDailyStats(since: Date) {
  const posts = await prisma.discoveredPost.groupBy({
    by: ["discoveredAt"],
    _count: true,
    where: { discoveredAt: { gte: since } },
  });

  const replies = await prisma.reply.groupBy({
    by: ["createdAt"],
    _count: true,
    where: { createdAt: { gte: since } },
  });

  // Aggregate by day
  const dailyMap = new Map<string, { posts: number; replies: number; engagements: number }>();

  for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const dateKey = format(startOfDay(d), "yyyy-MM-dd");
    dailyMap.set(dateKey, { posts: 0, replies: 0, engagements: 0 });
  }

  posts.forEach((p) => {
    const dateKey = format(startOfDay(new Date(p.discoveredAt)), "yyyy-MM-dd");
    const existing = dailyMap.get(dateKey);
    if (existing) existing.posts += p._count;
  });

  replies.forEach((r) => {
    const dateKey = format(startOfDay(new Date(r.createdAt)), "yyyy-MM-dd");
    const existing = dailyMap.get(dateKey);
    if (existing) existing.replies += r._count;
  });

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
}

async function getEngagementBreakdown(since: Date) {
  const repliesByStatus = await prisma.reply.groupBy({
    by: ["status"],
    _count: true,
    where: { createdAt: { gte: since } },
  });

  return repliesByStatus.map((r) => ({
    status: r.status,
    count: r._count,
  }));
}

async function getPlatformStats(since: Date) {
  const postsByPlatform = await prisma.discoveredPost.groupBy({
    by: ["platform"],
    _count: true,
    _avg: { relevanceScore: true },
    where: { discoveredAt: { gte: since } },
  });

  const repliesByPlatform = await prisma.reply.groupBy({
    by: ["platform"],
    _count: true,
    where: { createdAt: { gte: since } },
  });

  const replyMap = new Map(repliesByPlatform.map((r) => [r.platform, r._count]));

  return postsByPlatform.map((p) => ({
    platform: p.platform,
    posts: p._count,
    replies: replyMap.get(p.platform) || 0,
    avgScore: Math.round(p._avg.relevanceScore || 0),
    conversionRate: replyMap.get(p.platform)
      ? Math.round((replyMap.get(p.platform)! / p._count) * 100)
      : 0,
  }));
}

async function getTopReplies() {
  const replies = await prisma.reply.findMany({
    where: { status: "SENT" },
    take: 10,
    orderBy: { sentAt: "desc" },
    include: {
      discoveredPost: {
        select: {
          platform: true,
          content: true,
          externalUrl: true,
          authorHandle: true,
        },
      },
    },
  });

  return replies.map((r) => ({
    id: r.id,
    platform: r.platform,
    content: r.finalContent || r.draftContent,
    sentAt: r.sentAt,
    postUrl: r.discoveredPost.externalUrl,
    postAuthor: r.discoveredPost.authorHandle,
  }));
}

async function getFunnelData(since: Date) {
  const totalPosts = await prisma.discoveredPost.count({
    where: { discoveredAt: { gte: since } },
  });

  const queuedPosts = await prisma.discoveredPost.count({
    where: { discoveredAt: { gte: since }, status: "QUEUED" },
  });

  const draftedReplies = await prisma.reply.count({
    where: { createdAt: { gte: since } },
  });

  const sentReplies = await prisma.reply.count({
    where: { createdAt: { gte: since }, status: "SENT" },
  });

  return {
    discovered: totalPosts,
    queued: queuedPosts,
    drafted: draftedReplies,
    sent: sentReplies,
  };
}

async function getWeekComparison(weekAgo: Date) {
  const twoWeeksAgo = subDays(weekAgo, 7);

  const thisWeekPosts = await prisma.discoveredPost.count({
    where: { discoveredAt: { gte: weekAgo } },
  });

  const lastWeekPosts = await prisma.discoveredPost.count({
    where: { discoveredAt: { gte: twoWeeksAgo, lt: weekAgo } },
  });

  const thisWeekReplies = await prisma.reply.count({
    where: { createdAt: { gte: weekAgo } },
  });

  const lastWeekReplies = await prisma.reply.count({
    where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
  });

  const thisWeekSent = await prisma.reply.count({
    where: { createdAt: { gte: weekAgo }, status: "SENT" },
  });

  const lastWeekSent = await prisma.reply.count({
    where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo }, status: "SENT" },
  });

  return {
    posts: {
      current: thisWeekPosts,
      previous: lastWeekPosts,
      change: lastWeekPosts > 0 ? Math.round(((thisWeekPosts - lastWeekPosts) / lastWeekPosts) * 100) : 0,
    },
    replies: {
      current: thisWeekReplies,
      previous: lastWeekReplies,
      change: lastWeekReplies > 0 ? Math.round(((thisWeekReplies - lastWeekReplies) / lastWeekReplies) * 100) : 0,
    },
    sent: {
      current: thisWeekSent,
      previous: lastWeekSent,
      change: lastWeekSent > 0 ? Math.round(((thisWeekSent - lastWeekSent) / lastWeekSent) * 100) : 0,
    },
  };
}
