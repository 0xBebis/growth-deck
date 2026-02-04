"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PostRow } from "./post-row";
import { CommandPalette } from "./command-palette";
import { TrendsPanel } from "./trends-panel";
import { FilterBar } from "./filter-bar";

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

interface FeedContainerProps {
  posts: Post[];
  currentFilters: {
    platform?: string;
    intent?: string;
    audience?: string;
    sort?: string;
  };
  trends: {
    keyword: string;
    count: number;
    velocity: number;
    platforms: string[];
  }[];
}

export function FeedContainer({ posts, currentFilters, trends }: FeedContainerProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPost = posts[selectedIndex];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      if (e.key === "Escape") {
        setShowCommandPalette(false);
        return;
      }

      if (!showCommandPalette) {
        switch (e.key) {
          case "j":
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, posts.length - 1));
            break;
          case "k":
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
            break;
          case "o":
          case "Enter":
            e.preventDefault();
            if (selectedPost) {
              window.open(selectedPost.externalUrl, "_blank");
            }
            break;
          case "r":
            e.preventDefault();
            if (selectedPost && selectedPost.replies.length === 0) {
              handleDraft(selectedPost.id);
            }
            break;
          case "d":
            e.preventDefault();
            if (selectedPost && selectedPost.status !== "DISMISSED") {
              handleDismiss(selectedPost.id);
            }
            break;
          case "?":
            e.preventDefault();
            setShowCommandPalette(true);
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posts.length, selectedPost, showCommandPalette]);

  const handleDraft = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/discovery/${postId}/draft`, { method: "POST" });
      if (res.ok) {
        router.push("/queue");
      }
    } catch {
      // Handle error
    }
  }, [router]);

  const handleDismiss = useCallback(async (postId: string) => {
    try {
      await fetch(`/api/discovery/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      router.refresh();
    } catch {
      // Handle error
    }
  }, [router]);

  const stats = {
    total: posts.length,
    byPlatform: posts.reduce((acc, p) => {
      acc[p.platform] = (acc[p.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    questions: posts.filter((p) => p.intentType === "QUESTION").length,
    highPotential: posts.filter((p) => p.relevanceScore && p.relevanceScore >= 70).length,
  };

  return (
    <>
      <div className="flex gap-6" ref={containerRef}>
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="sticky top-0 z-20 glass rounded-t-2xl border-b-0">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <FilterBar currentFilters={currentFilters} />
              </div>
              <div className="flex items-center gap-2">
                {/* Live indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>Live</span>
                </div>
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:bg-white/[0.06] hover:text-white hover:border-white/[0.1] transition-smooth"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                  <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.06] rounded text-[10px] font-mono">⌘K</kbd>
                </button>
                <button
                  onClick={() => router.refresh()}
                  className="p-2.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-smooth"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-3 md:gap-5 px-5 py-3 text-xs border-t border-zinc-800" role="status" aria-live="polite">
              <span className="text-zinc-400">
                <strong className="text-white font-semibold">{stats.total}</strong> posts
              </span>
              <span className="h-4 w-px bg-zinc-700" />
              {Object.entries(stats.byPlatform).map(([platform, count]) => (
                <span key={platform} className="flex items-center gap-1.5 text-zinc-400">
                  <span className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`} />
                  <span>{count}</span>
                </span>
              ))}
              {stats.questions > 0 && (
                <>
                  <span className="h-4 w-px bg-zinc-700" />
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span>❓</span>
                    <span>{stats.questions}</span>
                  </span>
                </>
              )}
              {stats.highPotential > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span>🔥</span>
                  <span>{stats.highPotential}</span>
                </span>
              )}
            </div>
          </div>

          {/* Posts list */}
          {posts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/30">
              {posts.map((post, index) => (
                <PostRow
                  key={post.id}
                  post={post}
                  isSelected={index === selectedIndex}
                  onSelect={() => setSelectedIndex(index)}
                  onDraft={() => handleDraft(post.id)}
                  onDismiss={() => handleDismiss(post.id)}
                  onOpen={() => window.open(post.externalUrl, "_blank")}
                />
              ))}
            </div>
          )}

          {/* Footer with keyboard hints */}
          <div className="sticky bottom-0 z-20 glass rounded-b-2xl border-t-0 px-5 py-3 flex items-center justify-between text-xs">
            {/* Desktop keyboard hints */}
            <div className="hidden md:flex items-center gap-5" aria-label="Keyboard shortcuts">
              <span className="flex items-center gap-1.5 text-zinc-500">
                <kbd className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded font-mono text-[10px] text-zinc-300">j</kbd>
                <kbd className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded font-mono text-[10px] text-zinc-300">k</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <kbd className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded font-mono text-[10px] text-zinc-300">o</kbd>
                <span>open</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <kbd className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded font-mono text-[10px] text-zinc-300">r</kbd>
                <span>reply</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <kbd className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded font-mono text-[10px] text-zinc-300">d</kbd>
                <span>dismiss</span>
              </span>
            </div>
            {/* Mobile hint */}
            <span className="md:hidden text-zinc-500">Tap to select</span>
            <span className="text-zinc-400 font-medium tabular-nums" aria-live="polite">
              <span className="sr-only">Post </span>
              <span className="text-white">{selectedIndex + 1}</span>
              <span className="text-zinc-600"> / </span>
              <span>{posts.length}</span>
            </span>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 hidden lg:block">
          <div className="sticky top-4">
            <TrendsPanel trends={trends} />
          </div>
        </aside>
      </div>

      {/* Command palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        posts={posts}
        onSelectPost={(index) => {
          setSelectedIndex(index);
          setShowCommandPalette(false);
        }}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center animate-float">
          <span className="text-3xl">📡</span>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
          <span className="text-[10px] text-white font-bold">!</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">Ready to discover</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Your listeners are configured. Run them to start finding engagement opportunities across all platforms.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-8">
        {[
          { platform: "Reddit", cmd: "npm run scrape:reddit", icon: "r/", color: "bg-orange-600" },
          { platform: "Twitter", cmd: "npm run scrape:twitter", icon: "𝕏", color: "bg-zinc-700" },
          { platform: "LinkedIn", cmd: "npm run scrape:linkedin", icon: "in", color: "bg-blue-600" },
          { platform: "HN", cmd: "npm run scrape:hn", icon: "Y", color: "bg-orange-500" },
        ].map((p) => (
          <div key={p.platform} className="flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/5 transition-smooth cursor-pointer">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${p.color}`}>
              {p.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{p.platform}</div>
              <code className="text-[10px] text-muted-foreground truncate block font-mono">{p.cmd}</code>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p className="mb-2">Or run all at once:</p>
        <code className="px-4 py-2 glass rounded-lg inline-block font-mono text-primary">npm run scrape:all</code>
      </div>
    </div>
  );
}

function getPlatformColor(platform: string) {
  const colors: Record<string, string> = {
    X: "bg-zinc-400",
    LINKEDIN: "bg-blue-500",
    REDDIT: "bg-orange-500",
    HN: "bg-orange-400",
  };
  return colors[platform] || "bg-gray-400";
}
