/**
 * Humanlike voice system for AI-generated replies
 * Now pulls from database for editable rules
 */

// Types for database-driven content
export interface PlaybookEntry {
  platform: string;
  styleGuide: string;
  dos: string;
  donts: string;
  maxLength: number;
  tone: string;
  goodExamples: string[];
  badExamples: string[];
}

export interface WritingRules {
  bannedWords: string[];
  bannedPhrases: string[];
  writingTips: { tip: string; good: string; bad: string }[];
}

// Default banned words (used if no database rules exist)
export const DEFAULT_BANNED_WORDS = [
  "delve", "delving", "delved",
  "landscape", "broader landscape",
  "realm", "in the realm of",
  "crucial", "vital", "pivotal", "paramount",
  "robust", "comprehensive", "intricate",
  "leverage", "leveraging", "leveraged",
  "utilize", "utilizing", "utilization",
  "facilitate", "facilitating",
  "moreover", "furthermore", "additionally", "thus",
  "whilst", "amidst", "amongst",
  "myriad", "plethora", "multifaceted",
  "embark", "embarking", "endeavor", "endeavors",
  "foster", "fostering",
  "streamline", "streamlining",
  "optimize", "optimizing",
  "elevate", "elevating",
  "spearhead", "spearheading",
  "bolster", "bolstering",
  "underscores", "underscoring",
  "navigating", "navigate the",
  "harness", "harnessing",
  "tapestry", "rich tapestry",
  "synergy", "synergies",
  "paradigm", "paradigm shift",
  "holistic", "holistically",
  "nuanced", "nuances",
  "meticulous", "meticulously",
  "seamless", "seamlessly",
  "invaluable",
  "indispensable",
  "groundbreaking",
  "cutting-edge",
  "game-changer", "game-changing",
];

// Default banned phrases (used if no database rules exist)
export const DEFAULT_BANNED_PHRASES = [
  "in today's fast-paced",
  "in today's digital age",
  "in today's world",
  "in the ever-evolving",
  "it's important to note that",
  "it's worth noting that",
  "it is essential to",
  "plays a significant role",
  "plays a crucial role",
  "it's not just about",
  "at the end of the day",
  "when it comes to",
  "in terms of",
  "the fact that",
  "needless to say",
  "as we all know",
  "without a doubt",
  "rest assured",
  "dive deep into",
  "deep dive",
  "unpack this",
  "let's unpack",
  "a testament to",
  "serves as a",
  "poised to",
  "are you looking to",
  "whether you're a",
  "look no further",
  "I'd be happy to",
  "I'm here to help",
  "great question",
  "that's a great question",
  "absolutely",
  "definitely",
  "certainly",
];

// Default writing tips
export const DEFAULT_WRITING_TIPS = [
  { tip: "Use contractions", good: "it's, don't, won't", bad: "it is, do not, will not" },
  { tip: "Vary sentence length", good: "Short. Then longer when needed.", bad: "All sentences similar length." },
  { tip: "Start with And/But/So", good: "And that's the key.", bad: "Additionally, that is key." },
  { tip: "Be specific", good: "Lost 40% in a week", bad: "Experienced significant losses" },
  { tip: "Admit uncertainty", good: "I think, not sure but", bad: "It is clear that" },
  { tip: "Have opinions", good: "Hot take: this is wrong", bad: "One perspective suggests" },
  { tip: "Ask questions", good: "What's your experience?", bad: "Readers may wonder about..." },
  { tip: "Use imperfection", good: "yeah, ok, tbh", bad: "Indeed, certainly" },
];

// Audience-specific adjustments
const AUDIENCE_VOICE = {
  TRADER: {
    jargon: "okay to use trading jargon (Sharpe, drawdown, alpha, slippage)",
    focus: "practical results, risk management, execution",
    pain: "losses, variance, overfitting, broker issues",
  },
  RESEARCHER: {
    jargon: "academic terminology fine (methodology, statistical significance, p-values)",
    focus: "rigor, reproducibility, novel approaches",
    pain: "data quality, compute costs, publishing pressure",
  },
  HYBRID: {
    jargon: "mix of practical and academic",
    focus: "bridging theory and practice",
    pain: "making research work in production",
  },
};

/**
 * Build the draft prompt using database-driven content
 */
