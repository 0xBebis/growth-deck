"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { ReplyCard } from "./reply-card";

interface ReplyQueueProps {
  replies: Array<{
    id: string;
    draftContent: string;
    finalContent: string | null;
    status: string;
    draftModel: string | null;
    draftCost: number | null;
    platform: string;
    platformAccountId: string | null;
    createdAt: Date;
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
  }>;
  platformAccounts: Array<{
    id: string;
    displayName: string;
    platform: string;
  }>;
  currentFilters: {
    status?: string;
    platform?: string;
  };
}

const statuses = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
];

function QueueFilters({ currentFilters }: { currentFilters: ReplyQueueProps["currentFilters"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/queue?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Status:</span>
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => updateFilter("status", s.value)}
          className={`rounded-md px-3 py-1 text-sm ${
            (currentFilters.status || "") === s.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function ReplyQueue({ replies, platformAccounts, currentFilters }: ReplyQueueProps) {
  const pendingCount = replies.filter((r) => r.status === "DRAFT").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Suspense>
          <QueueFilters currentFilters={currentFilters} />
        </Suspense>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {pendingCount} pending
          </span>
        )}
      </div>

      {replies.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No replies in the queue. Draft a reply from the Discovery feed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              platformAccounts={platformAccounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
