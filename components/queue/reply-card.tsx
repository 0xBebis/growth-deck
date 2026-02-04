"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { ReplyEditor } from "./reply-editor";
import { AccountSelector } from "./account-selector";

interface ReplyCardProps {
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
      platform: string;
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
  };
  platformAccounts: Array<{
    id: string;
    displayName: string;
    platform: string;
  }>;
}

export function ReplyCard({ reply, platformAccounts }: ReplyCardProps) {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState(
    reply.platformAccountId || ""
  );
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const displayContent = reply.finalContent || reply.draftContent;

  async function handleSend() {
    setSending(true);
    try {
      await fetch(`/api/replies/${reply.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformAccountId: selectedAccountId }),
      });
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await fetch(`/api/replies/${reply.id}/regenerate`, { method: "POST" });
      router.refresh();
    } finally {
      setRegenerating(false);
    }
  }

  async function handleAccountChange(accountId: string) {
    setSelectedAccountId(accountId);
    await fetch(`/api/replies/${reply.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platformAccountId: accountId }),
    });
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-amber-500/20 text-amber-400",
    SCHEDULED: "bg-blue-500/20 text-blue-400",
    SENT: "bg-green-500/20 text-green-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="rounded-xl glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusColors[reply.status] || ""}`}
          >
            {reply.status}
          </span>
          <PlatformIcon platform={reply.platform} />
          <span className="text-xs text-muted-foreground">
            {reply.discoveredPost.authorHandle || "Unknown"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {reply.author.name}
        </span>
      </div>

      <div className="mb-3 rounded-lg bg-white/5 p-3">
        <p className="text-xs text-muted-foreground">Original post:</p>
        <p className="mt-1 text-sm text-foreground/90">
          {reply.discoveredPost.content.slice(0, 200)}
          {reply.discoveredPost.content.length > 200 && "..."}
        </p>
      </div>

      {reply.status === "DRAFT" ? (
        <ReplyEditor
          replyId={reply.id}
          initialContent={displayContent}
          draftModel={reply.draftModel}
          draftCost={reply.draftCost}
          onSave={() => router.refresh()}
        />
      ) : (
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-sm text-foreground/90">{displayContent}</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <AccountSelector
          accounts={platformAccounts}
          selectedId={selectedAccountId}
          platform={reply.platform}
          onChange={handleAccountChange}
        />

        {reply.status === "DRAFT" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-lg glass border-border/50 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-50 transition-smooth"
            >
              {regenerating ? "Regenerating..." : "Regenerate"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
            >
              {sending ? "Sending..." : "Send Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
