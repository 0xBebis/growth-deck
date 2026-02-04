"use client";

import { useState, useRef, useEffect } from "react";

interface PostRowProps {
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
  isSelected?: boolean;
  onSelect?: () => void;
  onDraft?: () => void;
  onDismiss?: () => void;
  onOpen?: () => void;
}

export function PostRow({
  post,
  isSelected = false,
  onSelect,
  onDraft,
  onDismiss,
  onOpen
}: PostRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const hasReply = post.replies.length > 0;

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  const { headline, body, hasMore } = parseContent(post.platform, post.content);
  const timeAgo = getTimeAgo(new Date(post.discoveredAt));
  const opportunity = getOpportunityLevel(post);
  const intentConfig = getIntentConfig(post.intentType);

  const canExpand = hasMore || post.matchedKeywords || post.threadContext;

  return (
    <div
      ref={rowRef}
      className={`
        group relative transition-all duration-200 ease-out
        border-b border-zinc-800
        ${isSelected
          ? "bg-gradient-to-r from-primary/[0.12] to-transparent"
          : "hover:bg-white/[0.03]"
        }
        ${isExpanded ? "pb-4" : ""}
      `}
      onClick={() => onSelect?.()}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-primary/80 to-primary/40" />
      )}
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Opportunity indicator */}
        <div className="w-1.5 shrink-0">
          {opportunity.level > 0 && (
            <div
              className={`w-1.5 h-8 rounded-full ${opportunity.color}`}
              title={opportunity.label}
            />
          )}
        </div>

        {/* Platform badge */}
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${getPlatformStyle(post.platform)}`}>
          {getPlatformIcon(post.platform)}
        </div>

        {/* Intent indicator */}
        {intentConfig && (
          <span
            className={`shrink-0 text-sm ${intentConfig.color}`}
            title={intentConfig.label}
          >
            {intentConfig.icon}
          </span>
        )}

        {/* Content */}
        <div
          className={`
            flex-1 min-w-0 cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 transition-smooth
            ${canExpand ? "hover:bg-white/5" : ""}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
            if (canExpand) {
              setIsExpanded(!isExpanded);
            } else {
              onOpen?.();
            }
          }}
        >
          <div className="flex items-center gap-2">
            <span className={`text-base truncate ${isSelected ? "font-medium text-foreground" : "text-foreground/90"}`}>
              {headline}
            </span>
            {canExpand && (
              <span className={`text-xs shrink-0 transition-transform duration-200 ${isExpanded ? "text-primary rotate-90" : "text-muted-foreground"}`}>
                ▶
              </span>
            )}
          </div>
          {post.threadContext && !isExpanded && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {post.threadContext}
            </p>
          )}
        </div>

        {/* Time */}
        <div className="shrink-0 w-12 text-xs text-muted-foreground text-right">
          {timeAgo}
        </div>

        {/* Actions */}
        <div className={`
          flex items-center gap-1.5 shrink-0 transition-opacity
          ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}>
          <ActionButton
            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>}
            label="Open"
            onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
            href={post.externalUrl}
          />
          {!hasReply && post.status !== "DISMISSED" && (
            <ActionButton
              icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
              label="Draft reply"
              onClick={(e) => { e.stopPropagation(); onDraft?.(); }}
              primary
            />
          )}
          {hasReply && (
            <span className="px-2.5 py-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-lg font-medium border border-emerald-500/20">
              Drafted
            </span>
          )}
          {post.status !== "DISMISSED" && !hasReply && (
            <ActionButton
              icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
              label="Dismiss"
              onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
              danger
            />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && canExpand && (
        <div className="px-4 pl-16 pr-20 pb-1 animate-slide-up-fade">
          {/* Author info */}
          {(post.authorHandle || post.authorName) && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Posted by</span>
              <span className="text-xs font-medium text-foreground">
                {post.authorHandle || post.authorName}
              </span>
            </div>
          )}
          {post.threadContext && (
            <p className="text-xs text-muted-foreground mb-2 italic">
              {post.threadContext}
            </p>
          )}
          {hasMore && body && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {body}
            </p>
          )}
          {post.matchedKeywords && (
            <div className={`flex flex-wrap gap-1.5 ${hasMore && body ? "mt-3" : ""}`}>
              {post.matchedKeywords.split(", ").slice(0, 6).map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-md font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          {post.platform === "HN" && (
            <a
              href={post.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline"
            >
              <span>View on Hacker News</span>
              <span>↗</span>
            </a>
          )}
        </div>
      )}

      {/* Keyboard hint when selected and expanded - fixed to bottom of row */}
      {isSelected && isExpanded && (
        <div className="absolute right-4 bottom-3 hidden xl:flex items-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-[#27272a] border border-border/50 rounded text-foreground">o</kbd>
          <span>open</span>
          <kbd className="px-1.5 py-0.5 bg-[#27272a] border border-border/50 rounded text-foreground">r</kbd>
          <span>reply</span>
          <kbd className="px-1.5 py-0.5 bg-[#27272a] border border-border/50 rounded text-foreground">d</kbd>
          <span>dismiss</span>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  href,
  primary = false,
  danger = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  primary?: boolean;
  danger?: boolean;
}) {
  const baseStyles = "p-2 rounded-lg transition-all duration-200 flex items-center justify-center";

  const variantStyles = primary
    ? "bg-gradient-to-b from-primary/90 to-primary text-white border border-primary/50 shadow-[0_0_12px_-2px_rgba(139,92,246,0.4)] hover:shadow-[0_0_20px_-2px_rgba(139,92,246,0.5)] hover:from-primary hover:to-primary/90"
    : danger
    ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300"
    : "bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.1]";

  const className = `${baseStyles} ${variantStyles}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={label}
        onClick={onClick}
      >
        {icon}
      </a>
    );
  }

  return (
    <button className={className} title={label} onClick={onClick}>
      {icon}
    </button>
  );
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&#x27;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&quot;': '"',
    '&#x22;': '"',
    '&amp;': '&',
    '&#x26;': '&',
    '&lt;': '<',
    '&#x3C;': '<',
    '&gt;': '>',
    '&#x3E;': '>',
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&mdash;': '—',
    '&#x2014;': '—',
    '&ndash;': '–',
    '&#x2013;': '–',
    '&hellip;': '…',
    '&#x2026;': '…',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  // Handle numeric entities like &#123;
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  // Handle hex entities like &#x7B;
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  return decoded;
}

