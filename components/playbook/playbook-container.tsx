"use client";

import { useState, useTransition } from "react";
import { checkDraftQuality } from "@/lib/drafting/prompts";
import { PLATFORM_LABELS } from "@/lib/utils/constants";
import {
  updatePlaybookEntry,
  addBannedWord,
  removeBannedWord,
  addBannedPhrase,
  removeBannedPhrase,
  addWritingTip,
  removeWritingTip,
} from "@/app/(dashboard)/playbook/actions";

interface PlaybookEntry {
  id: string;
  platform: string;
  platformUrl: string;
  accountUrl: string | null;
  postingCadence: string;
  bestTimes: string | null;
  styleGuide: string;
  dos: string;
  donts: string;
  additionalNotes: string | null;
  maxLength: number;
  tone: string;
  goodExamples: unknown;
  badExamples: unknown;
}

interface WritingRules {
  id: string;
  bannedWords: unknown;
  bannedPhrases: unknown;
  writingTips: unknown;
}

interface PlaybookContainerProps {
  entries: PlaybookEntry[];
  writingRules: WritingRules;
}

type Tab = "platforms" | "writing" | "checker" | "templates";

export function PlaybookContainer({ entries, writingRules }: PlaybookContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("platforms");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("X");

  const tabs = [
    { id: "platforms" as const, label: "Platforms", icon: "📱" },
    { id: "writing" as const, label: "Humanlike Writing", icon: "✍️" },
    { id: "checker" as const, label: "AI Checker", icon: "🔍" },
    { id: "templates" as const, label: "Templates", icon: "📋" },
  ];

  return (
    <div className="h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 glass rounded-t-2xl border-b-0">
        <div className="px-5 py-4">
          <h1 className="text-lg font-semibold text-foreground">Playbook</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform guides, writing tips, and templates for authentic engagement
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-5 pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-b from-primary/90 to-primary text-white shadow-[0_0_16px_-2px_rgba(139,92,246,0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "platforms" && (
          <PlatformGuides
            entries={entries}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
          />
        )}
        {activeTab === "writing" && <WritingGuide writingRules={writingRules} />}
        {activeTab === "checker" && <AIChecker writingRules={writingRules} />}
        {activeTab === "templates" && <TemplateLibrary />}
      </div>
    </div>
  );
}

// Platform Guides Section
function PlatformGuides({
  entries,
  selectedPlatform,
  onSelectPlatform,
}: {
  entries: PlaybookEntry[];
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const entry = entries.find((e) => e.platform === selectedPlatform);

  const [editForm, setEditForm] = useState({
    styleGuide: entry?.styleGuide || "",
    dos: entry?.dos || "",
    donts: entry?.donts || "",
    maxLength: entry?.maxLength || 280,
    tone: entry?.tone || "casual, authentic",
    postingCadence: entry?.postingCadence || "",
    bestTimes: entry?.bestTimes || "",
    goodExamples: JSON.stringify((entry?.goodExamples as string[]) || [], null, 2),
    badExamples: JSON.stringify((entry?.badExamples as string[]) || [], null, 2),
  });

  // Update form when platform changes
  const handlePlatformChange = (platform: string) => {
    onSelectPlatform(platform);
    const newEntry = entries.find((e) => e.platform === platform);
    setEditForm({
      styleGuide: newEntry?.styleGuide || "",
      dos: newEntry?.dos || "",
      donts: newEntry?.donts || "",
      maxLength: newEntry?.maxLength || getDefaultMaxLength(platform),
      tone: newEntry?.tone || getDefaultTone(platform),
      postingCadence: newEntry?.postingCadence || "",
      bestTimes: newEntry?.bestTimes || "",
      goodExamples: JSON.stringify((newEntry?.goodExamples as string[]) || [], null, 2),
      badExamples: JSON.stringify((newEntry?.badExamples as string[]) || [], null, 2),
    });
    setIsEditing(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      if (entry?.id) formData.append("id", entry.id);
      formData.append("platform", selectedPlatform);
      formData.append("platformUrl", entry?.platformUrl || getPlatformUrl(selectedPlatform));
      formData.append("styleGuide", editForm.styleGuide);
      formData.append("dos", editForm.dos);
      formData.append("donts", editForm.donts);
      formData.append("maxLength", String(editForm.maxLength));
      formData.append("tone", editForm.tone);
      formData.append("postingCadence", editForm.postingCadence);
      formData.append("bestTimes", editForm.bestTimes);
      formData.append("goodExamples", editForm.goodExamples);
      formData.append("badExamples", editForm.badExamples);
      await updatePlaybookEntry(formData);
      setIsEditing(false);
    });
  };

  const goodExamples = (entry?.goodExamples as string[]) || [];
  const badExamples = (entry?.badExamples as string[]) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Platform selector */}
      <div className="lg:col-span-1">
        <h3 className="text-sm font-medium mb-3 text-foreground">Select Platform</h3>
        <div className="space-y-2">
          {["X", "LINKEDIN", "REDDIT", "HN"].map((platform) => {
            const platformEntry = entries.find((e) => e.platform === platform);
            const isSelected = selectedPlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => handlePlatformChange(platform)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-gradient-to-r from-primary/15 to-primary/5 border-primary/40 shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]"
                    : "glass-interactive border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg ${getPlatformStyle(platform)}`}>
                  {getPlatformIcon(platform)}
                </span>
                <div className="text-left">
                  <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {PLATFORM_LABELS[platform] || platform}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    ~{platformEntry?.maxLength || getDefaultMaxLength(platform)} chars
                  </p>
                </div>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform details */}
      <div className="lg:col-span-3 space-y-6">
        {/* Edit/Save button */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{PLATFORM_LABELS[selectedPlatform] || selectedPlatform} Guide</h3>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-b from-primary/90 to-primary text-white rounded-lg shadow-[0_0_16px_-2px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_-2px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isEditing ? (
            <>
              <div className="glass rounded-xl p-4">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Cadence</label>
                <input
                  type="text"
                  value={editForm.postingCadence}
                  onChange={(e) => setEditForm({ ...editForm, postingCadence: e.target.value })}
                  className="w-full mt-2 text-sm font-medium bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., 2-3 posts/day"
                />
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Best Times</label>
                <input
                  type="text"
                  value={editForm.bestTimes}
                  onChange={(e) => setEditForm({ ...editForm, bestTimes: e.target.value })}
                  className="w-full mt-2 text-sm font-medium bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., 9am, 1pm, 6pm"
                />
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Max Length</label>
                <input
                  type="number"
                  value={editForm.maxLength}
                  onChange={(e) => setEditForm({ ...editForm, maxLength: parseInt(e.target.value) || 280 })}
                  className="w-full mt-2 text-sm font-medium bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Tone</label>
                <input
                  type="text"
                  value={editForm.tone}
                  onChange={(e) => setEditForm({ ...editForm, tone: e.target.value })}
                  className="w-full mt-2 text-sm font-medium bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., casual, punchy"
                />
              </div>
            </>
          ) : (
            <>
              <StatCard label="Cadence" value={entry?.postingCadence || "Not set"} />
              <StatCard label="Best Times" value={entry?.bestTimes || "Any time"} />
              <StatCard label="Max Length" value={`${entry?.maxLength || getDefaultMaxLength(selectedPlatform)} chars`} />
              <StatCard label="Tone" value={entry?.tone || getDefaultTone(selectedPlatform)} />
            </>
          )}
        </div>

        {/* Style guide */}
        <div className="glass rounded-xl p-5">
          <h4 className="font-semibold text-foreground mb-3">Style Guide</h4>
          {isEditing ? (
            <textarea
              value={editForm.styleGuide}
              onChange={(e) => setEditForm({ ...editForm, styleGuide: e.target.value })}
              className="w-full min-h-[120px] p-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              placeholder="Describe the writing style for this platform..."
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {entry?.styleGuide || "No style guide defined. Click Edit to add one."}
            </p>
          )}
        </div>

        {/* Do's and Don'ts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] p-5">
            <h4 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">✓</span>
              Do&apos;s
            </h4>
            {isEditing ? (
              <textarea
                value={editForm.dos}
                onChange={(e) => setEditForm({ ...editForm, dos: e.target.value })}
                className="w-full min-h-[120px] p-4 rounded-lg bg-white/[0.04] border border-emerald-500/20 text-sm resize-none focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all text-foreground placeholder:text-muted-foreground"
                placeholder="Things to do. Separate with periods."
              />
            ) : (
              <ul className="space-y-2.5">
                {(entry?.dos || "").split(". ").filter(Boolean).map((item, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                    <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                    <span>{item.replace(/\.$/, "")}</span>
                  </li>
                ))}
                {!entry?.dos && <p className="text-sm text-zinc-500 italic">No do&apos;s defined yet</p>}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.08] to-red-500/[0.02] p-5">
            <h4 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-sm">✗</span>
              Don&apos;ts
            </h4>
            {isEditing ? (
              <textarea
                value={editForm.donts}
                onChange={(e) => setEditForm({ ...editForm, donts: e.target.value })}
                className="w-full min-h-[120px] p-4 rounded-lg bg-white/[0.04] border border-red-500/20 text-sm resize-none focus:outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/20 transition-all text-foreground placeholder:text-muted-foreground"
                placeholder="Things to avoid. Separate with periods."
              />
            ) : (
              <ul className="space-y-2.5">
                {(entry?.donts || "").split(". ").filter(Boolean).map((item, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                    <span>{item.replace(/\.$/, "")}</span>
                  </li>
                ))}
                {!entry?.donts && <p className="text-sm text-zinc-500 italic">No don&apos;ts defined yet</p>}
              </ul>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="glass rounded-xl p-5">
          <h4 className="font-semibold text-foreground mb-4">Examples</h4>
          {isEditing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">✓</span>
                  Good Examples (JSON array)
                </p>
                <textarea
                  value={editForm.goodExamples}
                  onChange={(e) => setEditForm({ ...editForm, goodExamples: e.target.value })}
                  className="w-full min-h-[150px] p-4 rounded-lg bg-white/[0.04] border border-emerald-500/20 text-xs font-mono resize-none focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder='["Example 1", "Example 2"]'
                />
              </div>
              <div>
                <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">✗</span>
                  Bad Examples (JSON array)
                </p>
                <textarea
                  value={editForm.badExamples}
                  onChange={(e) => setEditForm({ ...editForm, badExamples: e.target.value })}
                  className="w-full min-h-[150px] p-4 rounded-lg bg-white/[0.04] border border-red-500/20 text-xs font-mono resize-none focus:outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/20 transition-all text-foreground placeholder:text-muted-foreground"
                  placeholder='["Bad example 1", "Bad example 2"]'
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">✓</span>
                  Good Examples
                </p>
                <div className="space-y-2.5">
                  {goodExamples.length > 0 ? (
                    goodExamples.slice(0, 3).map((ex, i) => (
                      <div key={i} className="p-4 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
                        <p className="text-sm text-zinc-200 leading-relaxed">&ldquo;{ex}&rdquo;</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No good examples yet</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-red-400 mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">✗</span>
                  Bad Examples
                </p>
                <div className="space-y-2.5">
                  {badExamples.length > 0 ? (
                    badExamples.slice(0, 3).map((ex, i) => (
                      <div key={i} className="p-4 rounded-lg bg-red-500/[0.08] border border-red-500/20">
                        <p className="text-sm text-zinc-200 leading-relaxed">&ldquo;{ex}&rdquo;</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No bad examples yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4 group hover:border-white/[0.12] transition-all">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className="text-sm font-semibold mt-2 truncate text-foreground">{value}</p>
    </div>
  );
}

// Writing Guide Section with editing
function WritingGuide({ writingRules }: { writingRules: WritingRules }) {
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllPhrases, setShowAllPhrases] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newTip, setNewTip] = useState({ tip: "", good: "", bad: "" });
  const [isPending, startTransition] = useTransition();

  const bannedWords = (writingRules.bannedWords as string[]) || [];
  const bannedPhrases = (writingRules.bannedPhrases as string[]) || [];
  const writingTips = (writingRules.writingTips as { tip: string; good: string; bad: string }[]) || [];

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    startTransition(async () => {
      await addBannedWord(newWord);
      setNewWord("");
    });
  };

  const handleRemoveWord = (word: string) => {
    startTransition(async () => {
      await removeBannedWord(word);
    });
  };

  const handleAddPhrase = () => {
    if (!newPhrase.trim()) return;
    startTransition(async () => {
      await addBannedPhrase(newPhrase);
      setNewPhrase("");
    });
  };

  const handleRemovePhrase = (phrase: string) => {
    startTransition(async () => {
      await removeBannedPhrase(phrase);
    });
  };

  const handleAddTip = () => {
    if (!newTip.tip.trim()) return;
    startTransition(async () => {
      await addWritingTip(newTip);
      setNewTip({ tip: "", good: "", bad: "" });
    });
  };

  const handleRemoveTip = (index: number) => {
    startTransition(async () => {
      await removeWritingTip(index);
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Intro */}
      <div className="rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-6 border border-primary/30 shadow-[0_0_30px_-8px_rgba(139,92,246,0.3)]">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">✍️</span>
          Write Like a Human, Not an AI
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI-generated text has tells that readers (and detection tools) can spot instantly.
          Edit the rules below to continuously refine your writing style.
        </p>
      </div>

      {/* Banned Words */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">⚠</span>
          Words to Avoid
          <span className="text-xs text-muted-foreground ml-2 font-normal">({bannedWords.length} words)</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          These words are massively overused by AI and trigger both human suspicion and detection tools.
        </p>

        {/* Add new word */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Add new banned word..."
            className="flex-1 px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
          />
          <button
            onClick={handleAddWord}
            disabled={isPending || !newWord.trim()}
            className="px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-red-500 to-red-600 text-white rounded-lg shadow-[0_0_12px_-2px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_-2px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(showAllWords ? bannedWords : bannedWords.slice(0, 20)).map((word) => (
            <span
              key={word}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 text-xs font-medium flex items-center gap-1.5 group border border-red-500/20 hover:border-red-500/40 transition-all"
            >
              {word}
              <button
                onClick={() => handleRemoveWord(word)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-200 transition-opacity ml-0.5"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {bannedWords.length > 20 && (
          <button
            onClick={() => setShowAllWords(!showAllWords)}
            className="mt-4 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {showAllWords ? "Show less" : `Show all ${bannedWords.length} words`}
          </button>
        )}
      </div>

      {/* Banned Phrases */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">⚠</span>
          Phrases to Avoid
          <span className="text-xs text-muted-foreground ml-2 font-normal">({bannedPhrases.length} phrases)</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          These phrases scream &ldquo;AI wrote this&rdquo; and should be removed from any draft.
        </p>

        {/* Add new phrase */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Add new banned phrase..."
            className="flex-1 px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && handleAddPhrase()}
          />
          <button
            onClick={handleAddPhrase}
            disabled={isPending || !newPhrase.trim()}
            className="px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-amber-500 to-amber-600 text-white rounded-lg shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)] hover:shadow-[0_0_20px_-2px_rgba(245,158,11,0.5)] transition-all disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(showAllPhrases ? bannedPhrases : bannedPhrases.slice(0, 15)).map((phrase) => (
            <span
              key={phrase}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-medium flex items-center gap-1.5 group border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              &ldquo;{phrase}&rdquo;
              <button
                onClick={() => handleRemovePhrase(phrase)}
                className="opacity-0 group-hover:opacity-100 hover:text-amber-200 transition-opacity ml-0.5"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {bannedPhrases.length > 15 && (
          <button
            onClick={() => setShowAllPhrases(!showAllPhrases)}
            className="mt-4 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {showAllPhrases ? "Show less" : `Show all ${bannedPhrases.length} phrases`}
          </button>
        )}
      </div>

      {/* Human Writing Tips */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">✓</span>
          How to Sound Human
          <span className="text-xs text-muted-foreground ml-2 font-normal">({writingTips.length} tips)</span>
        </h3>

        {/* Add new tip */}
        <div className="mb-6 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <p className="text-xs font-semibold text-foreground mb-3">Add new writing tip</p>
          <input
            type="text"
            value={newTip.tip}
            onChange={(e) => setNewTip({ ...newTip, tip: e.target.value })}
            placeholder="Tip (e.g., 'Use contractions')"
            className="w-full px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newTip.good}
              onChange={(e) => setNewTip({ ...newTip, good: e.target.value })}
              placeholder="Good example (e.g., 'it's, don't')"
              className="px-4 py-2.5 text-sm bg-white/[0.04] border border-emerald-500/20 rounded-lg focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="text"
              value={newTip.bad}
              onChange={(e) => setNewTip({ ...newTip, bad: e.target.value })}
              placeholder="Bad example (e.g., 'it is, do not')"
              className="px-4 py-2.5 text-sm bg-white/[0.04] border border-red-500/20 rounded-lg focus:outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleAddTip}
            disabled={isPending || !newTip.tip.trim()}
            className="px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_-2px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50"
          >
            Add Tip
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {writingTips.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group hover:border-white/[0.12] transition-all">
              <button
                onClick={() => handleRemoveTip(i)}
                className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-white/[0.04] text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
                title="Remove tip"
              >
                ×
              </button>
              <p className="text-sm font-semibold text-foreground mb-3 pr-6">{item.tip}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-1.5 text-emerald-400">
                  <span className="shrink-0 mt-0.5">✓</span>
                  <span className="text-zinc-300">{item.good}</span>
                </div>
                <div className="flex items-start gap-1.5 text-red-400">
                  <span className="shrink-0 mt-0.5">✗</span>
                  <span className="text-zinc-300">{item.bad}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// AI Checker Section
function AIChecker({ writingRules }: { writingRules: WritingRules }) {
  const [text, setText] = useState("");

  // Convert writingRules to the format expected by checkDraftQuality
  const rulesForCheck = {
    bannedWords: (writingRules.bannedWords as string[]) || [],
    bannedPhrases: (writingRules.bannedPhrases as string[]) || [],
    writingTips: (writingRules.writingTips as { tip: string; good: string; bad: string }[]) || [],
  };

  const quality = text.length > 10 ? checkDraftQuality(text, rulesForCheck) : null;

  return (
    <div className="max-w-3xl">
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">🔍</span>
          AI Detection Checker
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Paste any text to check for common AI writing patterns. Higher scores mean more human-like.
          This uses your custom banned words and phrases from the Writing tab.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your reply draft here to check for AI patterns..."
          className="w-full min-h-[200px] p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
        />

        {quality && (
          <div className="mt-5 space-y-4">
            {/* Score */}
            <div className={`flex items-center justify-between p-5 rounded-xl border ${
              quality.score >= 70
                ? "bg-gradient-to-r from-emerald-500/[0.1] to-emerald-500/[0.05] border-emerald-500/20"
                : quality.score >= 40
                ? "bg-gradient-to-r from-amber-500/[0.1] to-amber-500/[0.05] border-amber-500/20"
                : "bg-gradient-to-r from-red-500/[0.1] to-red-500/[0.05] border-red-500/20"
            }`}>
              <div>
                <p className="text-sm font-semibold text-foreground">Humanness Score</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quality.score >= 70
                    ? "This sounds human and natural!"
                    : quality.score >= 40
                    ? "Some AI patterns detected"
                    : "Strong AI signals - needs editing"}
                </p>
              </div>
              <div className={`text-4xl font-bold ${
                quality.score >= 70 ? "text-emerald-400" :
                quality.score >= 40 ? "text-amber-400" : "text-red-400"
              }`}>
                {quality.score}%
              </div>
            </div>

            {/* Issues */}
            {quality.issues.length > 0 && (
              <div className="p-5 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs">!</span>
                  Issues Found ({quality.issues.length})
                </p>
                <ul className="space-y-2">
                  {quality.issues.map((issue, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                      <span className="text-red-400 mt-0.5 shrink-0">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {quality.suggestions.length > 0 && (
              <div className="p-5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
                <p className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">→</span>
                  Suggestions
                </p>
                <ul className="space-y-2">
                  {quality.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2.5">
                      <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quality.issues.length === 0 && quality.suggestions.length === 0 && (
              <div className="p-5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center">
                <p className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">✓</span>
                  No AI patterns detected! This text sounds natural.
                </p>
              </div>
            )}
          </div>
        )}

        {!quality && text.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Keep typing... (minimum 10 characters)
          </p>
        )}
      </div>
    </div>
  );
}

// Template Library Section
function TemplateLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("question");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const templates = {
    question: {
      label: "Answering Questions",
      icon: "❓",
      templates: [
        {
          id: "q1",
          name: "Direct Answer",
          template: "Short answer: [answer].\n\nLonger version: [explanation with specific example or numbers]",
          example: "Short answer: yes, but with caveats.\n\nLonger version: I've tested this over 6 months and the results were mixed. Works great for [X] but struggled with [Y] because [reason].",
        },
        {
          id: "q2",
          name: "Experience-Based",
          template: "I've [done related thing]. Here's what I learned: [insight].\n\n[Optional: specific numbers or timeline]",
          example: "I've been doing algo trading for 3 years. Here's what I learned: backtests lie. Always.\n\nMy Sharpe went from 2.1 in backtest to 0.4 live. Slippage killed us.",
        },
        {
          id: "q3",
          name: "It Depends",
          template: "Depends on [key factor].\n\nIf [scenario A]: [recommendation]\nIf [scenario B]: [different recommendation]",
          example: "Depends on your timeframe.\n\nIf you're doing HFT: yeah, you need co-location.\nIf it's daily bars: a raspberry pi would handle it fine.",
        },
      ],
    },
    pain: {
      label: "Pain Points",
      icon: "😤",
      templates: [
        {
          id: "p1",
          name: "Empathy + Solution",
          template: "Been there. [brief empathy]\n\n[What actually helped/worked]",
          example: "Been there. That overfitting spiral is brutal.\n\nWhat helped me: stopped optimizing for backtest Sharpe and focused on out-of-sample stability instead.",
        },
        {
          id: "p2",
          name: "Shared Failure",
          template: "I [made similar mistake]. Cost me [specific consequence].\n\n[What I do differently now]",
          example: "I blew up an account the same way. Cost me 40% in a week.\n\nNow I cap position sizes at 2% max, no matter how good the signal looks.",
        },
      ],
    },
    discussion: {
      label: "Discussions",
      icon: "💬",
      templates: [
        {
          id: "d1",
          name: "Add Perspective",
          template: "Interesting take. I'd add: [your angle]\n\n[Supporting evidence or example]",
          example: "Interesting take. I'd add: the execution side matters more than most people think.\n\nYou can have the best signal and still lose money to slippage and fees.",
        },
        {
          id: "d2",
          name: "Respectful Disagreement",
          template: "I see it differently. [Your view].\n\nReason: [specific evidence]\n\n[Acknowledge their point has merit]",
          example: "I see it differently. Most retail algos fail not because of signal quality, but execution.\n\nReason: I've analyzed 50+ retail strategies - signal alpha was fine, but they all bled out to costs.\n\nThat said, your point about data quality is valid too.",
        },
      ],
    },
    product: {
      label: "Product Mentions",
      icon: "🚀",
      templates: [
        {
          id: "pr1",
          name: "Soft Mention",
          template: "[Answer the actual question first]\n\nWe're building something for this at [company] (I work there), but honestly [alternative that might work for them]",
          example: "For HFT you need co-location, period.\n\nWe're building something for this at Cod3x (I work there), but honestly for daily timeframes you might be fine with a VPS and basic Python.",
        },
        {
          id: "pr2",
          name: "Disclosure First",
          template: "Full disclosure: I work at [company].\n\n[Genuine, helpful answer that doesn't push product]",
          example: "Full disclosure: I work at Cod3x.\n\nThat said, for your use case you probably don't need a platform at all. A simple cron job hitting your broker's API would work.",
        },
      ],
    },
  };

  const currentCategory = templates[selectedCategory as keyof typeof templates];

  function copyTemplate(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Category selector */}
      <div className="lg:col-span-1">
        <h3 className="text-sm font-medium mb-3 text-foreground">Categories</h3>
        <div className="space-y-2">
          {Object.entries(templates).map(([key, cat]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-gradient-to-r from-primary/15 to-primary/5 border-primary/40 shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]"
                    : "glass-interactive border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>{cat.label}</span>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates */}
      <div className="lg:col-span-3 space-y-4">
        <h3 className="font-semibold text-foreground">{currentCategory.icon} {currentCategory.label} Templates</h3>
        {currentCategory.templates.map((t) => (
          <div key={t.id} className="glass rounded-xl p-5 hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">{t.name}</h4>
              <button
                onClick={() => copyTemplate(t.id, t.template)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  copiedId === t.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]"
                }`}
              >
                {copiedId === t.id ? "✓ Copied!" : "Copy"}
              </button>
            </div>

            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
              <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {t.template}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Example:</p>
              <div className="p-4 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{t.example}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPlatformStyle(platform: string) {
  const styles: Record<string, string> = {
    X: "bg-gradient-to-br from-zinc-600 to-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
    LINKEDIN: "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]",
    REDDIT: "bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-[0_2px_8px_rgba(234,88,12,0.3)]",
    HN: "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_2px_8px_rgba(251,146,60,0.3)]",
  };
  return styles[platform] || "bg-gradient-to-br from-zinc-600 to-zinc-700 text-white";
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

function getDefaultMaxLength(platform: string): number {
  switch (platform) {
    case "X": return 280;
    case "LINKEDIN": return 1300;
    case "REDDIT": return 10000;
    case "HN": return 10000;
    default: return 500;
  }
}

function getDefaultTone(platform: string): string {
  switch (platform) {
    case "X": return "casual, punchy, direct";
    case "LINKEDIN": return "professional but warm, personal stories welcome";
    case "REDDIT": return "authentic, detailed, zero marketing speak";
    case "HN": return "technical, intellectually honest, cite specifics";
    default: return "helpful and authentic";
  }
}

function getPlatformUrl(platform: string): string {
  switch (platform) {
    case "X": return "https://x.com";
    case "LINKEDIN": return "https://linkedin.com";
    case "REDDIT": return "https://reddit.com";
    case "HN": return "https://news.ycombinator.com";
    default: return "";
  }
}
