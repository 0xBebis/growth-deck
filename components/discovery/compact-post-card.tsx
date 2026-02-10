"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PostActions } from "./post-actions";
import { getTimeAgo } from "@/lib/utils/time";

interface CompactPostCardProps {
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
    threadContext: string | null;
    discoveredAt: Date | string;
    replies: { id: string; status: string }[];
  };
}

export function CompactPostCard({ post }: CompactPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeAgo = getTimeAgo(new Date(post.discoveredAt));
  const hasReply = post.replies.length > 0;

  // Parse content based on platform
  const { headline, body, hasMore } = parseContent(post.platform, post.content);

  // Intent indicator
  const intentEmoji = getIntentEmoji(post.intentType);

  // Engagement potential indicator (based on relevance score)
  const potential = getPotentialIndicator(post.relevanceScore);

  return (
    <div
      className={`group rounded-lg border bg-card transition-all ${
        isExpanded ? "p-4" : "px-4 py-2.5"
      } ${hasMore ? "cursor-pointer" : ""}`}
      onClick={() => hasMore && setIsExpanded(!isExpanded)}
    >
      {/* Compact single-line view */}
      <div className="flex items-center gap-3">
        {/* Platform + Potential */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PlatformIcon platform={post.platform} size="sm" />
          {potential && (
            <span className={`text-xs font-medium ${potential.color}`}>
              {potential.label}
            </span>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {intentEmoji && <span className="shrink-0">{intentEmoji}</span>}
            <span className="text-sm font-medium truncate">
              {headline}
            </span>
            {hasMore && !isExpanded && (
              <span className="text-xs text-muted-foreground shrink-0">▶</span>
            )}
            {hasMore && isExpanded && (
              <span className="text-xs text-muted-foreground shrink-0">▼</span>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
          <span className="hidden sm:inline">{post.authorHandle || post.authorName || "anon"}</span>
          <span>{timeAgo}</span>
        </div>

        {/* Quick actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
             onClick={(e) => e.stopPropagation()}>
          <a
            href={post.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-2 py-1 text-xs hover:bg-muted"
            title="View original"
          >
            ↗
          </a>
          {!hasReply && post.status !== "DISMISSED" && (
            <button
              className="rounded px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              title="Draft reply"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && hasMore && (
        <div className="mt-3 pl-8 border-l-2 border-muted ml-2">
          {post.threadContext && (
            <p className="text-xs text-muted-foreground mb-2 italic">
              {post.threadContext}
            </p>
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {body}
          </p>
          {post.matchedKeywords && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.matchedKeywords.split(", ").slice(0, 5).map((kw) => (
                <span key={kw} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <PostActions
              postId={post.id}
              externalUrl={post.externalUrl}
              hasReply={hasReply}
              status={post.status}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function parseContent(platform: string, content: string): {
  headline: string;
  body: string | null;
  hasMore: boolean;
} {
  switch (platform) {
    case "REDDIT": {
      // Reddit: "Title\n\nBody"
      const parts = content.split("\n\n");
      const title = parts[0] || content;
      const body = parts.length > 1 ? parts.slice(1).join("\n\n") : null;
      return {
        headline: title.slice(0, 100) + (title.length > 100 ? "..." : ""),
        body,
        hasMore: !!body && body.trim().length > 0
      };
    }
    case "X": {
      // Twitter: Show first line or first 100 chars
      const firstLine = content.split("\n")[0];
      const truncated = firstLine.slice(0, 100);
      const rest = content.length > 100 ? content.slice(100) : null;
      return {
        headline: truncated + (content.length > 100 ? "..." : ""),
        body: rest ? content : null,
        hasMore: content.length > 100 || content.includes("\n")
      };
    }
    case "LINKEDIN": {
      // LinkedIn: Often long-form, show first sentence
      const firstSentence = content.match(/^[^.!?]*[.!?]/)?.[0] || content.slice(0, 100);
      return {
        headline: firstSentence.slice(0, 100) + (firstSentence.length > 100 ? "..." : ""),
        body: content.length > firstSentence.length ? content : null,
        hasMore: content.length > firstSentence.length
      };
    }
    case "HN": {
      // HN: Title for stories, first 100 chars for comments
      const firstLine = content.split("\n")[0];
      return {
        headline: firstLine.slice(0, 100) + (firstLine.length > 100 ? "..." : ""),
        body: content.length > firstLine.length ? content : null,
        hasMore: content.length > firstLine.length || content.includes("\n")
      };
    }
    default:
      return { headline: content.slice(0, 100), body: content, hasMore: content.length > 100 };
  }
}

function getIntentEmoji(intent: string | null): string | null {
  switch (intent) {
    case "QUESTION": return "❓";
    case "COMPLAINT": return "😤";
    case "DISCUSSION": return "💬";
    case "SHOWCASE": return "🚀";
    default: return null;
  }
}

function getPotentialIndicator(score: number | null): { label: string; color: string } | null {
  if (score === null) return null;
  if (score >= 80) return { label: "🔥", color: "text-red-500" };
  if (score >= 60) return { label: "⚡", color: "text-yellow-500" };
  if (score >= 40) return { label: "•", color: "text-blue-500" };
  return null;
}

