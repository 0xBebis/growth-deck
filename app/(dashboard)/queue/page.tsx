import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";

const QueueContainer = dynamic(
  () => import("@/components/queue/queue-container").then((mod) => mod.QueueContainer),
  {
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-zinc-800" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    ),
  }
);

export default async function QueuePage() {
  const [replies, platformAccounts] = await Promise.all([
    prisma.reply.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        discoveredPost: {
          select: {
            content: true,
            externalUrl: true,
            authorHandle: true,
            authorName: true,
            platform: true,
            intentType: true,
          },
        },
        author: { select: { id: true, name: true, image: true } },
        platformAccount: { select: { id: true, displayName: true, platform: true } },
      },
    }),
    prisma.platformAccount.findMany({
      where: { isActive: true },
      orderBy: { isDefault: "desc" },
    }),
  ]);

  return <QueueContainer replies={replies} platformAccounts={platformAccounts} />;
}
