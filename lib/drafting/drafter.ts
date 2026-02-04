import { prisma } from "@/lib/prisma";
import { sendChatCompletion } from "@/lib/openrouter/client";
import { logUsage } from "@/lib/openrouter/cost-tracker";
import { checkBudget } from "@/lib/openrouter/budget";
import { CURATED_MODELS } from "@/lib/utils/constants";
import { buildDraftPrompt } from "./prompts";
import type { DraftResult } from "./types";
import type { DiscoveredPost } from "@prisma/client";

export async function draftReply(
  post: DiscoveredPost
): Promise<DraftResult | null> {
  // Budget check (draft is exempt by default)
  const budget = await checkBudget("draft");
  if (!budget.allowed) {
    console.log(`Draft blocked: ${budget.reason}`);
    return null;
  }

  const [llmConfig, companyProfile, playbookEntry, writingRules] = await Promise.all([
    prisma.llmConfig.findFirst(),
    prisma.companyProfile.findFirst(),
    prisma.playbookEntry.findUnique({ where: { platform: post.platform } }),
    prisma.writingRules.findFirst(),
  ]);

  const modelId = llmConfig?.defaultModelId ?? "moonshotai/kimi-k2.5";
  const temperature = llmConfig?.draftingTemp ?? 0.6;

  // Transform database PlaybookEntry to match prompts.ts interface
  const playbookForPrompt = playbookEntry ? {
    platform: playbookEntry.platform,
    styleGuide: playbookEntry.styleGuide,
    dos: playbookEntry.dos,
    donts: playbookEntry.donts,
    maxLength: playbookEntry.maxLength,
    tone: playbookEntry.tone,
    goodExamples: (playbookEntry.goodExamples as string[]) ?? [],
    badExamples: (playbookEntry.badExamples as string[]) ?? [],
  } : null;

  // Transform database WritingRules to match prompts.ts interface
  const writingRulesForPrompt = writingRules ? {
    bannedWords: (writingRules.bannedWords as string[]) ?? [],
    bannedPhrases: (writingRules.bannedPhrases as string[]) ?? [],
    writingTips: (writingRules.writingTips as { tip: string; good: string; bad: string }[]) ?? [],
  } : null;

  const systemPrompt = buildDraftPrompt(
    companyProfile?.brandVoice ?? "Be helpful and approachable.",
    companyProfile?.productDescription ?? "",
    post.platform,
    post.audienceType ?? "HYBRID",
    playbookForPrompt,
    writingRulesForPrompt
  );

  const userMessage = post.threadContext
    ? `Thread context: ${post.threadContext}\n\nPost to reply to:\n${post.content}`
    : `Post to reply to:\n${post.content}`;

  try {
    const response = await sendChatCompletion({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage.slice(0, 4000) },
      ],
      temperature,
      maxTokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const modelInfo = CURATED_MODELS.find((m) => m.id === modelId);
    const inputCostPerMillion = modelInfo?.inputCost ?? 0.5;
    const outputCostPerMillion = modelInfo?.outputCost ?? 2.8;

    const cost = await logUsage({
      task: "DRAFT",
      modelId,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      inputCostPerMillion,
      outputCostPerMillion,
      relatedEntityType: "discovered_post",
      relatedEntityId: post.id,
    });

    return {
      content,
      modelId,
      cost,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  } catch (error) {
    console.error(`Draft failed for post ${post.id}:`, error);
    return null;
  }
}
