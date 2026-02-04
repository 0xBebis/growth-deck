"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterBarProps {
  currentFilters: {
    platform?: string;
    intent?: string;
    audience?: string;
    sort?: string;
  };
}

const platforms = [
  { value: "", label: "All Platforms" },
  { value: "X", label: "X" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "REDDIT", label: "Reddit" },
  { value: "HN", label: "HN" },
];

const intents = [
  { value: "", label: "All Intents" },
  { value: "QUESTION", label: "Question" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "DISCUSSION", label: "Discussion" },
  { value: "SHOWCASE", label: "Showcase" },
];

const audiences = [
  { value: "", label: "All Audiences" },
  { value: "TRADER", label: "Traders" },
  { value: "RESEARCHER", label: "Researchers" },
  { value: "HYBRID", label: "Hybrid" },
];

const sorts = [
  { value: "recency", label: "Recent" },
  { value: "relevance", label: "Relevant" },
];

export function FilterBar({ currentFilters }: FilterBarProps) {
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
      router.push(`/discover?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { key: "platform", options: platforms, current: currentFilters.platform },
        { key: "intent", options: intents, current: currentFilters.intent },
        { key: "audience", options: audiences, current: currentFilters.audience },
        { key: "sort", options: sorts, current: currentFilters.sort || "recency" },
      ].map(({ key, options, current }) => (
        <select
          key={key}
          value={current || ""}
          onChange={(e) => updateFilter(key, e.target.value)}
          className="rounded-lg glass border-border/50 bg-transparent px-3 py-1.5 text-sm text-foreground transition-smooth hover:bg-white/5 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
