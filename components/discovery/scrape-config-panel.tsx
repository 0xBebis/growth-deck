/**
 * Discovery Engine - Unified Keyword Management
 * Single source of truth for keyword discovery and scraping.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  X,
  Check,
  Zap,
  ArrowRight,
  Plus,
  Rocket,
  Brain,
  CheckCircle2,
  Wand2,
  Trash2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  CATEGORY_CONFIG,
  SMART_SUGGESTIONS,
  SCRAPE_TEMPLATES,
  KEYWORD_CATEGORIES,
  type KeywordCategory,
} from "@/lib/constants/keywords";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ScrapeProgress {
  phase: "idle" | "optimizing" | "scraping" | "complete" | "error";
  currentPlatform?: string;
  platformsComplete: string[];
  totalResults: number;
  message?: string;
}

interface SavedKeyword {
  id: string;
  phrase: string;
  category: string;
  postsMatched: number;
}

interface KeywordsResponse {
  keywords: SavedKeyword[];
  grouped: Record<string, SavedKeyword[]>;
  total: number;
}

// ─── Platform Configuration ──────────────────────────────────────────────────

const PLATFORMS = {
  X: { id: "X", name: "X", icon: "𝕏", selectedBg: "bg-zinc-700", borderColor: "border-zinc-500" },
  REDDIT: { id: "REDDIT", name: "Reddit", icon: "r/", selectedBg: "bg-orange-600", borderColor: "border-orange-500" },
  LINKEDIN: { id: "LINKEDIN", name: "LinkedIn", icon: "in", selectedBg: "bg-blue-600", borderColor: "border-blue-500" },
  HN: { id: "HN", name: "HN", icon: "Y", selectedBg: "bg-orange-500", borderColor: "border-orange-400" },
} as const;

type PlatformKey = keyof typeof PLATFORMS;

// ─── AI Configuration ────────────────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `You are an elite growth marketing AI. Your expertise: SEO, social listening, audience psychology, competitive intelligence.

RESPONSE FORMAT - Use this exact format:
**Suggested Keywords:**
• keyword one
• keyword two
• keyword three

Be concise. Focus on high-intent keywords for finding:
1. People seeking solutions
2. Pain point discussions
3. Competitor comparisons
4. Purchase-ready conversations`;

const AI_MODEL = "google/gemini-2.0-flash-001";

// ─── Main Component ──────────────────────────────────────────────────────────

export function ScrapeConfigPanel() {
  const router = useRouter();

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "templates" | "keywords">("keywords");

  // Scrape Configuration
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(["X", "REDDIT"]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Keyword Management
  const [savedKeywords, setSavedKeywords] = useState<KeywordsResponse | null>(null);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState<KeywordCategory>("PRODUCT");
  const [savingKeyword, setSavingKeyword] = useState(false);

  // AI Chat
  const [aiInput, setAiInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scrape Progress
  const [progress, setProgress] = useState<ScrapeProgress>({
    phase: "idle",
    platformsComplete: [],
    totalResults: 0,
  });

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Fetch saved keywords
  const fetchKeywords = useCallback(async () => {
    setLoadingKeywords(true);
    try {
      const res = await fetch("/api/keywords");
      const data: KeywordsResponse = await res.json();
      setSavedKeywords(data);
    } catch (err) {
      console.error("Failed to load keywords:", err);
    } finally {
      setLoadingKeywords(false);
    }
  }, []);

  // Fetch keywords when panel opens
  useEffect(() => {
    if (isOpen && !savedKeywords && !loadingKeywords) {
      fetchKeywords();
    }
  }, [isOpen, savedKeywords, loadingKeywords, fetchKeywords]);

  // Save new keyword to DB with optimistic update
  const saveKeyword = useCallback(async () => {
    if (!newKeyword.trim() || savingKeyword) return;

    const phrase = newKeyword.trim();
    const category = newCategory;

    // Optimistic update - add immediately to UI
    const tempId = `temp-${Date.now()}`;
    const newKw: SavedKeyword = { id: tempId, phrase, category, postsMatched: 0 };

    setSavedKeywords(prev => {
      if (!prev) return { keywords: [newKw], grouped: { [category]: [newKw] }, total: 1 };
      const keywords = [...prev.keywords, newKw];
      const grouped = { ...prev.grouped };
      grouped[category] = [...(grouped[category] || []), newKw];
      return { keywords, grouped, total: prev.total + 1 };
    });
    setNewKeyword("");

    setSavingKeyword(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, category }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Replace temp ID with real ID
        setSavedKeywords(prev => {
          if (!prev) return prev;
          const keywords = prev.keywords.map(k => k.id === tempId ? { ...k, id: saved.id } : k);
          const grouped = { ...prev.grouped };
          grouped[category] = (grouped[category] || []).map(k => k.id === tempId ? { ...k, id: saved.id } : k);
          return { keywords, grouped, total: prev.total };
        });
      } else {
        // Rollback on error
        const err = await res.json();
        console.error("Failed to save keyword:", err.error);
        setSavedKeywords(prev => {
          if (!prev) return prev;
          const keywords = prev.keywords.filter(k => k.id !== tempId);
          const grouped = { ...prev.grouped };
          grouped[category] = (grouped[category] || []).filter(k => k.id !== tempId);
          return { keywords, grouped, total: prev.total - 1 };
        });
      }
    } catch (err) {
      console.error("Failed to save keyword:", err);
      // Rollback on error
      setSavedKeywords(prev => {
        if (!prev) return prev;
        const keywords = prev.keywords.filter(k => k.id !== tempId);
        const grouped = { ...prev.grouped };
        grouped[category] = (grouped[category] || []).filter(k => k.id !== tempId);
        return { keywords, grouped, total: prev.total - 1 };
      });
    } finally {
      setSavingKeyword(false);
    }
  }, [newKeyword, newCategory, savingKeyword]);

  // Delete keyword from DB with optimistic update
  const deleteKeyword = useCallback(async (id: string) => {
    // Find the keyword to delete (for rollback)
    const keywordToDelete = savedKeywords?.keywords.find(k => k.id === id);
    if (!keywordToDelete) return;

    // Optimistic update - remove immediately from UI
    setSavedKeywords(prev => {
      if (!prev) return prev;
      const keywords = prev.keywords.filter(k => k.id !== id);
      const grouped = { ...prev.grouped };
      Object.keys(grouped).forEach(cat => {
        grouped[cat] = grouped[cat].filter(k => k.id !== id);
      });
      return { keywords, grouped, total: prev.total - 1 };
    });

    try {
      const res = await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Rollback on error
        setSavedKeywords(prev => {
          if (!prev) return prev;
          const keywords = [...prev.keywords, keywordToDelete];
          const grouped = { ...prev.grouped };
          const cat = keywordToDelete.category;
          grouped[cat] = [...(grouped[cat] || []), keywordToDelete];
          return { keywords, grouped, total: prev.total + 1 };
        });
      }
    } catch (err) {
      console.error("Failed to delete keyword:", err);
      // Rollback on error
      setSavedKeywords(prev => {
        if (!prev) return prev;
        const keywords = [...prev.keywords, keywordToDelete];
        const grouped = { ...prev.grouped };
        const cat = keywordToDelete.category;
        grouped[cat] = [...(grouped[cat] || []), keywordToDelete];
        return { keywords, grouped, total: prev.total + 1 };
      });
    }
  }, [savedKeywords]);

  // Toggle keyword selection for scrape
  const toggleKeyword = useCallback((phrase: string) => {
    const lower = phrase.toLowerCase();
    setSelectedKeywords(prev =>
      prev.includes(lower) ? prev.filter(k => k !== lower) : [...prev, lower]
    );
  }, []);

  // Select all keywords
  const selectAllKeywords = useCallback(() => {
    if (!savedKeywords) return;
    const all = savedKeywords.keywords.map(k => k.phrase.toLowerCase());
    setSelectedKeywords(prev => [...new Set([...prev, ...all])]);
  }, [savedKeywords]);

  // Toggle platform
  const togglePlatform = useCallback((platform: PlatformKey) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.length > 1 ? prev.filter(p => p !== platform) : prev
        : [...prev, platform]
    );
  }, []);

  // Apply template
  const applyTemplate = useCallback((template: typeof SCRAPE_TEMPLATES[number]) => {
    setSelectedKeywords([...template.keywords]);
    setSelectedPlatforms([...template.platforms] as PlatformKey[]);
    setActiveTab("keywords");
  }, []);

  // Parse AI keywords
  const parseAiKeywords = useCallback((content: string): string[] => {
    const extracted: string[] = [];
    for (const line of content.split("\n")) {
      const match = line.match(/^[•\-\*]\s*(.+)$/);
      if (match) {
        const kw = match[1].replace(/[*`"]/g, "").trim();
        if (kw.length > 2 && kw.length < 50) extracted.push(kw);
      }
    }
    return extracted;
  }, []);

  // Send to AI
  const sendToAi = useCallback(async () => {
    if (!aiInput.trim() || isAiThinking) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsAiThinking(true);

    try {
      const response = await fetch("/api/openrouter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: "system", content: AI_SYSTEM_PROMPT },
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          maxTokens: 600,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate suggestions.";

      setChatMessages(prev => [...prev, { role: "assistant", content: aiContent }]);

      const extracted = parseAiKeywords(aiContent);
      if (extracted.length > 0) {
        setSelectedKeywords(prev => [...new Set([...prev, ...extracted])]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsAiThinking(false);
    }
  }, [aiInput, chatMessages, isAiThinking, parseAiKeywords]);

  // Run scrape
  const runScrape = useCallback(async () => {
    if (selectedKeywords.length === 0 || selectedPlatforms.length === 0) return;

    setProgress({ phase: "optimizing", platformsComplete: [], totalResults: 0, message: "Optimizing queries..." });

    try {
      const response = await fetch("/api/scrape/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: selectedKeywords.join(", "), platforms: selectedPlatforms }),
      });

      if (!response.ok) throw new Error("Scrape failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let allResults: unknown[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "optimized") {
              setProgress(prev => ({ ...prev, phase: "scraping", message: "Searching..." }));
            } else if (data.type === "platform_start") {
              setProgress(prev => ({ ...prev, currentPlatform: data.platform }));
            } else if (data.type === "platform_complete") {
              allResults = [...allResults, ...(data.results || [])];
              setProgress(prev => ({
                ...prev,
                platformsComplete: [...prev.platformsComplete, data.platform],
                totalResults: allResults.length,
              }));
            } else if (data.type === "complete") {
              setProgress(prev => ({ ...prev, phase: "complete", message: `Found ${allResults.length} results!` }));
            }
          } catch { /* skip */ }
        }
      }

      if (allResults.length > 0) {
        sessionStorage.setItem("focus-scrape-results", JSON.stringify(allResults));
        window.dispatchEvent(new CustomEvent("focus-scrape-complete", { detail: allResults }));
      }

      setTimeout(() => {
        setIsOpen(false);
        setProgress({ phase: "idle", platformsComplete: [], totalResults: 0 });
        router.refresh();
      }, 1500);

    } catch {
      setProgress({ phase: "error", platformsComplete: [], totalResults: 0, message: "Something went wrong." });
    }
  }, [selectedKeywords, selectedPlatforms, router]);

  const canRun = selectedKeywords.length > 0 && selectedPlatforms.length > 0 && progress.phase === "idle";
  const isRunning = progress.phase !== "idle" && progress.phase !== "error";

  // ─── Collapsed State ───────────────────────────────────────────────────────

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group w-full mb-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        aria-label="Open Discovery Engine"
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 via-violet-500/8 to-fuchsia-500/8 border border-primary/20 hover:border-primary/40 transition-all">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-sm font-semibold text-zinc-100">Discovery Engine</h2>
            <p className="text-xs text-zinc-500">Find engagement opportunities across 4 platforms</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-primary transition-all shrink-0" />
        </div>
      </button>
    );
  }

  // ─── Expanded State ────────────────────────────────────────────────────────

  return (
    <div className="mb-4 rounded-xl bg-surface-1 border border-white/10 shadow-xl overflow-hidden" role="dialog" aria-label="Discovery Engine">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-2/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Discovery Engine</h2>
            <p className="text-[11px] text-zinc-500">Manage keywords & find conversations</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white cursor-pointer" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Overlay */}
      {isRunning && (
        <div className="absolute inset-0 z-50 bg-surface-1/98 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="text-center space-y-4 px-6">
            {progress.phase === "complete" ? (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-base font-semibold text-white">Complete!</p>
                <p className="text-sm text-zinc-400">{progress.message}</p>
              </>
            ) : (
              <>
                <div className="relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                  <div className="absolute inset-1.5 rounded-full bg-surface-2 flex items-center justify-center">
                    {progress.currentPlatform ? (
                      <span className="text-sm font-bold text-white">{PLATFORMS[progress.currentPlatform as PlatformKey]?.icon}</span>
                    ) : (
                      <Wand2 className="w-5 h-5 text-primary animate-pulse" />
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-white">
                  {progress.phase === "optimizing" ? "Optimizing..." : `Searching ${progress.currentPlatform || ""}`}
                </p>
                {progress.totalResults > 0 && <p className="text-xs text-emerald-400">{progress.totalResults} found</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5" role="tablist">
        {[
          { id: "keywords" as const, label: "Keywords", icon: Rocket },
          { id: "ai" as const, label: "AI", icon: Sparkles },
          { id: "templates" as const, label: "Templates", icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">

        {/* Keywords Tab - Unified Management */}
        {activeTab === "keywords" && (
          <div className="space-y-4 min-h-[180px]">
            {/* Add new keyword */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveKeyword()}
                placeholder="Add keyword..."
                className="flex-1 px-3 py-2 rounded-md bg-surface-0 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as KeywordCategory)}
                className="px-2 py-2 rounded-md bg-surface-0 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {KEYWORD_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                ))}
              </select>
              <button
                onClick={saveKeyword}
                disabled={!newKeyword.trim() || savingKeyword}
                className="px-3 py-2 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Keywords by category */}
            {loadingKeywords ? (
              <div className="text-center py-6 text-zinc-500 text-xs">Loading keywords...</div>
            ) : savedKeywords && savedKeywords.total > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">{savedKeywords.total} keywords saved</span>
                  <button onClick={selectAllKeywords} className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer">
                    Select all
                  </button>
                </div>

                {KEYWORD_CATEGORIES.map(category => {
                  const kws = savedKeywords.grouped[category] || [];
                  if (kws.length === 0) return null;
                  const config = CATEGORY_CONFIG[category];
                  const Icon = config.icon;

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className={cn("w-3 h-3", config.color)} />
                        <span className={cn("text-[10px] font-medium", config.color)}>{config.label}</span>
                        <span className="text-[9px] text-zinc-600">({kws.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {kws.map(kw => {
                          const isSelected = selectedKeywords.includes(kw.phrase.toLowerCase());
                          return (
                            <div
                              key={kw.id}
                              className={cn(
                                "group flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium leading-none border transition-colors",
                                isSelected
                                  ? "bg-primary/20 text-primary border-primary/30"
                                  : "bg-zinc-800/80 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700"
                              )}
                            >
                              <button onClick={() => toggleKeyword(kw.phrase)} className="cursor-pointer">
                                {kw.phrase}
                              </button>
                              {kw.postsMatched > 0 && <span className="text-[9px] text-zinc-500">{kw.postsMatched}</span>}
                              <button
                                onClick={() => deleteKeyword(kw.id)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 cursor-pointer ml-0.5"
                                aria-label={`Delete ${kw.phrase}`}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Smart suggestions */}
                <div className="pt-3 border-t border-white/5">
                  <div className="text-[10px] text-zinc-600 mb-2">Quick add suggestions</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.values(SMART_SUGGESTIONS).flat().slice(0, 8).map(text => (
                      <button
                        key={text}
                        onClick={() => { setNewKeyword(text); setNewCategory("PAIN_POINT"); }}
                        className="px-2 py-0.5 rounded-md text-[10px] leading-none bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 hover:bg-zinc-700 hover:text-white cursor-pointer"
                      >
                        + {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-700 rounded-lg">
                <p className="text-xs text-zinc-500 mb-2">No keywords yet</p>
                <p className="text-[10px] text-zinc-600">Add keywords above to start tracking</p>
              </div>
            )}
          </div>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <div className="space-y-3">
            <div className="rounded-lg bg-surface-0/80 border border-white/5 overflow-hidden">
              <div className="h-36 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-6 h-6 text-primary/50 mb-2" />
                    <p className="text-xs text-zinc-400">Describe what you're looking for</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">"Find people frustrated with trading apps"</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-lg px-3 py-2 text-xs", msg.role === "user" ? "bg-primary text-white" : "bg-zinc-800 text-zinc-200")}>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(delay => (
                          <span key={delay} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-white/5 p-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendToAi()}
                    placeholder="Ask AI for keyword ideas..."
                    className="flex-1 px-3 py-2 rounded-md bg-surface-2 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <button onClick={sendToAi} disabled={!aiInput.trim() || isAiThinking} className="px-3 py-2 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-40 cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Find frustrated users", "Competitor mentions", "Buying signals"].map(s => (
                <button key={s} onClick={() => setAiInput(s)} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] leading-none text-zinc-500 hover:text-white hover:bg-white/10 cursor-pointer">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-2 gap-2">
            {SCRAPE_TEMPLATES.map(template => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={cn("p-3 rounded-lg text-left cursor-pointer border", template.bgColor, template.borderColor)}
                >
                  <Icon className={cn("w-4 h-4 mb-2", template.accentColor)} />
                  <h3 className="text-xs font-semibold text-white mb-0.5">{template.title}</h3>
                  <p className="text-[10px] text-zinc-500 leading-tight">{template.description}</p>
                  <div className="mt-2 flex items-center gap-1">
                    {template.platforms.map(p => (
                      <span key={p} className={cn("w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center text-white", PLATFORMS[p as PlatformKey].selectedBg)}>
                        {PLATFORMS[p as PlatformKey].icon}
                      </span>
                    ))}
                    <span className="text-[9px] text-zinc-600 ml-1">{template.keywords.length} keywords</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Keywords for Scrape */}
        {selectedKeywords.length > 0 && (
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-zinc-400">Selected ({selectedKeywords.length})</h4>
              <button onClick={() => setSelectedKeywords([])} className="text-[10px] text-zinc-600 hover:text-zinc-400 cursor-pointer">Clear</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedKeywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[11px] font-medium leading-none border border-primary/20">
                  {kw}
                  <button onClick={() => toggleKeyword(kw)} className="hover:bg-primary/20 rounded p-0.5 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Platform Selection */}
        <div className="pt-3 border-t border-white/5">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Platforms</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(PLATFORMS) as PlatformKey[]).map(key => {
              const p = PLATFORMS[key];
              const isSelected = selectedPlatforms.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative p-2 rounded-lg text-center cursor-pointer border",
                    isSelected ? cn(p.selectedBg, p.borderColor) : "bg-zinc-800/60 border-zinc-700/50 hover:bg-zinc-800"
                  )}
                >
                  <div className={cn("w-6 h-6 rounded-md mx-auto mb-1 flex items-center justify-center text-[10px] font-bold", isSelected ? "bg-white/20 text-white" : "bg-zinc-700 text-zinc-500")}>
                    {p.icon}
                  </div>
                  <div className={cn("text-[10px] font-medium", isSelected ? "text-white" : "text-zinc-500")}>{p.name}</div>
                  {isSelected && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-2 h-2 text-zinc-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={runScrape}
          disabled={!canRun}
          className={cn(
            "w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer",
            canRun
              ? "bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg shadow-primary/20"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          )}
        >
          <Rocket className="w-4 h-4" />
          {selectedKeywords.length === 0 ? "Select keywords to start" : `Launch (${selectedKeywords.length} keywords)`}
        </button>
      </div>
    </div>
  );
}
