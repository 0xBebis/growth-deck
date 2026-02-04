"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

interface Post {
  id: string;
  platform: string;
  content: string;
  authorHandle: string | null;
  externalUrl: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onSelectPost: (index: number) => void;
}

type Command = {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  keywords?: string[];
};

export function CommandPalette({ isOpen, onClose, posts, onSelectPost }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  const commands: Command[] = useMemo(() => [
    {
      id: "refresh",
      label: "Refresh feed",
      icon: "↻",
      action: () => { router.refresh(); onClose(); },
      keywords: ["reload", "update"],
    },
    {
      id: "filter-reddit",
      label: "Show Reddit only",
      icon: "r/",
      action: () => { router.push("/discover?platform=REDDIT"); onClose(); },
      keywords: ["reddit", "filter"],
    },
    {
      id: "filter-twitter",
      label: "Show Twitter only",
      icon: "𝕏",
      action: () => { router.push("/discover?platform=X"); onClose(); },
      keywords: ["twitter", "x", "filter"],
    },
    {
      id: "filter-linkedin",
      label: "Show LinkedIn only",
      icon: "in",
      action: () => { router.push("/discover?platform=LINKEDIN"); onClose(); },
      keywords: ["linkedin", "filter"],
    },
    {
      id: "filter-hn",
      label: "Show Hacker News only",
      icon: "Y",
      action: () => { router.push("/discover?platform=HN"); onClose(); },
      keywords: ["hackernews", "hn", "filter"],
    },
    {
      id: "filter-all",
      label: "Show all platforms",
      icon: "◉",
      action: () => { router.push("/discover"); onClose(); },
      keywords: ["all", "clear", "filter"],
    },
    {
      id: "filter-questions",
      label: "Show questions only",
      icon: "❓",
      action: () => { router.push("/discover?intent=QUESTION"); onClose(); },
      keywords: ["question", "filter", "opportunity"],
    },
    {
      id: "sort-recency",
      label: "Sort by recency",
      icon: "🕐",
      action: () => { router.push("/discover?sort=recency"); onClose(); },
      keywords: ["sort", "recent", "new"],
    },
    {
      id: "sort-relevance",
      label: "Sort by relevance",
      icon: "📊",
      action: () => { router.push("/discover?sort=relevance"); onClose(); },
      keywords: ["sort", "relevant", "score"],
    },
    {
      id: "go-queue",
      label: "Go to Reply Queue",
      icon: "📝",
      action: () => { router.push("/queue"); onClose(); },
      keywords: ["queue", "replies", "drafts"],
    },
    {
      id: "go-settings",
      label: "Go to Settings",
      icon: "⚙️",
      action: () => { router.push("/settings"); onClose(); },
      keywords: ["settings", "config"],
    },
  ], [router, onClose]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.keywords?.some((kw) => kw.includes(lowerQuery))
    );
  }, [query, commands]);

  const filteredPosts = useMemo(() => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return posts
      .map((post, index) => ({ post, index }))
      .filter(({ post }) => post.content.toLowerCase().includes(lowerQuery))
      .slice(0, 5);
  }, [query, posts]);

  const totalResults = filteredCommands.length + filteredPosts.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, totalResults - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex < filteredCommands.length) {
            filteredCommands[selectedIndex]?.action();
          } else {
            const postIndex = selectedIndex - filteredCommands.length;
            const post = filteredPosts[postIndex];
            if (post) {
              onSelectPost(post.index);
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, filteredPosts, totalResults, onClose, onSelectPost]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        ref={trapRef}
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl px-4"
      >
        <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <h2 id="command-palette-title" className="sr-only">Command Palette</h2>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50">
            <span className="text-primary text-lg" aria-hidden="true">⌘</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, posts, or keywords..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-results"
              aria-activedescendant={`command-item-${selectedIndex}`}
              aria-autocomplete="list"
              aria-label="Search commands and posts"
            />
            <kbd className="px-2 py-1 glass rounded-md text-xs text-muted-foreground" aria-hidden="true">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div id="command-results" role="listbox" className="max-h-80 overflow-y-auto" aria-label="Search results">
            {/* Commands */}
            {filteredCommands.length > 0 && (
              <div className="py-2" role="group" aria-labelledby="commands-group-label">
                <div id="commands-group-label" className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Commands
                </div>
                {filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.id}
                    id={`command-item-${index}`}
                    role="option"
                    aria-selected={selectedIndex === index}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-smooth ${
                      selectedIndex === index
                        ? "bg-primary/20 text-primary"
                        : "text-foreground hover:bg-white/5"
                    }`}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="w-6 text-center" aria-hidden="true">{cmd.icon}</span>
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Posts */}
            {filteredPosts.length > 0 && (
              <div className="py-2 border-t border-border/50" role="group" aria-labelledby="posts-group-label">
                <div id="posts-group-label" className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Posts
                </div>
                {filteredPosts.map(({ post, index: postIndex }, i) => {
                  const resultIndex = filteredCommands.length + i;
                  return (
                    <button
                      key={post.id}
                      id={`command-item-${resultIndex}`}
                      role="option"
                      aria-selected={selectedIndex === resultIndex}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-smooth ${
                        selectedIndex === resultIndex
                          ? "bg-primary/20 text-primary"
                          : "text-foreground hover:bg-white/5"
                      }`}
                      onClick={() => onSelectPost(postIndex)}
                      onMouseEnter={() => setSelectedIndex(resultIndex)}
                    >
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${getPlatformStyle(post.platform)}`}
                        aria-hidden="true"
                      >
                        {getPlatformIcon(post.platform)}
                      </span>
                      <span className="flex-1 truncate text-left">
                        {post.content.slice(0, 60)}...
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {post.authorHandle || "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {totalResults === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 glass rounded">↑↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 glass rounded">↵</kbd>
                <span>select</span>
              </span>
            </div>
            <span className="text-primary">?</span>
          </div>
        </div>
      </div>
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
  return styles[platform] || "bg-gray-600 text-white";
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
