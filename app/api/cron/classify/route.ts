import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyPost } from "@/lib/classification/classifier";
import { sendSlackMessage } from "@/lib/slack/webhook";
import { highPriorityPostTemplate } from "@/lib/slack/templates";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    // Get unclassified posts (no relevanceScore)
    const posts = await prisma.discoveredPost.findMany({
      where: {
        relevanceScore: null,
        status: "NEW",
      },
      orderBy: { discoveredAt: "desc" },
      take: 20,
    });

    let classified = 0;
    let highPriority = 0;

    const slackConfig = await prisma.slackConfig.findFirst();
    const threshold = slackConfig?.highPriorityThreshold ?? 80;

    for (const post of posts) {
      const result = await classifyPost(post);
      if (result) {
        classified++;

        // Send Slack alert for high-priority posts
        if (
          result.relevanceScore >= threshold &&
          slackConfig?.enableHighPriorityAlerts
        ) {
          const updatedPost = await prisma.discoveredPost.findUnique({
            where: { id: post.id },
          });
          if (updatedPost) {
            await sendSlackMessage(highPriorityPostTemplate(updatedPost));
            highPriority++;
          }
        }
      }

      // Brief pause between API calls
      await new Promise((r) => setTimeout(r, 500));
    }

    return NextResponse.json({
      success: true,
      total: posts.length,
      classified,
      highPriority,
    });
  } catch (error) {
    console.error("Classification cron error:", error);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
