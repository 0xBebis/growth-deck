"use client";

import { useState } from "react";
import { checkDraftQuality } from "@/lib/drafting/prompts";
import type { WritingRules, WritingTip } from "../shared/types";

interface AICheckerProps {
  writingRules: WritingRules;
}

export function AIChecker({ writingRules }: AICheckerProps) {
  const [text, setText] = useState("");

  const rulesForCheck = {
    bannedWords: (writingRules.bannedWords as string[]) || [],
    bannedPhrases: (writingRules.bannedPhrases as string[]) || [],
    writingTips: (writingRules.writingTips as WritingTip[]) || [],
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
