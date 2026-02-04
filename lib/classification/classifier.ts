import { prisma } from "@/lib/prisma";
import { sendChatCompletion } from "@/lib/openrouter/client";
import { logUsage } from "@/lib/openrouter/cost-tracker";
import { checkBudget } from "@/lib/openrouter/budget";
import { CURATED_MODELS } from "@/lib/utils/constants";
import { buildClassificationPrompt } from "./prompts";
import type { ClassificationResult } from "./types";
import type { DiscoveredPost } from "@prisma/client";

export async function classifyPost(
  post: DiscoveredPost
): Promise<ClassificationResult | null> {
  // Budget check
  const budget = await checkBudget("classify");
  if (!budget.allowed) {
    console.log(`Classification blocked: ${budget.reason}`);
    return null;
  }

  // Get config
  const [llmConfig, companyProfile] = await Promise.all([
    prisma.llmConfig.findFirst(),
    prisma.companyProfile.findFirst(),
  ]);

  const modelId = llmConfig?.defaultModelId ?? "moonshotai/kimi-k2.5";
  const temperature = llmConfig?.classificationTemp ?? 0.2;

  const systemPrompt = buildClassificationPrompt(
    companyProfile?.productDescription ?? "A fintech product",
    JSON.stringify(companyProfile?.targetAudiences ?? [])
  );

  try {
    const response = await sendChatCompletion({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Platform: ${post.platform}\nPost: ${post.content.slice(0, 2000)}`,
        },
      ],
      temperature,
      maxTokens: 256,
      responseFormat: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error(`Classification returned invalid JSON for post ${post.id}:`, content);
      return null;
    }

    // Validate the parsed object has required fields with correct types
    const VALID_INTENTS = ["QUESTION", "COMPLAINT", "DISCUSSION", "SHOWCASE"] as const;
    const VALID_AUDIENCES = ["TRADER", "RESEARCHER", "HYBRID"] as const;

    const obj = parsed as Record<string, unknown>;
    if (
      typeof obj.relevanceScore !== "number" ||
      typeof obj.intentType !== "string" ||
      typeof obj.audienceType !== "string" ||
      !VALID_INTENTS.includes(obj.intentType as typeof VALID_INTENTS[number]) ||
      !VALID_AUDIENCES.includes(obj.audienceType as typeof VALID_AUDIENCES[number])
    ) {
      console.error(`Classification returned invalid schema for post ${post.id}:`, parsed);
      return null;
    }

    const result: ClassificationResult = {
      relevanceScore: Math.max(0, Math.min(100, Math.round(obj.relevanceScore))),
      intentType: obj.intentType as ClassificationResult["intentType"],
      audienceType: obj.audienceType as ClassificationResult["audienceType"],
    };

    // Log usage
    const modelInfo = CURATED_MODELS.find((m) => m.id === modelId);
    const inputCostPerMillion = modelInfo?.inputCost ?? 0.5;
    const outputCostPerMillion = modelInfo?.outputCost ?? 2.8;

    const cost = await logUsage({
      task: "CLASSIFY",
      modelId,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      inputCostPerMillion,
      outputCostPerMillion,
      relatedEntityType: "discovered_post",
      relatedEntityId: post.id,
    });

    // Update the post
    await prisma.discoveredPost.update({
      where: { id: post.id },
      data: {
        relevanceScore: result.relevanceScore,
        intentType: result.intentType,
        audienceType: result.audienceType,
        classificationModel: modelId,
        classificationCost: cost,
      },
    });

    return result;
  } catch (error) {
    console.error(`Classification failed for post ${post.id}:`, error);
    return null;
  }
}
