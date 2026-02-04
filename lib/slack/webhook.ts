import { prisma } from "@/lib/prisma";

export async function sendSlackMessage(blocks: unknown[]): Promise<boolean> {
  const config = await prisma.slackConfig.findFirst();
  if (!config?.webhookUrl) return false;

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    return response.ok;
  } catch (error) {
    console.error("Slack webhook error:", error);
    return false;
  }
}
