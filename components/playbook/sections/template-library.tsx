"use client";

import { useState } from "react";

const TEMPLATES = {
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

export function TemplateLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("question");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentCategory = TEMPLATES[selectedCategory as keyof typeof TEMPLATES];

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
          {Object.entries(TEMPLATES).map(([key, cat]) => {
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
