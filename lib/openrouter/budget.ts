import { prisma } from "@/lib/prisma";
import { getMonthlySpend } from "./cost-tracker";

let lastAlertTime = 0;
const ALERT_COOLDOWN = 60 * 60 * 1000; // 1 hour between alerts

export async function checkBudget(
  task: string
): Promise<{ allowed: boolean; reason?: string }> {
  const config = await prisma.llmConfig.findFirst();
  if (!config?.monthlyBudgetLimit) return { allowed: true };

  const currentSpend = await getMonthlySpend();
  const pctUsed = currentSpend / config.monthlyBudgetLimit;

  // Soft alert at threshold
  if (
    pctUsed >= config.budgetAlertThreshold &&
    pctUsed < 1.0 &&
    Date.now() - lastAlertTime > ALERT_COOLDOWN
  ) {
    lastAlertTime = Date.now();
    // Fire-and-forget slack alert
    sendBudgetAlert(currentSpend, config.monthlyBudgetLimit, pctUsed).catch(
      console.error
    );
  }

  // Hard stop at 100%
  if (pctUsed >= 1.0 && config.budgetHardStop) {
    const raw = config.budgetHardStopExemptions;
    const exemptions = Array.isArray(raw) ? (raw as string[]) : [];
    if (exemptions.includes(task)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Monthly budget of $${config.monthlyBudgetLimit.toFixed(2)} exceeded (${(pctUsed * 100).toFixed(1)}% used). Task "${task}" is not exempt.`,
    };
  }

  return { allowed: true };
}

async function sendBudgetAlert(
  currentSpend: number,
  limit: number,
  pctUsed: number
) {
  // Import dynamically to avoid circular deps
  const { sendSlackMessage } = await import("@/lib/slack/webhook");
  const { budgetAlertTemplate } = await import("@/lib/slack/templates");

  await sendSlackMessage(budgetAlertTemplate(currentSpend, limit, pctUsed));
}
