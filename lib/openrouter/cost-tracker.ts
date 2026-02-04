import { prisma } from "@/lib/prisma";
import type { LlmTask } from "@prisma/client";

interface UsageInput {
  task: LlmTask;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export async function logUsage(input: UsageInput): Promise<number> {
  const costUsd =
    (input.inputTokens / 1_000_000) * input.inputCostPerMillion +
    (input.outputTokens / 1_000_000) * input.outputCostPerMillion;

  await prisma.llmUsageLog.create({
    data: {
      task: input.task,
      modelId: input.modelId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costUsd,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
  });

  return costUsd;
}

export async function getMonthlySpend(): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await prisma.llmUsageLog.aggregate({
    _sum: { costUsd: true },
    where: {
      createdAt: { gte: startOfMonth },
    },
  });

  return result._sum.costUsd ?? 0;
}

export async function getWeeklySpend(): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const result = await prisma.llmUsageLog.aggregate({
    _sum: { costUsd: true },
    where: {
      createdAt: { gte: startOfWeek },
    },
  });

  return result._sum.costUsd ?? 0;
}
