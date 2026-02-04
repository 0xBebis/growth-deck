import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSlackMessage } from "@/lib/slack/webhook";
import { staleQueueTemplate } from "@/lib/slack/templates";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const slackConfig = await prisma.slackConfig.findFirst();
    if (!slackConfig?.enableQueueAlerts || !slackConfig.webhookUrl) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const staleCount = await prisma.reply.count({
      where: {
        status: "DRAFT",
        createdAt: { lt: fourHoursAgo },
      },
    });

    if (staleCount > 0) {
      await sendSlackMessage(staleQueueTemplate(staleCount));
    }

    return NextResponse.json({ success: true, staleCount });
  } catch (error) {
    console.error("Stale queue check error:", error);
    return NextResponse.json(
      { error: "Stale queue check failed" },
      { status: 500 }
    );
  }
}