export function buildDraftPrompt(
  brandVoice: string,
  productDescription: string,
  platform: string,
  audienceType: string,
  playbookEntry?: PlaybookEntry | null,
  writingRules?: WritingRules | null
): string {
  // Use database rules or defaults
  const bannedWords = writingRules?.bannedWords?.length
    ? writingRules.bannedWords
    : DEFAULT_BANNED_WORDS;
  const bannedPhrases = writingRules?.bannedPhrases?.length
    ? writingRules.bannedPhrases
    : DEFAULT_BANNED_PHRASES;
  const writingTips = writingRules?.writingTips?.length
    ? writingRules.writingTips
    : DEFAULT_WRITING_TIPS;

  // Use playbook entry or defaults
  const maxLength = playbookEntry?.maxLength ?? getDefaultMaxLength(platform);
  const tone = playbookEntry?.tone ?? getDefaultTone(platform);
  const styleGuide = playbookEntry?.styleGuide ?? "";
  const dos = playbookEntry?.dos ?? "";
  const donts = playbookEntry?.donts ?? "";
  const goodExamples = playbookEntry?.goodExamples ?? [];
  const badExamples = playbookEntry?.badExamples ?? [];

  const audienceConfig = AUDIENCE_VOICE[audienceType as keyof typeof AUDIENCE_VOICE] || AUDIENCE_VOICE.HYBRID;

  let prompt = `You are writing a social media reply. Your goal: sound like a real human who works in this space, not an AI assistant.

VOICE CONTEXT:
${brandVoice}

PRODUCT (only mention if directly relevant):
${productDescription}

═══════════════════════════════════════════════════════════════
CRITICAL: SOUND HUMAN, NOT AI
═══════════════════════════════════════════════════════════════

NEVER use these AI-overused words:
${bannedWords.slice(0, 25).join(", ")}

NEVER use these AI-tell phrases:
${bannedPhrases.slice(0, 15).map(p => `"${p}"`).join(", ")}

Human writing techniques:
${writingTips.map(t => `- ${t.tip}: "${t.good}" not "${t.bad}"`).join("\n")}

═══════════════════════════════════════════════════════════════
PLATFORM: ${platform}
═══════════════════════════════════════════════════════════════
Max length: ~${maxLength} chars
Tone: ${tone}`;

  if (styleGuide) {
    prompt += `\n\nStyle Guide:\n${styleGuide}`;
  }

  if (dos || donts) {
    prompt += `\n\nDo's: ${dos}\nDon'ts: ${donts}`;
  }

  if (goodExamples.length > 0) {
    prompt += `\n\nGood examples for this platform:
${goodExamples.slice(0, 3).map((ex, i) => `${i + 1}. "${ex}"`).join("\n")}`;
  }

  if (badExamples.length > 0) {
    prompt += `\n\nBAD examples (too AI-like):
${badExamples.slice(0, 3).map((ex, i) => `${i + 1}. "${ex}"`).join("\n")}`;
  }

  prompt += `

═══════════════════════════════════════════════════════════════
AUDIENCE: ${audienceType}
═══════════════════════════════════════════════════════════════
Jargon level: ${audienceConfig.jargon}
Focus on: ${audienceConfig.focus}
Their pain points: ${audienceConfig.pain}

═══════════════════════════════════════════════════════════════
REPLY STRATEGY
═══════════════════════════════════════════════════════════════
1. Lead with value - answer or help FIRST
2. Be genuinely useful or don't reply
3. Only mention product if truly relevant (and frame as "we're building X" not a pitch)
4. If the post is a question, answer it directly
5. If it's a complaint, empathize genuinely
6. If it's a discussion, add a real perspective
7. Match the energy of the original post

Write ONLY the reply. No preamble, no "Here's a reply:", just the text.`;

  return prompt;
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

// Export for use in UI (showing users what to avoid)
export const AI_WRITING_TELLS = {
  bannedWords: DEFAULT_BANNED_WORDS,
  bannedPhrases: DEFAULT_BANNED_PHRASES,
  writingTips: DEFAULT_WRITING_TIPS,
};

// Helper to check draft quality
export function checkDraftQuality(
  draft: string,
  writingRules?: WritingRules | null
): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const lowerDraft = draft.toLowerCase();

  // Use database rules or defaults
  const bannedWords = writingRules?.bannedWords?.length
    ? writingRules.bannedWords
    : DEFAULT_BANNED_WORDS;
  const bannedPhrases = writingRules?.bannedPhrases?.length
    ? writingRules.bannedPhrases
    : DEFAULT_BANNED_PHRASES;

  // Check for banned words
  for (const word of bannedWords) {
    if (lowerDraft.includes(word.toLowerCase())) {
      issues.push(`Contains AI-overused word: "${word}"`);
      score -= 10;
    }
  }

  // Check for banned phrases
  for (const phrase of bannedPhrases) {
    if (lowerDraft.includes(phrase.toLowerCase())) {
      issues.push(`Contains AI-tell phrase: "${phrase}"`);
      score -= 15;
    }
  }

  // Check for lack of contractions (too formal)
  const formalPatterns = ["it is", "do not", "will not", "that is", "you are", "we are", "they are"];
  for (const pattern of formalPatterns) {
    if (lowerDraft.includes(pattern)) {
      suggestions.push(`Consider using contraction: "${pattern}" → "${pattern.replace(" ", "'").replace("o'", "on'")}"`);
      score -= 3;
    }
  }

  // Check for excessive exclamation marks
  const exclamationCount = (draft.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    issues.push("Too many exclamation marks (sounds over-eager)");
    score -= 5 * (exclamationCount - 1);
  }

  // Check for em-dash overuse
  const emDashCount = (draft.match(/—/g) || []).length;
  if (emDashCount > 2) {
    suggestions.push("Consider reducing em-dashes (AI overuses them)");
    score -= 3;
  }

  // Check for generic opener
  if (lowerDraft.startsWith("great question") || lowerDraft.startsWith("thanks for")) {
    issues.push("Generic opener sounds like a chatbot");
    score -= 15;
  }

  // Positive signals
  if (draft.includes("?")) {
    score += 5; // Questions are engaging
  }
  if (/\d+/.test(draft)) {
    score += 5; // Specific numbers are good
  }
  if (draft.includes("I ") || draft.includes("we ")) {
    score += 3; // Personal voice
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}
