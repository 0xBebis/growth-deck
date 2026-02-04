import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── Company Profile ───────────────────────────────
  await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Byte Masons",
      productName: "Cod3x",
      productDescription:
        "Cod3x lets traders automate trades with a single prompt. We're also building a dataset and RL environment for financial post-training, with Kaggle/Numerai-style rewards. Our mission is to build a corpus of data that enables AI researchers to create reliable financial operators and analysts.",
      brandVoice:
        "Approachable and educational. We're a smart friend who happens to work at the intersection of quant finance and AI. Lead with value, avoid hard sells, and always be technically credible. When mentioning Cod3x, frame it as 'we're building something for this' rather than a pitch.",
      targetAudiences: JSON.stringify([
        {
          name: "Traders",
          description:
            "Quantitative and algorithmic traders interested in automation, backtesting, and AI-driven strategies",
        },
        {
          name: "AI Researchers",
          description:
            "ML/RL researchers interested in financial datasets, post-training, benchmarks, and RL environments",
        },
        {
          name: "Hybrid",
          description:
            "Quant researchers using ML, AI builders exploring finance applications",
        },
      ]),
    },
  });

  // ─── LLM Config ────────────────────────────────────
  await prisma.llmConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      defaultModelId: "moonshotai/kimi-k2.5",
      classificationTemp: 0.2,
      draftingTemp: 0.6,
      summarizationTemp: 0.3,
      calendarTemp: 0.7,
      budgetAlertThreshold: 0.8,
      budgetHardStop: true,
      budgetHardStopExemptions: JSON.stringify(["draft"]),
    },
  });

  // ─── Slack Config ──────────────────────────────────
  await prisma.slackConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      alertChannelName: "#growth-alerts",
      metricsChannelName: "#growth-metrics",
      highPriorityThreshold: 80,
      enableHighPriorityAlerts: true,
      enableDailySummary: true,
      enableWeeklyRecap: true,
      enableQueueAlerts: true,
      enableCalendarReminders: true,
    },
  });

  // ─── Playbook Entries ──────────────────────────────
  const playbookEntries = [
    {
      platform: "X" as const,
      platformUrl: "https://twitter.com",
      postingCadence: "3-5 tweets/day, 5-10 replies/day",
      bestTimes: "8-10am EST, 12-1pm EST, 5-7pm EST",
      styleGuide:
        "Concise (under 280 chars for single tweets, use threads for depth). Lead with a hook or insight, not a product pitch. Use visuals when possible. Quote-tweet and add value rather than just retweeting. No hashtag spam (1-2 max, prefer none). Tone: Smart friend at a trading desk who also reads ML papers.",
      dos: "Share genuine insights, celebrate others' work, ask good questions, post original data/analysis, engage in replies on trending AI/finance threads before they blow up.",
      donts:
        "Thread of pure self-promotion, ratio bait, engage with trolls, use crypto-bro language, hashtag spam.",
    },
    {
      platform: "LINKEDIN" as const,
      platformUrl: "https://linkedin.com",
      postingCadence: "1 post/day from personal accounts, 3-5 comments/day on others' posts",
      bestTimes: "Tuesday-Thursday 8-10am, lunch hour",
      styleGuide:
        "Open with a compelling first line (it's the hook before '...see more'). Use line breaks liberally. Personal stories and lessons learned outperform pure announcements. Comment with substantive takes (not 'Great post!'). Tone: Thoughtful professional bridging finance and AI.",
      dos: "Share team wins, contrarian takes on AI hype, 'here's what I learned building X', hiring posts.",
      donts:
        "Pure product announcements without narrative, overly formal corporate voice, engagement-bait polls.",
    },
    {
      platform: "REDDIT" as const,
      platformUrl: "https://reddit.com",
      postingCadence: "2-3 high-quality comments/day, 1-2 posts/week in relevant subreddits",
      bestTimes: null,
      styleGuide:
        "Reddit hates marketers. Comments must be genuinely useful. Answer questions with detailed, technical responses. Only mention the product when directly solving a stated problem. Build karma before ever mentioning your product. Use markdown formatting. Tone: Knowledgeable community member first.",
      dos: "Deep technical answers, share open-source code/data, acknowledge limitations honestly, upvote others' good content.",
      donts:
        "Any post that reads like an ad, astroturfing, dismissing competitors, 'check out our product' without context.",
      additionalNotes:
        "Key subreddits: r/algotrading, r/quant, r/MachineLearning, r/LocalLLaMA, r/reinforcementlearning, r/fintech, r/datascience, r/wallstreetbets",
    },
    {
      platform: "HN" as const,
      platformUrl: "https://news.ycombinator.com",
      postingCadence: "1-2 thoughtful comments/day, 1 submission/week max",
      bestTimes: null,
      styleGuide:
        "HN has the most sophisticated, skeptical audience. Comments should add novel information. Show HN for working products, Ask HN for genuine questions. Technical depth is rewarded — cite papers, benchmarks, specific numbers. Acknowledge tradeoffs. Tone: Researcher sharing findings at a seminar.",
      dos: "Share interesting technical findings, link to papers, provide benchmarks, engage with criticism constructively, post open-source contributions.",
      donts:
        "Obvious self-promotion, superlatives ('revolutionary', 'game-changing'), marketing language, downvote competitors.",
      additionalNotes:
        "Read https://news.ycombinator.com/newsguidelines.html — violations get you banned.",
    },
  ];

  for (const entry of playbookEntries) {
    await prisma.playbookEntry.upsert({
      where: { platform: entry.platform },
      update: entry,
      create: entry,
    });
  }

  // ─── Default Keywords ──────────────────────────────
  const keywords = [
    // Product
    { phrase: "automate trades", category: "PRODUCT" as const },
    { phrase: "trade automation", category: "PRODUCT" as const },
    { phrase: "prompt trading", category: "PRODUCT" as const },
    { phrase: "ai trading bot", category: "PRODUCT" as const },
    { phrase: "financial rl", category: "PRODUCT" as const },
    { phrase: "reinforcement learning finance", category: "PRODUCT" as const },
    { phrase: "financial post-training", category: "PRODUCT" as const },
    { phrase: "financial dataset", category: "PRODUCT" as const },
    { phrase: "cod3x", category: "PRODUCT" as const },
    // Pain points
    { phrase: "looking for", category: "PAIN_POINT" as const },
    { phrase: "anyone know", category: "PAIN_POINT" as const },
    { phrase: "recommend a", category: "PAIN_POINT" as const },
    { phrase: "alternative to", category: "PAIN_POINT" as const },
    { phrase: "how do I automate", category: "PAIN_POINT" as const },
    { phrase: "best way to", category: "PAIN_POINT" as const },
    { phrase: "is there a tool", category: "PAIN_POINT" as const },
    // Competitors
    { phrase: "numerai", category: "COMPETITOR" as const },
    { phrase: "quantconnect", category: "COMPETITOR" as const },
    { phrase: "alpaca", category: "COMPETITOR" as const },
    { phrase: "openbb", category: "COMPETITOR" as const },
    // Research
    { phrase: "rl environment", category: "RESEARCH" as const },
    { phrase: "rl benchmark", category: "RESEARCH" as const },
    { phrase: "financial llm", category: "RESEARCH" as const },
    { phrase: "RLHF finance", category: "RESEARCH" as const },
  ];

  for (const kw of keywords) {
    const existing = await prisma.keyword.findFirst({
      where: { phrase: kw.phrase },
    });
    if (!existing) {
      await prisma.keyword.create({ data: kw });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
