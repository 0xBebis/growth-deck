"use client";

import { useState, useRef, useEffect } from "react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import type { FocusScrapeResult } from "@/lib/scrape/focus-scraper";

// Re-export for consumers of this module
export type { FocusScrapeResult };

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const PLATFORMS: Platform[] = [
  { id: "X", name: "Twitter/X", icon: "\u{1D54F}", color: "bg-zinc-700" },
  { id: "REDDIT", name: "Reddit", icon: "r/", color: "bg-orange-600" },
  { id: "LINKEDIN", name: "LinkedIn", icon: "in", color: "bg-blue-600" },
  { id: "HN", name: "Hacker News", icon: "Y", color: "bg-orange-500" },
];

type ScrapePhase = "input" | "optimizing" | "scraping" | "complete" | "error";

interface ScrapeProgress {
  phase: ScrapePhase;
  currentPlatform?: string;
  platformsCompleted: string[];
  totalResults: number;
  optimizedQueries?: Record<string, string[]>;
  error?: string;
}

interface FocusScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: FocusScrapeResult[]) => void;
}

export function FocusScrapeModal({ isOpen, onClose, onComplete }: FocusScrapeModalProps) {
  const [focus, setFocus] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["REDDIT", "HN"]);
  const [progress, setProgress] = useState<ScrapeProgress>({
    phase: "input",
    platformsCompleted: [],
    totalResults: 0,
  });
  const [results, setResults] = useState<FocusScrapeResult[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && progress.phase === "input") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, progress.phase]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && progress.phase === "input") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, progress.phase, onClose]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = async () => {
    if (!focus.trim() || selectedPlatforms.length === 0) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setProgress({ phase: "optimizing", platformsCompleted: [], totalResults: 0 });
    setResults([]);

    try {
      const response = await fetch("/api/scrape/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focus.trim(), platforms: selectedPlatforms }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Scrape failed");
      }

      // Stream progress updates via Server-Sent Events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let data;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              // Skip malformed JSON lines
              continue;
            }

            if (data.type === "optimized") {
              setProgress((prev) => ({
                ...prev,
                phase: "scraping",
                optimizedQueries: data.queries,
              }));
            } else if (data.type === "platform_start") {
              setProgress((prev) => ({
                ...prev,
                currentPlatform: data.platform,
              }));
            } else if (data.type === "platform_complete") {
              setProgress((prev) => ({
                ...prev,
                currentPlatform: undefined,
                platformsCompleted: [...prev.platformsCompleted, data.platform],
                totalResults: prev.totalResults + data.count,
              }));
              setResults((prev) => [...prev, ...data.results]);
            } else if (data.type === "complete") {
              setProgress((prev) => ({ ...prev, phase: "complete" }));
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (error) {
      // Don't show error if request was aborted (user cancelled)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setProgress((prev) => ({
        ...prev,
        phase: "error",
        error: error instanceof Error ? error.message : "Scrape failed",
      }));
    }
  };

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleClose = () => {
    if (progress.phase === "complete" && results.length > 0) {
      onComplete(results);
    }
    onClose();
    // Reset state after a short delay (for animation)
    setTimeout(() => {
      setFocus("");
      setSelectedPlatforms(["REDDIT", "HN"]);
      setProgress({ phase: "input", platformsCompleted: [], totalResults: 0 });
      setResults([]);
    }, 200);
  };

  const handleRetry = () => {
    setProgress({ phase: "input", platformsCompleted: [], totalResults: 0 });
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="focus-modal-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={progress.phase === "input" ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <div
          ref={trapRef}
          className="glass-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div>
              <h2 id="focus-modal-title" className="text-lg font-semibold text-foreground">
                Focus Scrape
              </h2>
              <p className="text-sm text-muted-foreground">What are you working on today?</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {progress.phase === "input" && (
              <InputPhase
                focus={focus}
                setFocus={setFocus}
                selectedPlatforms={selectedPlatforms}
                togglePlatform={togglePlatform}
                onSubmit={handleSubmit}
                inputRef={inputRef}
              />
            )}

            {(progress.phase === "optimizing" || progress.phase === "scraping") && (
              <ProgressPhase
                progress={progress}
                selectedPlatforms={selectedPlatforms}
              />
            )}

            {progress.phase === "complete" && (
              <CompletePhase
                resultCount={results.length}
                onClose={handleClose}
              />
            )}

            {progress.phase === "error" && (
              <ErrorPhase
                error={progress.error || "An unexpected error occurred"}
                onRetry={handleRetry}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Input Phase Component
function InputPhase({
  focus,
  setFocus,
  selectedPlatforms,
  togglePlatform,
  onSubmit,
  inputRef,
}: {
  focus: string;
  setFocus: (value: string) => void;
  selectedPlatforms: string[];
  togglePlatform: (id: string) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <>
      {/* Focus Input */}
      <textarea
        ref={inputRef}
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        placeholder="e.g., Building an AI trading bot for retail investors, looking for people asking about automated portfolio management..."
        className="w-full h-24 px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
      />

      {/* Platform Checkboxes */}
      <div className="mt-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Platforms to search
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedPlatforms.includes(platform.id)
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/[0.08] hover:bg-white/5"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${platform.color}`}
              >
                {platform.icon}
              </span>
              <span className="text-sm text-foreground">{platform.name}</span>
              {selectedPlatforms.includes(platform.id) && (
                <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!focus.trim() || selectedPlatforms.length === 0}
        className="mt-6 w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
      >
        Start Scraping
      </button>

      {/* Skip link */}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> to skip
      </p>
    </>
  );
}

// Progress Phase Component
function ProgressPhase({
  progress,
  selectedPlatforms,
}: {
  progress: ScrapeProgress;
  selectedPlatforms: string[];
}) {
  return (
    <div className="py-4">
      {/* Progress Indicator */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{progress.phase === "optimizing" ? "\u{1F916}" : "\u{1F50D}"}</span>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-foreground">
          {progress.phase === "optimizing"
            ? "AI is optimizing your search queries..."
            : `Searching ${progress.currentPlatform || "platforms"}...`}
        </p>

        {progress.optimizedQueries && (
          <p className="mt-2 text-xs text-muted-foreground">
            Generated {Object.values(progress.optimizedQueries).flat().length} optimized queries
          </p>
        )}
      </div>

      {/* Platform Progress */}
      <div className="mt-6 space-y-2">
        {selectedPlatforms.map((platformId) => {
          const platform = PLATFORMS.find((p) => p.id === platformId);
          const isComplete = progress.platformsCompleted.includes(platformId);
          const isCurrent = progress.currentPlatform === platformId;

          return (
            <div
              key={platformId}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isComplete
                  ? "bg-emerald-500/10"
                  : isCurrent
                  ? "bg-primary/10"
                  : "bg-white/[0.02]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold ${platform?.color}`}
              >
                {platform?.icon}
              </span>
              <span className="flex-1 text-sm text-foreground">{platform?.name}</span>
              {isComplete && (
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isCurrent && (
                <div className="w-4 h-4 rounded-full border-2 border-primary/50 border-t-primary animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {progress.totalResults} posts found so far
      </p>
    </div>
  );
}

// Complete Phase Component
function CompletePhase({
  resultCount,
  onClose,
}: {
  resultCount: number;
  onClose: () => void;
}) {
  const hasResults = resultCount > 0;

  return (
    <div className="py-8 text-center">
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${hasResults ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
        <span className="text-3xl">{hasResults ? "\u2728" : "\uD83D\uDD0D"}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {hasResults ? `Found ${resultCount} posts!` : "No posts found"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasResults
          ? "Ready to review in your feed"
          : "Try different keywords or expand your platform selection"}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium text-white transition-colors"
      >
        {hasResults ? "View Results" : "Close"}
      </button>
    </div>
  );
}

// Error Phase Component
function ErrorPhase({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="py-8 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="text-3xl">{"\u26A0\uFE0F"}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h3>
      <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-foreground transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