function parseContent(platform: string, content: string) {
  const decoded = decodeHtmlEntities(content);

  switch (platform) {
    case "REDDIT": {
      const parts = decoded.split("\n\n");
      const title = parts[0] || decoded;
      const body = parts.length > 1 ? parts.slice(1).join("\n\n") : null;
      return { headline: title, body, hasMore: !!body };
    }
    case "X": {
      const firstLine = decoded.split("\n")[0];
      return {
        headline: firstLine.length > 120 ? firstLine.slice(0, 120) + "…" : firstLine,
        body: decoded,
        hasMore: decoded.length > 120 || decoded.includes("\n")
      };
    }
    case "LINKEDIN": {
      const firstSentence = decoded.match(/^[^.!?]*[.!?]/)?.[0] || decoded.slice(0, 100);
      return {
        headline: firstSentence.length > 120 ? firstSentence.slice(0, 120) + "…" : firstSentence,
        body: decoded,
        hasMore: decoded.length > firstSentence.length
      };
    }
    case "HN": {
      const firstLine = decoded.split("\n")[0];
      return {
        headline: firstLine.length > 120 ? firstLine.slice(0, 120) + "…" : firstLine,
        body: decoded,
        hasMore: decoded.length > firstLine.length
      };
    }
    default:
      return { headline: decoded.slice(0, 120), body: decoded, hasMore: decoded.length > 120 };
  }
}

function getOpportunityLevel(post: { relevanceScore: number | null; intentType: string | null }) {
  if (post.intentType === "QUESTION") {
    return { level: 3, color: "bg-green-500", label: "High opportunity - Question" };
  }
  if (post.intentType === "COMPLAINT") {
    return { level: 3, color: "bg-amber-500", label: "High opportunity - Pain point" };
  }
  if (post.relevanceScore && post.relevanceScore >= 80) {
    return { level: 3, color: "bg-green-500", label: "High relevance" };
  }
  if (post.relevanceScore && post.relevanceScore >= 60) {
    return { level: 2, color: "bg-blue-500", label: "Medium opportunity" };
  }
  if (post.relevanceScore && post.relevanceScore >= 40) {
    return { level: 1, color: "bg-zinc-600", label: "Low opportunity" };
  }
  return { level: 0, color: "", label: "" };
}

function getIntentConfig(intent: string | null) {
  switch (intent) {
    case "QUESTION": return { icon: "❓", label: "Question - High engagement potential", color: "text-green-400" };
    case "COMPLAINT": return { icon: "😤", label: "Pain point - Opportunity to help", color: "text-amber-400" };
    case "DISCUSSION": return { icon: "💬", label: "Discussion", color: "text-blue-400" };
    case "SHOWCASE": return { icon: "🚀", label: "Showcase", color: "text-purple-400" };
    default: return null;
  }
}

function getPlatformStyle(platform: string) {
  const styles: Record<string, string> = {
    X: "bg-gradient-to-br from-zinc-600 to-zinc-700 text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
    LINKEDIN: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_2px_4px_rgba(37,99,235,0.3)]",
    REDDIT: "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_2px_4px_rgba(234,88,12,0.3)]",
    HN: "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-[0_2px_4px_rgba(251,146,60,0.3)]",
  };
  return styles[platform] || "bg-gradient-to-br from-zinc-600 to-zinc-700 text-white";
}

function getPlatformIcon(platform: string) {
  const icons: Record<string, string> = {
    X: "𝕏",
    LINKEDIN: "in",
    REDDIT: "r/",
    HN: "Y",
  };
  return icons[platform] || "?";
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}
