import type { Platform } from "@prisma/client";

export interface ListenerResult {
  platform: Platform;
  externalId: string;
  externalUrl: string;
  authorName: string | null;
  authorHandle: string | null;
  content: string;
  threadContext: string | null;
  matchedKeywords: string[];
  discoveredAt: Date;
}

export interface ListenerConfig {
  keywords: string[];
  subreddits?: string[];
}
