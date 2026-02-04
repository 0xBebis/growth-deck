"use client";

import { useState } from "react";

interface ReplyEditorProps {
  replyId: string;
  initialContent: string;
  draftModel: string | null;
  draftCost: number | null;
  onSave: (content: string) => void;
}

export function ReplyEditor({
  replyId,
  initialContent,
  draftModel,
  draftCost,
  onSave,
}: ReplyEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/replies/${replyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalContent: content }),
      });
      if (res.ok) onSave(content);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full rounded-xl glass border-border/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {draftModel && `Model: ${draftModel}`}
          {draftCost != null && ` · $${draftCost.toFixed(4)}`}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg glass border-border/50 px-3 py-1.5 text-xs font-medium hover:bg-white/5 disabled:opacity-50 transition-smooth"
        >
          {saving ? "Saving..." : "Save Edit"}
        </button>
      </div>
    </div>
  );
}
