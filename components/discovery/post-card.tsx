"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { IntentBadge } from "@/components/shared/intent-badge";
import { AudienceBadge } from "@/components/shared/audience-badge";
import { RelevanceScore } from "@/components/shared/relevance-score";
import { PostActions } from "./post-actions";

interface PostCardProps {
  post: {
    id: string;
    platform: string;
    externalUrl: string;
    authorName: string | null;
    authorHandle: string | null;
    content: string;
    relevanceScore: number | null;
    intentType: string | null;
    audienceType: string | null;
    status: string;
    matchedKeywords: string | null;
    discoveredAt: Date | string;
    replies: { id: string; status: string }[];
  };
}

export function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeAgo = getTimeAgo(new Date(post.discoveredAt));
  const hasReply = post.replies.length > 0;

  // For Reddit posts, split title from body (separated by double newline)
  const isReddit = post.platform === "REDDIT";
  const { title, body } = isReddit
    ? parseRedditContent(post.content)
    : { title: null, body: null };
  const hasBody = body && body.trim().length > 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={post.platform} />
          <span className="text-xs text-muted-foreground">
            {post.authorHandle || post.authorName || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <RelevanceScore score={post.relevanceScore} />
      </div>

      {isReddit && title ? (
        <div className="mb-3">
          <button
            onClick={() => hasBody && setIsExpanded(!isExpanded)}
            className={`text-left w-full ${hasBody ? "cursor-pointer" : "cursor-default"}`}
          >
            <h3 className="text-sm font-medium leading-relaxed">
              {title}
              {hasBody && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {isExpanded ? "▼" : "▶"}
                </span>
              )}
            </h3>
          </button>
          {isExpanded && hasBody && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          )}
        </div>
      ) : (
        <p className="mb-3 text-sm leading-relaxed">{post.content}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IntentBadge intent={post.intentType} />
          <AudienceBadge audience={post.audienceType} />
          {post.matchedKeywords && (
            <span className="text-[10px] text-muted-foreground">
              {post.matchedKeywords}
            </span>
          )}
        </div>
        <PostActions
          postId={post.id}
          externalUrl={post.externalUrl}
          hasReply={hasReply}
          status={post.status}
        />
      </div>
    </div>
  );
}

function parseRedditContent(content: string): { title: string; body: string | null } {
  // Reddit posts are stored as "Title\n\nBody text..."
  const parts = content.split("\n\n");
  const title = parts[0] || content;
  const body = parts.length > 1 ? parts.slice(1).join("\n\n") : null;
  return { title, body };
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
