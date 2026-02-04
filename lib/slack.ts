import { prisma } from "@/lib/prisma";

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  channel?: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: SlackBlockElement[];
  accessory?: SlackBlockElement;
  fields?: { type: string; text: string }[];
}

interface SlackBlockElement {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  url?: string;
  action_id?: string;
}

async function getSlackConfig() {
  return prisma.slackConfig.findFirst();
}

export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  try {
    const config = await getSlackConfig();

    if (!config?.webhookUrl) {
      console.log("Slack webhook not configured");
      return false;
    }

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send Slack message:", error);
    return false;
  }
}

// High-priority post alert
export async function sendHighPriorityAlert(post: {
  platform: string;
  authorHandle: string | null;
  content: string;
  relevanceScore: number | null;
  externalUrl: string;
  intentType: string | null;
}): Promise<boolean> {
  const config = await getSlackConfig();

  if (!config?.enableHighPriorityAlerts) return false;
  if ((post.relevanceScore || 0) < config.highPriorityThreshold) return false;

  const platformEmoji = {
    X: ":x:",
    LINKEDIN: ":linkedin:",
    REDDIT: ":reddit:",
    HN: ":ycombinator:",
  }[post.platform] || ":speech_balloon:";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${platformEmoji} High-Priority Post Detected!`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Score:* ${post.relevanceScore}/100 | *Intent:* ${post.intentType || "Unknown"} | *Author:* ${post.authorHandle || "Unknown"}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: post.content.slice(0, 500) + (post.content.length > 500 ? "..." : ""),
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Post",
          emoji: true,
        },
        url: post.externalUrl,
        action_id: "view_post",
      },
    },
  ];

  return sendSlackMessage({
    text: `High-priority ${post.platform} post (Score: ${post.relevanceScore})`,
    blocks,
    channel: config.alertChannelName,
  });
}

// Daily summary
export async function sendDailySummary(stats: {
  postsDiscovered: number;
  repliesDrafted: number;
  repliesSent: number;
  topPlatform: string;
  topIntent: string;
  avgScore: number;
}): Promise<boolean> {
  const config = await getSlackConfig();

  if (!config?.enableDailySummary) return false;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":chart_with_upwards_trend: Daily Growth Summary",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Posts Discovered*\n${stats.postsDiscovered}` },
        { type: "mrkdwn", text: `*Replies Drafted*\n${stats.repliesDrafted}` },
        { type: "mrkdwn", text: `*Replies Sent*\n${stats.repliesSent}` },
        { type: "mrkdwn", text: `*Avg Score*\n${stats.avgScore}/100` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Top platform: *${stats.topPlatform}* | Most common intent: *${stats.topIntent}*`,
      },
    },
  ];

  return sendSlackMessage({
    text: `Daily Summary: ${stats.postsDiscovered} posts, ${stats.repliesSent} replies sent`,
    blocks,
    channel: config.metricsChannelName,
  });
}

// Weekly recap
export async function sendWeeklyRecap(stats: {
  totalPosts: number;
  totalReplies: number;
  engagementRate: number;
  topKeywords: string[];
  weekOverWeekGrowth: number;
}): Promise<boolean> {
  const config = await getSlackConfig();

  if (!config?.enableWeeklyRecap) return false;

  const growthEmoji = stats.weekOverWeekGrowth >= 0 ? ":arrow_up:" : ":arrow_down:";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":calendar: Weekly Growth Recap",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Total Posts*\n${stats.totalPosts}` },
        { type: "mrkdwn", text: `*Total Replies*\n${stats.totalReplies}` },
        { type: "mrkdwn", text: `*Engagement Rate*\n${stats.engagementRate}%` },
        { type: "mrkdwn", text: `*WoW Growth*\n${growthEmoji} ${stats.weekOverWeekGrowth}%` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Top Keywords:* ${stats.topKeywords.join(", ")}`,
      },
    },
  ];

  return sendSlackMessage({
    text: `Weekly Recap: ${stats.totalReplies} replies, ${stats.weekOverWeekGrowth}% growth`,
    blocks,
    channel: config.metricsChannelName,
  });
}

// Queue alert for stale drafts
export async function sendQueueAlert(staleDrafts: number): Promise<boolean> {
  const config = await getSlackConfig();

  if (!config?.enableQueueAlerts || staleDrafts === 0) return false;

  return sendSlackMessage({
    text: `:warning: You have ${staleDrafts} draft${staleDrafts !== 1 ? "s" : ""} waiting in the queue for more than 24 hours.`,
    channel: config.alertChannelName,
  });
}

// Calendar reminder
export async function sendCalendarReminder(entry: {
  title: string;
  platform: string;
  scheduledFor: Date;
}): Promise<boolean> {
  const config = await getSlackConfig();

  if (!config?.enableCalendarReminders) return false;

  const timeStr = entry.scheduledFor.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return sendSlackMessage({
    text: `:bell: Reminder: "${entry.title}" is scheduled for ${entry.platform} at ${timeStr}`,
    channel: config.alertChannelName,
  });
}

// Test connection
export async function testSlackConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await sendSlackMessage({
      text: ":white_check_mark: GrowthDeck Slack integration is working!",
    });

    return { success };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
