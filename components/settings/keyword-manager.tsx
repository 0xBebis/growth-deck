"use client";

import { createKeyword, deleteKeyword, toggleKeyword } from "@/app/(dashboard)/settings/actions";

interface KeywordManagerProps {
  keywords: Array<{
    id: string;
    phrase: string;
    category: string;
    isActive: boolean;
    postsMatched: number;
  }>;
}

const categoryColors: Record<string, string> = {
  PRODUCT: "bg-blue-100 text-blue-800",
  PAIN_POINT: "bg-orange-100 text-orange-800",
  COMPETITOR: "bg-red-100 text-red-800",
  RESEARCH: "bg-purple-100 text-purple-800",
};

export function KeywordManager({ keywords }: KeywordManagerProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <form action={createKeyword} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Phrase</label>
          <input
            name="phrase"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. automate trades"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select name="category" className="rounded-md border px-3 py-2 text-sm">
            <option value="PRODUCT">Product</option>
            <option value="PAIN_POINT">Pain Point</option>
            <option value="COMPETITOR">Competitor</option>
            <option value="RESEARCH">Research</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {keywords.map((kw) => (
          <div
            key={kw.id}
            className={`flex items-center justify-between rounded-md border p-3 ${!kw.isActive ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[kw.category] || ""}`}
              >
                {kw.category.replace("_", " ")}
              </span>
              <span className="text-sm">{kw.phrase}</span>
              <span className="text-xs text-muted-foreground">
                {kw.postsMatched} matches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleKeyword.bind(null, kw.id, !kw.isActive)}>
                <button
                  type="submit"
                  className="rounded border px-2 py-1 text-xs hover:bg-muted"
                >
                  {kw.isActive ? "Disable" : "Enable"}
                </button>
              </form>
              <form action={deleteKeyword.bind(null, kw.id)}>
                <button
                  type="submit"
                  className="rounded border px-2 py-1 text-xs text-destructive hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
