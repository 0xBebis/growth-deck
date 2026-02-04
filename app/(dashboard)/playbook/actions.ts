"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma, Platform } from "@prisma/client";

const VALID_PLATFORMS = ["X", "LINKEDIN", "REDDIT", "HN"] as const;

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

function parseJsonArray(value: string): Prisma.InputJsonValue {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Playbook Entry Actions ─────────────────────────────

export async function updatePlaybookEntry(formData: FormData) {
  await requireAuth();

  const id = formData.get("id") as string;
  const platform = formData.get("platform") as string;

  if (!id && !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
    throw new Error("Invalid platform");
  }

  const data = {
    platformUrl: (formData.get("platformUrl") as string) || "",
    accountUrl: (formData.get("accountUrl") as string) || null,
    postingCadence: (formData.get("postingCadence") as string) || "",
    bestTimes: (formData.get("bestTimes") as string) || null,
    styleGuide: (formData.get("styleGuide") as string) || "",
    dos: (formData.get("dos") as string) || "",
    donts: (formData.get("donts") as string) || "",
    additionalNotes: (formData.get("additionalNotes") as string) || null,
    maxLength: parseInt(formData.get("maxLength") as string) || 280,
    tone: (formData.get("tone") as string) || "casual, authentic",
    goodExamples: parseJsonArray(formData.get("goodExamples") as string || "[]"),
    badExamples: parseJsonArray(formData.get("badExamples") as string || "[]"),
  };

  if (id) {
    await prisma.playbookEntry.update({
      where: { id },
      data,
    });
  } else {
    await prisma.playbookEntry.create({
      data: {
        ...data,
        platform: platform as Platform,
      },
    });
  }

  revalidatePath("/playbook");
}

export async function deletePlaybookEntry(id: string) {
  await requireAuth();
  if (!id) throw new Error("Invalid ID");

  await prisma.playbookEntry.delete({ where: { id } });
  revalidatePath("/playbook");
}

// ─── Writing Rules Actions ─────────────────────────────

export async function getOrCreateWritingRules() {
  let rules = await prisma.writingRules.findFirst();

  if (!rules) {
    // Import defaults and create the initial rules
    const { DEFAULT_BANNED_WORDS, DEFAULT_BANNED_PHRASES, DEFAULT_WRITING_TIPS } = await import("@/lib/drafting/prompts");

    rules = await prisma.writingRules.create({
      data: {
        bannedWords: DEFAULT_BANNED_WORDS,
        bannedPhrases: DEFAULT_BANNED_PHRASES,
        writingTips: DEFAULT_WRITING_TIPS,
      },
    });
  }

  return rules;
}

export async function updateWritingRules(formData: FormData) {
  await requireAuth();

  const id = formData.get("id") as string;

  const bannedWords = parseJsonArray(formData.get("bannedWords") as string || "[]");
  const bannedPhrases = parseJsonArray(formData.get("bannedPhrases") as string || "[]");
  const writingTips = parseJsonArray(formData.get("writingTips") as string || "[]");

  if (id) {
    await prisma.writingRules.update({
      where: { id },
      data: { bannedWords, bannedPhrases, writingTips },
    });
  } else {
    await prisma.writingRules.create({
      data: { bannedWords, bannedPhrases, writingTips },
    });
  }

  revalidatePath("/playbook");
}

export async function addBannedWord(word: string) {
  await requireAuth();
  if (!word?.trim()) throw new Error("Word is required");

  const rules = await getOrCreateWritingRules();
  const currentWords = (rules.bannedWords as string[]) || [];

  if (currentWords.includes(word.toLowerCase().trim())) {
    throw new Error("Word already exists");
  }

  await prisma.writingRules.update({
    where: { id: rules.id },
    data: {
      bannedWords: [...currentWords, word.toLowerCase().trim()]
    },
  });

  revalidatePath("/playbook");
}

export async function removeBannedWord(word: string) {
  await requireAuth();
  if (!word) throw new Error("Word is required");

  const rules = await getOrCreateWritingRules();
  const currentWords = (rules.bannedWords as string[]) || [];

  await prisma.writingRules.update({
    where: { id: rules.id },
    data: {
      bannedWords: currentWords.filter(w => w !== word)
    },
  });

  revalidatePath("/playbook");
}

export async function addBannedPhrase(phrase: string) {
  await requireAuth();
  if (!phrase?.trim()) throw new Error("Phrase is required");

  const rules = await getOrCreateWritingRules();
  const currentPhrases = (rules.bannedPhrases as string[]) || [];

  if (currentPhrases.includes(phrase.toLowerCase().trim())) {
    throw new Error("Phrase already exists");
  }

  await prisma.writingRules.update({
    where: { id: rules.id },
    data: {
      bannedPhrases: [...currentPhrases, phrase.toLowerCase().trim()]
    },
  });

  revalidatePath("/playbook");
}

export async function removeBannedPhrase(phrase: string) {
  await requireAuth();
  if (!phrase) throw new Error("Phrase is required");

  const rules = await getOrCreateWritingRules();
  const currentPhrases = (rules.bannedPhrases as string[]) || [];

  await prisma.writingRules.update({
    where: { id: rules.id },
    data: {
      bannedPhrases: currentPhrases.filter(p => p !== phrase)
    },
  });

  revalidatePath("/playbook");
}

export async function addWritingTip(tip: { tip: string; good: string; bad: string }) {
  await requireAuth();
  if (!tip.tip?.trim()) throw new Error("Tip is required");

  const rules = await getOrCreateWritingRules();
  const currentTips = (rules.writingTips as { tip: string; good: string; bad: string }[]) || [];

  await prisma.writingRules.update({
    where: { id: rules.id },
    data: {
      writingTips: [...currentTips, tip]
    },
  });

  revalidatePath("/playbook");
}

export async function removeWritingTip(index: number) {
  await requireAuth();

  const rules = await getOrCreateWritingRules();
  const currentTips = (rules.writingTips as { tip: string; good: string; bad: string }[]) || [];

  await prisma.writingRules.update({
    where: { id: rules.id },
    data: {
      writingTips: currentTips.filter((_, i) => i !== index)
    },
  });

  revalidatePath("/playbook");
}
