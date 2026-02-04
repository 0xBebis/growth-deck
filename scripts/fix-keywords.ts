/**
 * Fix the matchedKeywords for Twitter and LinkedIn posts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RELEVANCE_KEYWORDS = [
  "trading bot", "algo trading", "algorithmic trading", "AI trading",
  "automated trading", "machine learning", "quant trading", "quant",
  "backtest", "backtesting", "quantitative", "algorithm",
  "automate", "automation", "bot", "ML", "LLM", "GPT",
  "neural network", "predict", "prediction", "strategy",
  "finance", "fintech", "portfolio", "stock", "crypto",
];

function getMatchedKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  return RELEVANCE_KEYWORDS.filter((kw) => lowerText.includes(kw.toLowerCase()));
}

async function main() {
  console.log("Fixing matchedKeywords for Twitter and LinkedIn posts...\n");

  // Get posts with placeholder keywords
  const posts = await prisma.discoveredPost.findMany({
    where: {
      OR: [
        { matchedKeywords: "twitter test" },
        { matchedKeywords: "linkedin test" },
      ],
    },
  });

  console.log(`Found ${posts.length} posts to fix\n`);

  let fixed = 0;
  for (const post of posts) {
    const keywords = getMatchedKeywords(post.content);
    if (keywords.length > 0) {
      await prisma.discoveredPost.update({
        where: { id: post.id },
        data: { matchedKeywords: keywords.join(", ") },
      });
      fixed++;
    }
  }

  console.log(`✅ Fixed ${fixed} posts`);

  // Show sample of fixed keywords
  const sample = await prisma.discoveredPost.findMany({
    where: { platform: { in: ["X", "LINKEDIN"] } },
    take: 5,
    select: { platform: true, matchedKeywords: true, content: true },
  });

  console.log("\nSample fixed posts:");
  for (const p of sample) {
    console.log(`[${p.platform}] Keywords: ${p.matchedKeywords}`);
    console.log(`   Content: ${p.content.slice(0, 50)}...\n`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
