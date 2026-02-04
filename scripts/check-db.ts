import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.discoveredPost.count({ where: { platform: "REDDIT" } });
  console.log(`\nTotal Reddit posts in DB: ${count}\n`);

  const posts = await prisma.discoveredPost.findMany({
    where: { platform: "REDDIT" },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      platform: true,
      status: true,
      content: true,
      externalUrl: true,
      createdAt: true
    }
  });

  console.log("Recent Reddit posts:");
  for (const p of posts) {
    console.log(`- [${p.status}] ${p.content.slice(0, 60)}...`);
    console.log(`  Created: ${p.createdAt}`);
    console.log(`  URL: ${p.externalUrl}\n`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
