"use client";

import { useState, useTransition } from "react";
import {
  addBannedWord,
  removeBannedWord,
  addBannedPhrase,
  removeBannedPhrase,
  addWritingTip,
  removeWritingTip,
} from "@/app/(dashboard)/playbook/actions";
import type { WritingRules, WritingTip } from "../shared/types";

interface WritingGuideProps {
  writingRules: WritingRules;
}

export function WritingGuide({ writingRules }: WritingGuideProps) {
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllPhrases, setShowAllPhrases] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newTip, setNewTip] = useState<WritingTip>({ tip: "", good: "", bad: "" });
  const [isPending, startTransition] = useTransition();

  const bannedWords = (writingRules.bannedWords as string[]) || [];
  const bannedPhrases = (writingRules.bannedPhrases as string[]) || [];
  const writingTips = (writingRules.writingTips as WritingTip[]) || [];

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
