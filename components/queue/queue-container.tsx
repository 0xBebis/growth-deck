"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { QueueCard } from "./queue-card";
import { QualityPanel } from "./quality-panel";
import { checkDraftQuality } from "@/lib/drafting/prompts";

interface Reply {
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
    image: string | null;
  };
  platformAccount: {
    id: string;
    displayName: string;
    platform: string;
  } | null;
}

interface QueueContainerProps {
  replies: Reply[];
  platformAccounts: Array<{
    id: string;
    displayName: string;
    platform: string;
  }>;
}

type ViewMode = "kanban" | "list" | "focus";

const COLUMNS = [
  { id: "DRAFT", label: "Drafts", color: "border-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-400" },
  { id: "REVIEW", label: "Ready to Review", color: "border-blue-500", bg: "bg-blue-500/10", dot: "bg-blue-400" },
  { id: "SENT", label: "Sent", color: "border-green-500", bg: "bg-green-500/10", dot: "bg-green-400" },
];

export function QueueContainer({ replies, platformAccounts }: QueueContainerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group replies by status
  const columns = {
    DRAFT: replies.filter((r) => r.status === "DRAFT"),
    REVIEW: replies.filter((r) => r.status === "SCHEDULED"), // Using SCHEDULED as review
    SENT: replies.filter((r) => r.status === "SENT"),
  };

  const selectedReply = replies.find((r) => r.id === selectedId);
  const selectedQuality = selectedReply
    ? checkDraftQuality(selectedReply.finalContent || selectedReply.draftContent)
    : null;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const draftReplies = columns.DRAFT;
      const currentIndex = selectedId ? draftReplies.findIndex((r) => r.id === selectedId) : -1;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          if (draftReplies.length > 0) {
            const nextIndex = Math.min(currentIndex + 1, draftReplies.length - 1);
            setSelectedId(draftReplies[nextIndex]?.id || null);
          }
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          if (draftReplies.length > 0) {
            const prevIndex = Math.max(currentIndex - 1, 0);
            setSelectedId(draftReplies[prevIndex]?.id || null);
          }
          break;
        case "Enter":
          e.preventDefault();
          if (selectedId) {
            setExpandedId(expandedId === selectedId ? null : selectedId);
          }
          break;
        case "e":
          e.preventDefault();
          if (selectedId) {
            setExpandedId(selectedId);
          }
          break;
        case "r":
          e.preventDefault();
          if (selectedId) {
            handleRegenerate(selectedId);
          }
          break;
        case "s":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (selectedId) {
              handleSend(selectedId);
            }
          }
          break;
        case "o":
          e.preventDefault();
          if (selectedReply) {
            window.open(selectedReply.discoveredPost.externalUrl, "_blank");
          }
          break;
        case "Escape":
          e.preventDefault();
          setExpandedId(null);
          break;
        case "1":
          e.preventDefault();
          setViewMode("kanban");
          break;
        case "2":
          e.preventDefault();
          setViewMode("list");
          break;
        case "3":
          e.preventDefault();
          setViewMode("focus");
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, expandedId, columns.DRAFT, selectedReply]);

  const handleRegenerate = useCallback(async (id: string) => {
    await fetch(`/api/replies/${id}/regenerate`, { method: "POST" });
    router.refresh();
  }, [router]);

  const handleSend = useCallback(async (id: string) => {
    await fetch(`/api/replies/${id}/send`, { method: "POST" });
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/replies/${id}`, { method: "DELETE" });
    router.refresh();
  }, [router]);

  // Stats
  const stats = {
    drafts: columns.DRAFT.length,
    review: columns.REVIEW.length,
    sent: columns.SENT.length,
    totalCost: replies.reduce((acc, r) => acc + (r.draftCost || 0), 0),
  };

  return (
    <div ref={containerRef} className="h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f] border-b border-border/50 rounded-t-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">Reply Queue</h1>
            <div className="flex items-center gap-2">
              {stats.drafts > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                  {stats.drafts} drafts
                </span>
              )}
              {stats.sent > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                  {stats.sent} sent
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg glass border-border/50 p-0.5">
              {[
                { mode: "kanban" as const, icon: "▦", label: "Kanban" },
                { mode: "list" as const, icon: "≡", label: "List" },
                { mode: "focus" as const, icon: "◎", label: "Focus" },
              ].map((v) => (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-smooth ${
                    viewMode === v.mode
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  title={v.label}
                >
                  {v.icon}
                </button>
              ))}
            </div>

            <button
              onClick={() => router.refresh()}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-smooth"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-t border-border/30">
          <span>
            Total: <strong className="text-foreground">{replies.length}</strong> replies
          </span>
          <span className="text-border/50">│</span>
          <span>
            Cost: <strong className="text-foreground">${stats.totalCost.toFixed(4)}</strong>
          </span>
          {selectedReply && selectedQuality && (
            <>
              <span className="text-border/50">│</span>
              <span className={`${selectedQuality.score >= 70 ? "text-green-400" : selectedQuality.score >= 40 ? "text-amber-400" : "text-red-400"}`}>
                Quality: <strong>{selectedQuality.score}</strong>/100
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      {replies.length === 0 ? (
        <EmptyState />
      ) : viewMode === "kanban" ? (
        <KanbanView
          columns={columns}
          selectedId={selectedId}
          expandedId={expandedId}
          onSelect={setSelectedId}
          onExpand={setExpandedId}
          onRegenerate={handleRegenerate}
          onSend={handleSend}
          onDelete={handleDelete}
          platformAccounts={platformAccounts}
        />
      ) : viewMode === "list" ? (
        <ListView
          replies={replies}
          selectedId={selectedId}
          expandedId={expandedId}
          onSelect={setSelectedId}
          onExpand={setExpandedId}
          onRegenerate={handleRegenerate}
          onSend={handleSend}
          onDelete={handleDelete}
          platformAccounts={platformAccounts}
        />
      ) : (
        <FocusView
          replies={columns.DRAFT}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRegenerate={handleRegenerate}
          onSend={handleSend}
          onDelete={handleDelete}
          platformAccounts={platformAccounts}
        />
      )}

      {/* Footer with keyboard hints */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0a0f] border-t border-border/50 px-4 py-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">j</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">k</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">e</kbd>
              <span>edit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">r</kbd>
              <span>regenerate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">s</kbd>
              <span>send</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">o</kbd>
              <span>open original</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded">1</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded">2</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded">3</kbd>
            <span>switch view</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Kanban View Component
function KanbanView({
  columns,
  selectedId,
  expandedId,
  onSelect,
  onExpand,
  onRegenerate,
  onSend,
  onDelete,
  platformAccounts,
}: {
  columns: Record<string, Reply[]>;
  selectedId: string | null;
  expandedId: string | null;
  onSelect: (id: string) => void;
  onExpand: (id: string | null) => void;
  onRegenerate: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  platformAccounts: Array<{ id: string; displayName: string; platform: string }>;
}) {
  return (
    <div className="flex gap-4 p-4 pb-16 overflow-x-auto">
      {COLUMNS.map((col) => (
        <div key={col.id} className="flex-1 min-w-[320px] max-w-[400px]">
          <div className={`rounded-t-xl border-t-2 ${col.color} glass px-4 py-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="font-medium text-sm text-foreground">{col.label}</span>
              </div>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-white/5 rounded-full">
                {columns[col.id as keyof typeof columns]?.length || 0}
              </span>
            </div>
          </div>
          <div className="space-y-2 p-3 glass-subtle rounded-b-xl min-h-[400px] border-x border-b border-border/30">
            {columns[col.id as keyof typeof columns]?.map((reply) => (
              <QueueCard
                key={reply.id}
                reply={reply}
                isSelected={selectedId === reply.id}
                isExpanded={expandedId === reply.id}
                onSelect={() => onSelect(reply.id)}
                onExpand={() => onExpand(expandedId === reply.id ? null : reply.id)}
                onRegenerate={() => onRegenerate(reply.id)}
                onSend={() => onSend(reply.id)}
                onDelete={() => onDelete(reply.id)}
                platformAccounts={platformAccounts}
                compact
              />
            ))}
            {(!columns[col.id as keyof typeof columns] || columns[col.id as keyof typeof columns].length === 0) && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No {col.label.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// List View Component
function ListView({
  replies,
  selectedId,
  expandedId,
  onSelect,
  onExpand,
  onRegenerate,
  onSend,
  onDelete,
  platformAccounts,
}: {
  replies: Reply[];
  selectedId: string | null;
  expandedId: string | null;
  onSelect: (id: string) => void;
  onExpand: (id: string | null) => void;
  onRegenerate: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  platformAccounts: Array<{ id: string; displayName: string; platform: string }>;
}) {
  return (
    <div className="divide-y divide-border/30 pb-16">
      {replies.map((reply) => (
        <QueueCard
          key={reply.id}
          reply={reply}
          isSelected={selectedId === reply.id}
          isExpanded={expandedId === reply.id}
          onSelect={() => onSelect(reply.id)}
          onExpand={() => onExpand(expandedId === reply.id ? null : reply.id)}
          onRegenerate={() => onRegenerate(reply.id)}
          onSend={() => onSend(reply.id)}
          onDelete={() => onDelete(reply.id)}
          platformAccounts={platformAccounts}
          compact={false}
        />
      ))}
    </div>
  );
}

// Focus View Component (one at a time, full screen edit)
function FocusView({
  replies,
  selectedId,
  onSelect,
  onRegenerate,
  onSend,
  onDelete,
  platformAccounts,
}: {
  replies: Reply[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRegenerate: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  platformAccounts: Array<{ id: string; displayName: string; platform: string }>;
}) {
  const currentIndex = selectedId ? replies.findIndex((r) => r.id === selectedId) : 0;
  const reply = replies[currentIndex] || replies[0];

  if (!reply) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        No drafts to review
      </div>
    );
  }

  const quality = checkDraftQuality(reply.finalContent || reply.draftContent);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-16">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {replies.length} drafts
        </span>
        <div className="flex gap-1">
          {replies.map((r, i) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-primary" : "bg-muted hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Original post */}
      <div className="rounded-xl glass p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${getPlatformStyle(reply.platform)}`}>
            {getPlatformIcon(reply.platform)}
          </span>
          <span className="text-sm font-medium text-foreground">
            {reply.discoveredPost.authorHandle || reply.discoveredPost.authorName || "Unknown"}
          </span>
          {reply.discoveredPost.intentType && (
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-primary/20 text-primary font-medium">
              {reply.discoveredPost.intentType}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{reply.discoveredPost.content}</p>
        <a
          href={reply.discoveredPost.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1"
        >
          <span>View original</span>
          <span>↗</span>
        </a>
      </div>

      {/* Quality panel */}
      <QualityPanel quality={quality} />

      {/* Reply editor */}
      <div className="mt-4">
        <FocusEditor
          reply={reply}
          onRegenerate={() => onRegenerate(reply.id)}
          onSend={() => onSend(reply.id)}
          onDelete={() => onDelete(reply.id)}
          platformAccounts={platformAccounts}
        />
      </div>
    </div>
  );
}

// Focus mode editor with live quality checking
function FocusEditor({
  reply,
  onRegenerate,
  onSend,
  onDelete,
  platformAccounts,
}: {
  reply: Reply;
  onRegenerate: () => void;
  onSend: () => void;
  onDelete: () => void;
  platformAccounts: Array<{ id: string; displayName: string; platform: string }>;
}) {
  const router = useRouter();
  const [content, setContent] = useState(reply.finalContent || reply.draftContent);
  const [saving, setSaving] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(reply.platformAccountId || "");

  const quality = checkDraftQuality(content);
  const charLimit = reply.platform === "X" ? 280 : reply.platform === "LINKEDIN" ? 1300 : 10000;
  const charCount = content.length;

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/replies/${reply.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalContent: content }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full min-h-[200px] p-4 rounded-xl glass border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-smooth ${
            charCount > charLimit ? "border-red-500 focus:ring-red-500" : ""
          }`}
          placeholder="Write your reply..."
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-3 text-xs">
          <span className={charCount > charLimit ? "text-red-400" : "text-muted-foreground"}>
            {charCount}/{charLimit}
          </span>
          <span className={`px-2 py-0.5 rounded-md font-medium ${
            quality.score >= 70 ? "bg-green-500/20 text-green-400" :
            quality.score >= 40 ? "bg-amber-500/20 text-amber-400" :
            "bg-red-500/20 text-red-400"
          }`}>
            {quality.score}%
          </span>
        </div>
      </div>

      {/* Live quality issues */}
      {quality.issues.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-medium text-red-400 mb-1">Issues found:</p>
          <ul className="text-xs text-red-300 space-y-0.5">
            {quality.issues.slice(0, 3).map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Account selector and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Post as:</span>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-1.5 rounded-lg glass border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" className="bg-popover text-popover-foreground">Select account...</option>
            {platformAccounts
              .filter((a) => a.platform === reply.platform)
              .map((a) => (
                <option key={a.id} value={a.id} className="bg-popover text-popover-foreground">
                  {a.displayName}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth"
          >
            Delete
          </button>
          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 text-xs glass border-border/50 rounded-lg hover:bg-white/5 transition-smooth"
          >
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs glass border-border/50 rounded-lg hover:bg-white/5 transition-smooth disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onSend}
            disabled={charCount > charLimit || !selectedAccountId}
            className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
          >
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center animate-float">
          <span className="text-3xl">📝</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">Queue is empty</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Find posts in the Discovery feed and click "Draft" to start building your reply queue.
      </p>
      <a
        href="/discover"
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-smooth glow-sm"
      >
        Go to Discovery
      </a>
    </div>
  );
}

function getPlatformStyle(platform: string) {
  const styles: Record<string, string> = {
    X: "bg-zinc-700 text-white",
    LINKEDIN: "bg-blue-600 text-white",
    REDDIT: "bg-orange-600 text-white",
    HN: "bg-orange-500 text-white",
  };
  return styles[platform] || "bg-zinc-600 text-white";
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
