"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

const VALID_PLATFORMS = ["X", "LINKEDIN", "REDDIT", "HN"] as const;
const VALID_CATEGORIES = ["PRODUCT", "PAIN_POINT", "COMPETITOR", "RESEARCH"] as const;
const VALID_ACCOUNT_TYPES = ["COMPANY", "PERSONAL"] as const;
const VALID_ROLES = ["ADMIN", "CONTRIBUTOR"] as const;

function requireString(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalString(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

function requireEnum<T extends string>(
  formData: FormData,
  field: string,
  validValues: readonly T[]
): T {
  const value = requireString(formData, field);
  if (!validValues.includes(value as T)) {
    throw new Error(`Invalid ${field}: ${value}. Must be one of: ${validValues.join(", ")}`);
  }
  return value as T;
}

function parseFloatSafe(value: string, fallback: number): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseIntSafe(value: string, fallback: number): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJsonArray(value: string): Prisma.InputJsonValue {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

// ─── Company Profile ─────────────────────────────────

export async function updateCompanyProfile(formData: FormData) {
  await requireAdmin();

  const companyName = requireString(formData, "companyName");
  const productName = requireString(formData, "productName");
  const productDescription = optionalString(formData, "productDescription") ?? "";
  const brandVoice = optionalString(formData, "brandVoice") ?? "";
  const targetAudiences = parseJsonArray(
    (formData.get("targetAudiences") as string) || "[]"
  );

  await prisma.companyProfile.updateMany({
    data: {
      companyName,
      productName,
      productDescription,
      brandVoice,
      targetAudiences,
    },
  });

  revalidatePath("/settings");
}

// ─── Keywords ────────────────────────────────────────

export async function createKeyword(formData: FormData) {
  await requireAuth();

  const phrase = requireString(formData, "phrase");
  const category = requireEnum(formData, "category", VALID_CATEGORIES);

  await prisma.keyword.create({
    data: { phrase, category },
  });

  revalidatePath("/settings");
}

export async function deleteKeyword(id: string) {
  await requireAuth();
  if (!id || typeof id !== "string") throw new Error("Invalid keyword ID");

  await prisma.keyword.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function toggleKeyword(id: string, isActive: boolean) {
  await requireAuth();
  if (!id || typeof id !== "string") throw new Error("Invalid keyword ID");
  if (typeof isActive !== "boolean") throw new Error("isActive must be boolean");

  await prisma.keyword.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/settings");
}

// ─── Platform Accounts ───────────────────────────────

export async function createPlatformAccount(formData: FormData) {
  const user = await requireAuth();

  const platform = requireEnum(formData, "platform", VALID_PLATFORMS);
  const accountType = requireEnum(formData, "accountType", VALID_ACCOUNT_TYPES);
  const displayName = requireString(formData, "displayName");
  const accountHandle = optionalString(formData, "accountHandle");

  await prisma.platformAccount.create({
    data: {
      platform,
      accountType,
      displayName,
      accountHandle,
      userId: accountType === "PERSONAL" ? user.id : null,
    },
  });

  revalidatePath("/settings");
}

export async function deletePlatformAccount(id: string) {
  await requireAuth();
  if (!id || typeof id !== "string") throw new Error("Invalid account ID");

  await prisma.platformAccount.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function togglePlatformAccountDefault(id: string) {
  await requireAuth();
  if (!id || typeof id !== "string") throw new Error("Invalid account ID");

  // Get the account to find its platform
  const account = await prisma.platformAccount.findUnique({ where: { id } });
  if (!account) throw new Error("Account not found");

  // Unset any existing default for this platform
  await prisma.platformAccount.updateMany({
    where: { platform: account.platform, isDefault: true },
    data: { isDefault: false },
  });

  // Set this account as default
  await prisma.platformAccount.update({
    where: { id },
    data: { isDefault: true },
  });

  revalidatePath("/settings");
}

// ─── LLM Config ──────────────────────────────────────

export async function updateLlmConfig(formData: FormData) {
  await requireAdmin();

  const defaultModelId = requireString(formData, "defaultModelId");
  const budgetLimitStr = optionalString(formData, "monthlyBudgetLimit");

  await prisma.llmConfig.updateMany({
    data: {
      defaultModelId,
      classificationTemp: parseFloatSafe(formData.get("classificationTemp") as string, 0.2),
      draftingTemp: parseFloatSafe(formData.get("draftingTemp") as string, 0.6),
      summarizationTemp: parseFloatSafe(formData.get("summarizationTemp") as string, 0.3),
      calendarTemp: parseFloatSafe(formData.get("calendarTemp") as string, 0.7),
      monthlyBudgetLimit: budgetLimitStr ? parseFloatSafe(budgetLimitStr, 0) || null : null,
      budgetAlertThreshold: Math.min(
        Math.max(parseFloatSafe(formData.get("budgetAlertThreshold") as string, 0.8), 0),
        1
      ),
      budgetHardStop: formData.get("budgetHardStop") === "on",
    },
  });

  revalidatePath("/settings");
}

// ─── Slack Config ────────────────────────────────────

export async function updateSlackConfig(formData: FormData) {
  await requireAdmin();

  const webhookUrl = optionalString(formData, "webhookUrl");
  // Basic URL validation for webhook
  if (webhookUrl && !webhookUrl.startsWith("https://hooks.slack.com/")) {
    throw new Error("Webhook URL must be a valid Slack webhook URL");
  }

  await prisma.slackConfig.updateMany({
    data: {
      webhookUrl,
      alertChannelName: optionalString(formData, "alertChannelName") ?? "#growth-alerts",
      metricsChannelName: optionalString(formData, "metricsChannelName") ?? "#growth-metrics",
      highPriorityThreshold: Math.min(
        Math.max(parseIntSafe(formData.get("highPriorityThreshold") as string, 80), 0),
        100
      ),
      enableHighPriorityAlerts: formData.get("enableHighPriorityAlerts") === "on",
      enableDailySummary: formData.get("enableDailySummary") === "on",
      enableWeeklyRecap: formData.get("enableWeeklyRecap") === "on",
      enableQueueAlerts: formData.get("enableQueueAlerts") === "on",
      enableCalendarReminders: formData.get("enableCalendarReminders") === "on",
    },
  });

  revalidatePath("/settings");
}

// ─── Team Management ─────────────────────────────────

export async function updateUserRole(userId: string, role: "ADMIN" | "CONTRIBUTOR") {
  const currentUser = await requireAdmin();

  if (!userId || typeof userId !== "string") throw new Error("Invalid user ID");
  if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);

  // Prevent admins from demoting themselves
  if (currentUser.id === userId && role !== "ADMIN") {
    throw new Error("Cannot demote yourself");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/settings");
}
