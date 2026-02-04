import type { DiscoveredPost } from "@prisma/client";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function highPriorityPostTemplate(post: DiscoveredPost): unknown[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "New high-intent post detected",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Platform:* ${post.platform}`,
        },
        {
          type: "mrkdwn",
          text: `*Relevance:* ${post.relevanceScore}/100`,
        },
        {
          type: "mrkdwn",
          text: `*Intent:* ${post.intentType || "Unknown"}`,
        },
        {
          type: "mrkdwn",
          text: `*Audience:* ${post.audienceType || "Unknown"}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `> ${post.content.slice(0, 300)}${post.content.length > 300 ? "..." : ""}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View in GrowthDeck" },
          url: `${appUrl}/discover`,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "View Original" },
          url: post.externalUrl,
        },
      ],
    },
  ];
}

export function budgetAlertTemplate(
  currentSpend: number,
  limit: number,
  pctUsed: number
): unknown[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "LLM Budget Alert",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${(pctUsed * 100).toFixed(1)}%* of monthly budget used\n\nSpend: *$${currentSpend.toFixed(2)}* / $${limit.toFixed(2)}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Settings" },
          url: `${appUrl}/settings`,
        },
      ],
    },
  ];
}

export function staleQueueTemplate(count: number): unknown[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${count} ${count === 1 ? "reply" : "replies"}* in the queue older than 4 hours. Time to review!`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open Queue" },
          url: `${appUrl}/queue`,
        },
      ],
    },
  ];
}
