/**
 * Shared types for playbook components.
 */

export interface PlaybookEntry {
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

export interface WritingRules {
  id: string;
  bannedWords: unknown;
  bannedPhrases: unknown;
  writingTips: unknown;
}

export interface WritingTip {
  tip: string;
  good: string;
  bad: string;
}
