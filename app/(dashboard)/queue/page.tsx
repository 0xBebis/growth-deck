import { prisma } from "@/lib/prisma";
import { QueueContainer } from "@/components/queue/queue-container";

export default async function QueuePage() {
  const replies = await prisma.reply.findMany({
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
  });

  const platformAccounts = await prisma.platformAccount.findMany({
    where: { isActive: true },
    orderBy: { isDefault: "desc" },
  });

  return <QueueContainer replies={replies} platformAccounts={platformAccounts} />;
}
