"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getPlatformStyle, getPlatformIcon } from "@/lib/utils/platform";
import type { DismissedPost, ShowToast } from "../shared/types";

interface RecycleBinSectionProps {
  showToast: ShowToast;
}

export function RecycleBinSection({ showToast }: RecycleBinSectionProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<DismissedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Fetch dismissed posts
  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      try {
        const params: { search?: string; platform?: string } = {};
        if (search) params.search = search;
        if (platform) params.platform = platform;
        const data = await api.discovery.getDismissed(params);
        setPosts(data as unknown as DismissedPost[]);
      } catch {
        showToast("error", "Failed to load dismissed posts");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, [search, platform, showToast]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleRestore(ids: string[]) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/dismissed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", `Restored ${data.restored} post${data.restored !== 1 ? "s" : ""}`);
          setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
          setSelectedIds(new Set());
          router.refresh();
        }
      } catch {
        showToast("error", "Failed to restore posts");
      }
    });
  }

  async function handleRestoreAll() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/dismissed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", `Restored ${data.restored} posts`);
          setPosts([]);
          setSelectedIds(new Set());
          router.refresh();
        }
      } catch {
        showToast("error", "Failed to restore posts");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/discovery/dismissed?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          showToast("success", "Post permanently deleted");
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      } catch {
        showToast("error", "Failed to delete post");
      }
    });
  }

  async function handleEmptyTrash() {
    if (!confirm("Are you sure you want to permanently delete all dismissed posts? This cannot be undone.")) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/dismissed", {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", `Permanently deleted ${data.deleted} posts`);
          setPosts([]);
          setSelectedIds(new Set());
        }
      } catch {
        showToast("error", "Failed to empty recycle bin");
      }
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Recycle Bin</h2>
        <p className="text-sm text-muted-foreground">
          Posts you&apos;ve dismissed can be restored or permanently deleted here
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="recycle-search" className="sr-only">Search dismissed posts</label>
          <input
            id="recycle-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by content, author..."
            className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="recycle-platform" className="sr-only">Filter by platform</label>
          <select
            id="recycle-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" className="bg-popover text-popover-foreground">All Platforms</option>
            <option value="X" className="bg-popover text-popover-foreground">X (Twitter)</option>
            <option value="LINKEDIN" className="bg-popover text-popover-foreground">LinkedIn</option>
            <option value="REDDIT" className="bg-popover text-popover-foreground">Reddit</option>
            <option value="HN" className="bg-popover text-popover-foreground">Hacker News</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {posts.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl glass">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.size === posts.length && posts.length > 0
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground"
              }`}>
                {selectedIds.size === posts.length && posts.length > 0 && "✓"}
              </span>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => handleRestore(Array.from(selectedIds))}
                disabled={isPending}
                className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition-smooth"
              >
                Restore Selected
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreAll}
              disabled={isPending}
              className="px-3 py-1.5 text-sm glass border-border/50 rounded-lg hover:bg-white/5 disabled:opacity-50 transition-smooth"
            >
              Restore All
            </button>
            <button
              onClick={handleEmptyTrash}
              disabled={isPending}
              className="px-3 py-1.5 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-smooth"
            >
              Empty Trash
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="rounded-xl glass overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-3xl mb-2 block" role="img" aria-label="Empty trash">🗑️</span>
            <p className="text-sm text-muted-foreground">
              {search || platform ? "No dismissed posts match your search" : "No dismissed posts"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`flex items-start gap-3 p-4 transition-smooth ${
                  selectedIds.has(post.id) ? "bg-primary/5" : ""
                }`}
              >
                <button
                  onClick={() => toggleSelect(post.id)}
                  className={`mt-1 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selectedIds.has(post.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground hover:border-foreground"
                  }`}
                  aria-label={selectedIds.has(post.id) ? "Deselect post" : "Select post"}
                >
                  {selectedIds.has(post.id) && "✓"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${getPlatformStyle(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.authorHandle || post.authorName || "Unknown author"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • Dismissed {new Date(post.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore([post.id])}
                    disabled={isPending}
                    className="px-2 py-1 text-xs text-green-400 border border-green-500/20 rounded-md hover:bg-green-500/10 disabled:opacity-50 transition-smooth"
                    aria-label="Restore this post"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                    className="px-2 py-1 text-xs text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 disabled:opacity-50 transition-smooth"
                    aria-label="Permanently delete this post"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {posts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {posts.length} dismissed post{posts.length !== 1 ? "s" : ""} in recycle bin
        </p>
      )}
    </div>
  );
}
