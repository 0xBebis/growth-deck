/**
 * Keyword Constants - Single source of truth for keyword categories and suggestions
 */

import { Target, MessageSquare, Rocket, Lightbulb, TrendingUp } from "lucide-react";

// Valid keyword categories (matches Prisma enum)
export const KEYWORD_CATEGORIES = ["PRODUCT", "PAIN_POINT", "COMPETITOR", "RESEARCH"] as const;
export type KeywordCategory = (typeof KEYWORD_CATEGORIES)[number];

// Category display configuration
export const CATEGORY_CONFIG: Record<
  KeywordCategory,
  { label: string; color: string; bgColor: string; icon: typeof Target }
> = {
  PRODUCT: {
    label: "Product",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15 border-blue-500/30",
    icon: Rocket,
  },
  PAIN_POINT: {
    label: "Pain Points",
    color: "text-rose-400",
    bgColor: "bg-rose-500/15 border-rose-500/30",
    icon: MessageSquare,
  },
  COMPETITOR: {
    label: "Competitors",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15 border-amber-500/30",
    icon: Target,
  },
  RESEARCH: {
    label: "Research",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15 border-violet-500/30",
    icon: Lightbulb,
  },
};

// Smart suggestions - high-intent phrases that work across platforms
export const SMART_SUGGESTIONS: Record<KeywordCategory, string[]> = {
  PAIN_POINT: [
    "struggling with",
    "frustrated with",
    "looking for alternative",
    "hate using",
    "can't figure out",
  ],
  PRODUCT: [
    "anyone recommend",
    "best tool for",
    "what do you use for",
    "trying to find",
  ],
  COMPETITOR: [
    "vs",
    "alternative to",
    "switching from",
    "compared to",
  ],
  RESEARCH: [
    "how do you",
    "what's the best way",
    "tips for",
    "advice on",
  ],
};

// Quick-start templates for common use cases
export const SCRAPE_TEMPLATES = [
  {
    id: "frustrated-users",
    icon: MessageSquare,
    title: "Frustrated Users",
    description: "People struggling with competitors",
    category: "PAIN_POINT" as KeywordCategory,
    accentColor: "text-rose-400",
    bgColor: "bg-rose-500/10 hover:bg-rose-500/20",
    borderColor: "border-rose-500/20",
    keywords: ["struggling with", "frustrated", "looking for alternative", "anyone recommend", "hate using"],
    platforms: ["X", "REDDIT"] as const,
  },
  {
    id: "active-buyers",
    icon: TrendingUp,
    title: "Active Buyers",
    description: "High purchase intent",
    category: "PRODUCT" as KeywordCategory,
    accentColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20",
    borderColor: "border-emerald-500/20",
    keywords: ["best tool for", "comparing options", "ready to switch", "budget for", "need solution"],
    platforms: ["X", "LINKEDIN", "REDDIT"] as const,
  },
  {
    id: "industry-questions",
    icon: Lightbulb,
    title: "Questions",
    description: "Thought leadership opps",
    category: "RESEARCH" as KeywordCategory,
    accentColor: "text-violet-400",
    bgColor: "bg-violet-500/10 hover:bg-violet-500/20",
    borderColor: "border-violet-500/20",
    keywords: ["how do you", "what's the best way", "anyone know how", "tips for", "advice on"],
    platforms: ["X", "REDDIT", "HN"] as const,
  },
  {
    id: "competitor-mentions",
    icon: Target,
    title: "Competitors",
    description: "Track competitor mentions",
    category: "COMPETITOR" as KeywordCategory,
    accentColor: "text-amber-400",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20",
    borderColor: "border-amber-500/20",
    keywords: ["TradingView", "QuantConnect", "Alpaca", "MetaTrader", "vs", "alternative to"],
    platforms: ["X", "REDDIT", "LINKEDIN", "HN"] as const,
  },
] as const;
