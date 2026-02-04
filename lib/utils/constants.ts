export const CURATED_MODELS = [
  {
    id: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    inputCost: 0.5,
    outputCost: 2.8,
    contextLength: 262144,
    tag: "Recommended",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    inputCost: 0.1,
    outputCost: 0.4,
    contextLength: 1048576,
    tag: "Budget option",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    inputCost: 2.5,
    outputCost: 10.0,
    contextLength: 128000,
    tag: null,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    inputCost: 3.0,
    outputCost: 15.0,
    contextLength: 200000,
    tag: null,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek V3",
    inputCost: 0.14,
    outputCost: 0.28,
    contextLength: 128000,
    tag: "Cheapest",
  },
  {
    id: "moonshotai/kimi-k2.5:thinking",
    name: "Kimi K2.5 Thinking",
    inputCost: 0.5,
    outputCost: 2.8,
    contextLength: 262144,
    tag: "Slow, highest reasoning",
  },
] as const;

export const PLATFORM_LABELS: Record<string, string> = {
  X: "X (Twitter)",
  LINKEDIN: "LinkedIn",
  REDDIT: "Reddit",
  HN: "Hacker News",
};

// Legacy color-only exports (for backwards compatibility)
export const INTENT_COLORS: Record<string, string> = {
  QUESTION: "bg-blue-500/20 text-blue-400",
  COMPLAINT: "bg-red-500/20 text-red-400",
  DISCUSSION: "bg-purple-500/20 text-purple-400",
  SHOWCASE: "bg-green-500/20 text-green-400",
};

export const AUDIENCE_COLORS: Record<string, string> = {
  TRADER: "bg-amber-500/20 text-amber-400",
  RESEARCHER: "bg-indigo-500/20 text-indigo-400",
  HYBRID: "bg-teal-500/20 text-teal-400",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-500/20 text-amber-400",
  SCHEDULED: "bg-blue-500/20 text-blue-400",
  SENT: "bg-green-500/20 text-green-400",
  FAILED: "bg-red-500/20 text-red-400",
  NEW: "bg-zinc-500/20 text-zinc-400",
  QUEUED: "bg-indigo-500/20 text-indigo-400",
  REPLIED: "bg-green-500/20 text-green-400",
  DISMISSED: "bg-zinc-500/20 text-zinc-400",
};

// ─── Accessible Badge Configs (with icons for colorblind users) ─────────────

export const INTENT_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  QUESTION: { color: "bg-blue-500/20 text-blue-400", icon: "?", label: "Question" },
  COMPLAINT: { color: "bg-red-500/20 text-red-400", icon: "!", label: "Complaint" },
  DISCUSSION: { color: "bg-purple-500/20 text-purple-400", icon: "...", label: "Discussion" },
  SHOWCASE: { color: "bg-green-500/20 text-green-400", icon: "*", label: "Showcase" },
};

export const AUDIENCE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  TRADER: { color: "bg-amber-500/20 text-amber-400", icon: "📈", label: "Trader" },
  RESEARCHER: { color: "bg-indigo-500/20 text-indigo-400", icon: "🔬", label: "Researcher" },
  HYBRID: { color: "bg-teal-500/20 text-teal-400", icon: "⚡", label: "Hybrid" },
};

export const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  DRAFT: { color: "bg-amber-500/20 text-amber-400", icon: "✎", label: "Draft" },
  SCHEDULED: { color: "bg-blue-500/20 text-blue-400", icon: "⏰", label: "Scheduled" },
  SENT: { color: "bg-green-500/20 text-green-400", icon: "✓", label: "Sent" },
  FAILED: { color: "bg-red-500/20 text-red-400", icon: "✗", label: "Failed" },
  NEW: { color: "bg-zinc-500/20 text-zinc-400", icon: "●", label: "New" },
  QUEUED: { color: "bg-indigo-500/20 text-indigo-400", icon: "⏳", label: "Queued" },
  REPLIED: { color: "bg-green-500/20 text-green-400", icon: "↩", label: "Replied" },
  DISMISSED: { color: "bg-zinc-500/20 text-zinc-400", icon: "—", label: "Dismissed" },
};

export const PLATFORM_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  X: { bg: "bg-zinc-800", text: "text-white", accent: "#000000" },
  LINKEDIN: { bg: "bg-blue-600", text: "text-white", accent: "#0A66C2" },
  REDDIT: { bg: "bg-orange-600", text: "text-white", accent: "#FF4500" },
  HN: { bg: "bg-orange-500", text: "text-white", accent: "#FF6600" },
};
