import { prisma } from "@/lib/prisma";
import { AutopilotContainer } from "@/components/autopilot/autopilot-container";

export default async function AutopilotPage() {
  // Get autopilot config (create if not exists)
  let config = await prisma.autopilotConfig.findFirst();

  if (!config) {
    config = await prisma.autopilotConfig.create({
      data: {
        isEnabled: false,
        autoDraftEnabled: false,
        autoDraftMinScore: 70,
        autoDraftIntents: ["QUESTION"],
        autoDraftPlatforms: ["REDDIT", "HN"],
        maxDraftsPerDay: 20,
        autoScheduleEnabled: false,
        scheduleDelayMinutes: 30,
        postingWindows: [],
        maxRepliesPerHour: 5,
        maxRepliesPerDay: 50,
        draftsToday: 0,
        repliesSentToday: 0,
      },
    });
  }

  // Get autopilot queue
  const queue = await prisma.autopilotQueue.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  // Get related posts for the queue items
  const postIds = queue.map((q) => q.discoveredPostId);
  const posts = await prisma.discoveredPost.findMany({
    where: { id: { in: postIds } },
    select: {
      id: true,
      platform: true,
      content: true,
      externalUrl: true,
      authorHandle: true,
      relevanceScore: true,
      intentType: true,
    },
  });

  const postsMap = new Map(posts.map((p) => [p.id, p]));
  const queueWithPosts = queue.map((q) => ({
    ...q,
    post: postsMap.get(q.discoveredPostId) || null,
  }));

  // Get stats
  const stats = {
    pendingCount: await prisma.autopilotQueue.count({ where: { status: "pending" } }),
    draftedCount: await prisma.autopilotQueue.count({ where: { status: "drafted" } }),
    approvedCount: await prisma.autopilotQueue.count({ where: { status: "approved" } }),
    sentCount: await prisma.autopilotQueue.count({ where: { status: "sent" } }),
    skippedCount: await prisma.autopilotQueue.count({ where: { status: "skipped" } }),
  };

  return (
    <AutopilotContainer
      config={config}
      queue={queueWithPosts}
      stats={stats}
    />
  );
}
