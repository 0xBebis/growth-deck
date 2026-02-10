/**
 * Shared types for settings components.
 */

export interface CompanyProfile {
  companyName: string;
  productName: string;
  productDescription: string;
  brandVoice: string;
  targetAudiences: unknown;
}

export interface LlmConfig {
  defaultModelId: string;
  classificationTemp: number;
  draftingTemp: number;
  summarizationTemp: number;
  calendarTemp: number;
  monthlyBudgetLimit: number | null;
  budgetAlertThreshold: number;
  budgetHardStop: boolean;
}

export interface PlatformAccount {
  id: string;
  platform: string;
  accountType: string;
  displayName: string;
  accountHandle: string | null;
  isActive: boolean;
  isDefault: boolean;
  user: { name: string | null } | null;
}

export interface SlackConfig {
  webhookUrl: string | null;
  alertChannelName: string;
  metricsChannelName: string;
  highPriorityThreshold: number;
  enableHighPriorityAlerts: boolean;
  enableDailySummary: boolean;
  enableWeeklyRecap: boolean;
  enableQueueAlerts: boolean;
  enableCalendarReminders: boolean;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export interface DismissedPost {
  id: string;
  platform: string;
  content: string;
  authorHandle: string | null;
  authorName: string | null;
  externalUrl: string;
  updatedAt: string;
}

export type ShowToast = (type: "success" | "error", message: string) => void;
