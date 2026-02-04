"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostActionsProps {
  postId: string;
  externalUrl: string;
  hasReply: boolean;
  status: string;
}

export function PostActions({ postId, externalUrl, hasReply, status }: PostActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDraft() {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/${postId}/draft`, { method: "POST" });
      if (res.ok) {
        router.push("/queue");
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    try {
      await fetch(`/api/discovery/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      router.refresh();
    } catch {
      // Error handling
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        View Original
      </a>
      {!hasReply && status !== "DISMISSED" && (
        <button
          onClick={handleDraft}
          disabled={loading}
          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Drafting..." : "Draft Reply"}
        </button>
      )}
      {hasReply && (
        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
          Drafted
        </span>
      )}
      {status !== "DISMISSED" && (
        <button
          onClick={handleDismiss}
          className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
