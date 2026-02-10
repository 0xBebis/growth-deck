import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";

const FeedContainer = dynamic(
  () => import("@/components/discovery/feed-container").then((mod) => mod.FeedContainer),
  {
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    ),
  }
);

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const platform = params.platform;
  const intent = params.intent;
  const audience = params.audience;
  const sort = params.sort || "recency";

  const where: Record<string, unknown> = {
    status: { not: "DISMISSED" },
  };
  if (platform) where.platform = platform;
  if (intent) where.intentType = intent;
  if (audience) where.audienceType = audience;

  // Sort by recency by default for growth hackers (fresh content matters)
  const orderBy =
    sort === "relevance"
      ? [
          { relevanceScore: { sort: "desc" as const, nulls: "last" as const } },
          { discoveredAt: "desc" as const },
        ]
      : { discoveredAt: "desc" as const };

  const posts = await prisma.discoveredPost.findMany({
    where,
    orderBy,
    take: 100,
    include: { replies: { select: { id: true, status: true } } },
  });

  // Calculate trends from keyword frequency
  const trends = await calculateTrends();

  return <FeedContainer posts={posts} currentFilters={{ platform, intent, audience, sort }} trends={trends} />;
}

async function calculateTrends(): Promise<
  { keyword: string; count: number; velocity: number; platforms: string[] }[]
> {
  // Get posts from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentPosts = await prisma.discoveredPost.findMany({
    where: {
      discoveredAt: { gte: weekAgo },
      status: { not: "DISMISSED" },
    },
    select: {
      matchedKeywords: true,
      platform: true,
      discoveredAt: true,
    },
  });

  // Count keyword occurrences and track platforms
  const keywordData = new Map<
    string,
    { count: number; platforms: Set<string>; recentCount: number }
  >();

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  for (const post of recentPosts) {
    if (!post.matchedKeywords) continue;

    const keywords = post.matchedKeywords.split(", ");
    const isRecent = new Date(post.discoveredAt) >= threeDaysAgo;

    for (const kw of keywords) {
      const normalized = kw.toLowerCase().trim();
      if (!normalized || normalized.length < 3) continue;

      const existing = keywordData.get(normalized) || {
        count: 0,
        platforms: new Set<string>(),
        recentCount: 0,
      };

      existing.count++;
      existing.platforms.add(post.platform);
      if (isRecent) existing.recentCount++;

      keywordData.set(normalized, existing);
    }
  }

  // Calculate velocity (recent vs older ratio)
  const trends = Array.from(keywordData.entries())
    .filter(([, data]) => data.count >= 2) // At least 2 mentions
    .map(([keyword, data]) => {
      const olderCount = data.count - data.recentCount;
      const velocity =
        olderCount > 0
          ? Math.round(((data.recentCount - olderCount) / olderCount) * 100)
          : data.recentCount > 0
          ? 100
          : 0;

      return {
        keyword,
        count: data.count,
        velocity,
        platforms: Array.from(data.platforms),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 keywords

  return trends;
}
