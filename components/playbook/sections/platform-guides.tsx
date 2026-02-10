"use client";

import { useState, useTransition } from "react";
import { updatePlaybookEntry } from "@/app/(dashboard)/playbook/actions";
import { PLATFORM_LABELS } from "@/lib/utils/constants";
import {
  getPlatformStyle,
  getPlatformIcon,
  getDefaultMaxLength,
  getDefaultTone,
  getPlatformUrl,
} from "../shared/helpers";
import type { PlaybookEntry } from "../shared/types";

interface PlatformGuidesProps {
  entries: PlaybookEntry[];
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}

export function PlatformGuides({
  entries,
  selectedPlatform,
  onSelectPlatform,
}: PlatformGuidesProps) {
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
