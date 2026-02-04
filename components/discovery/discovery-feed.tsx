"use client";

import { Suspense, useState } from "react";
import { FilterBar } from "./filter-bar";
import { PostCard } from "./post-card";
import { CompactPostCard } from "./compact-post-card";
import { TrendsPanel } from "./trends-panel";

interface Post {
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
  discoveredAt: Date;
  replies: { id: string; status: string }[];
}

interface DiscoveryFeedProps {
  posts: Post[];
  currentFilters: {
    platform?: string;
    intent?: string;
    audience?: string;
    sort?: string;
  };
  trends?: {
    keyword: string;
    count: number;
    velocity: number; // % change from previous period
    platforms: string[];
  }[];
}

type ViewMode = "compact" | "cards";

export function DiscoveryFeed({ posts, currentFilters, trends = [] }: DiscoveryFeedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compact");

  // Calculate stats
  const stats = {
    total: posts.length,
    byPlatform: posts.reduce((acc, p) => {
      acc[p.platform] = (acc[p.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    highPotential: posts.filter((p) => p.relevanceScore && p.relevanceScore >= 70).length,
    questions: posts.filter((p) => p.intentType === "QUESTION").length,
  };

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        {/* Header with stats and controls */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Suspense>
              <FilterBar currentFilters={currentFilters} />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-md border bg-card">
              <button
                onClick={() => setViewMode("compact")}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === "compact"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                } rounded-l-md`}
              >
                Compact
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === "cards"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                } rounded-r-md`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span><strong>{stats.total}</strong> posts</span>
          {Object.entries(stats.byPlatform).map(([platform, count]) => (
            <span key={platform} className="flex items-center gap-1">
              <PlatformDot platform={platform} />
              {count}
            </span>
          ))}
          {stats.highPotential > 0 && (
            <span className="text-red-500">🔥 {stats.highPotential} high potential</span>
          )}
          {stats.questions > 0 && (
            <span>❓ {stats.questions} questions</span>
          )}
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No posts discovered yet. Run the listeners to find matches.
            </p>
          </div>
        ) : (
          <div className={viewMode === "compact" ? "space-y-1" : "space-y-3"}>
            {posts.map((post) =>
              viewMode === "compact" ? (
                <CompactPostCard key={post.id} post={post} />
              ) : (
                <PostCard key={post.id} post={post} />
              )
            )}
          </div>
        )}
      </div>

      {/* Trends sidebar */}
      {trends.length > 0 && (
        <aside className="w-72 shrink-0 hidden lg:block">
          <TrendsPanel trends={trends} />
        </aside>
      )}
    </div>
  );
}

function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    X: "bg-black",
    LINKEDIN: "bg-blue-600",
    REDDIT: "bg-orange-500",
    HN: "bg-orange-400",
  };
  return (
    <span className={`w-2 h-2 rounded-full ${colors[platform] || "bg-gray-400"}`} />
  );
}
