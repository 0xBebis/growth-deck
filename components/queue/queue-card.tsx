"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkDraftQuality } from "@/lib/drafting/prompts";
import { getPlatformStyle, getPlatformIcon } from "@/lib/utils/platform";
import { getTimeAgo } from "@/lib/utils/time";

interface QueueCardProps {
  reply: {
    id: string;
    draftContent: string;
    finalContent: string | null;
    status: string;
    draftModel: string | null;
    draftCost: number | null;
    platform: string;
    platformAccountId: string | null;
    createdAt: Date | string;
    discoveredPost: {
      content: string;
      externalUrl: string;
      authorHandle: string | null;
      authorName: string | null;
      platform: string;
      intentType: string | null;
    };
    author: {
      name: string | null;
    };
    platformAccount: {
      id: string;
      displayName: string;
      platform: string;
    } | null;
  };
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onRegenerate: () => void;
  onSend: () => void;
  onDelete: () => void;
  platformAccounts: Array<{ id: string; displayName: string; platform: string }>;
  compact?: boolean;
}

export function QueueCard({
  reply,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onRegenerate,
  onSend,
  onDelete,
  platformAccounts,
  compact = false,
}: QueueCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(reply.finalContent || reply.draftContent);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const displayContent = reply.finalContent || reply.draftContent;
  const quality = checkDraftQuality(displayContent);
  const timeAgo = getTimeAgo(new Date(reply.createdAt));

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/replies/${reply.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalContent: content }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await onRegenerate();
    setRegenerating(false);
  }

  async function handleSend() {
    setSending(true);
    await onSend();
    setSending(false);
  }

  const statusConfig = {
    DRAFT: { label: "Draft", color: "bg-amber-500/20 text-amber-400", icon: "✏️" },
    SCHEDULED: { label: "Review", color: "bg-blue-500/20 text-blue-400", icon: "👀" },
    SENT: { label: "Sent", color: "bg-green-500/20 text-green-400", icon: "✓" },
    FAILED: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: "✗" },
  };

  const status = statusConfig[reply.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  if (compact) {
    return (
      <div
        className={`
          rounded-xl glass p-3 cursor-pointer transition-smooth
          ${isSelected ? "ring-2 ring-primary border-primary/50" : "hover:bg-white/5"}
        `}
        onClick={onSelect}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold ${getPlatformStyle(reply.platform)}`}>
              {getPlatformIcon(reply.platform)}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {reply.discoveredPost.authorHandle || "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              quality.score >= 70 ? "bg-green-400" :
              quality.score >= 40 ? "bg-amber-400" : "bg-red-400"
            }`} title={`Quality: ${quality.score}%`} />
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>

        {/* Original post preview */}
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
          {reply.discoveredPost.content.slice(0, 100)}...
        </p>

        {/* Reply preview */}
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-xs line-clamp-3 text-foreground/90">
            {displayContent.slice(0, 150)}{displayContent.length > 150 && "..."}
          </p>
        </div>

        {/* Actions (show on hover/select) */}
        {isSelected && reply.status === "DRAFT" && (
          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border/30">
            <button
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
              className="px-2 py-1 text-[10px] hover:bg-white/10 rounded-md transition-smooth"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRegenerate(); }}
              disabled={regenerating}
              className="px-2 py-1 text-[10px] hover:bg-white/10 rounded-md transition-smooth"
            >
              {regenerating ? "..." : "Regen"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleSend(); }}
              disabled={sending}
              className="px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded-md glow-sm"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full list view card
  return (
    <div
      className={`
        group px-4 py-3 transition-smooth cursor-pointer
        ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-white/3"}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Left: Platform and status */}
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${getPlatformStyle(reply.platform)}`}>
            {getPlatformIcon(reply.platform)}
          </span>
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Middle: Content */}
        <div className="flex-1 min-w-0">
          {/* Original post */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-foreground">
              {reply.discoveredPost.authorHandle || reply.discoveredPost.authorName || "Unknown"}
            </span>
            {reply.discoveredPost.intentType && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-primary/20 text-primary font-medium">
                {reply.discoveredPost.intentType}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {reply.discoveredPost.content.slice(0, 150)}
          </p>

          {/* Reply content */}
          {isExpanded && editing ? (
            <div className="mt-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-3 rounded-xl glass border-border/50 text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {content.length} chars • Quality: {checkDraftQuality(content).score}%
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(false); }}
                    className="px-2 py-1 text-xs hover:bg-white/10 rounded-md transition-smooth"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    disabled={saving}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md glow-sm"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-2 rounded-lg bg-white/5 ${isExpanded ? "" : "line-clamp-2"}`}
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
            >
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{displayContent}</p>
            </div>
          )}

          {/* Expanded actions */}
          {isExpanded && !editing && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
              <div className="flex items-center gap-3">
                <a
                  href={reply.discoveredPost.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>View original</span>
                  <span>↗</span>
                </a>
                {reply.draftModel && (
                  <span className="text-[10px] text-muted-foreground">
                    {reply.draftModel.split("/").pop()} • ${(reply.draftCost || 0).toFixed(4)}
                  </span>
                )}
              </div>

              {reply.status === "DRAFT" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-md transition-smooth"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                    className="px-2 py-1 text-xs glass border-border/50 rounded-md hover:bg-white/5 transition-smooth"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRegenerate(); }}
                    disabled={regenerating}
                    className="px-2 py-1 text-xs glass border-border/50 rounded-md hover:bg-white/5 transition-smooth"
                  >
                    {regenerating ? "..." : "Regenerate"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSend(); }}
                    disabled={sending}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md glow-sm"
                  >
                    {sending ? "Sending..." : "Send Now"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quality indicator */}
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
            quality.score >= 70 ? "bg-green-500/20 text-green-400" :
            quality.score >= 40 ? "bg-amber-500/20 text-amber-400" :
            "bg-red-500/20 text-red-400"
          }`}>
            {quality.score}%
          </span>
          {quality.issues.length > 0 && (
            <span className="text-[9px] text-red-400">
              {quality.issues.length} issue{quality.issues.length !== 1 && "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

