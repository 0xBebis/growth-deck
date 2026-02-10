/**
 * Zod validation schemas for API requests.
 * Provides type-safe validation for all API endpoints.
 */

import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const platformSchema = z.enum(["X", "LINKEDIN", "REDDIT", "HN"]);

export const replyStatusSchema = z.enum(["DRAFT", "SCHEDULED", "SENT", "FAILED"]);

export const postStatusSchema = z.enum(["NEW", "QUEUED", "REPLIED", "DISMISSED"]);

export const intentTypeSchema = z.enum(["QUESTION", "COMPLAINT", "DISCUSSION", "SHOWCASE"]);

export const audienceTypeSchema = z.enum(["TRADER", "RESEARCHER", "HYBRID"]);

// ─── Discovery Schemas ───────────────────────────────────────────────────────

export const discoveryQuerySchema = z.object({
  platform: platformSchema.optional(),
  status: postStatusSchema.optional(),
  intent: intentTypeSchema.optional(),
  audience: audienceTypeSchema.optional(),
  minRelevance: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;

export const dismissPostsSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one ID required"),
});

export type DismissPostsInput = z.infer<typeof dismissPostsSchema>;

export const dismissedQuerySchema = z.object({
  search: z.string().optional(),
  platform: platformSchema.optional(),
});

export type DismissedQuery = z.infer<typeof dismissedQuerySchema>;

export const restorePostsSchema = z.object({
  ids: z.array(z.string().cuid()).optional(),
});

export type RestorePostsInput = z.infer<typeof restorePostsSchema>;

// ─── Reply Schemas ───────────────────────────────────────────────────────────

export const replyQuerySchema = z.object({
  platform: platformSchema.optional(),
  status: replyStatusSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type ReplyQuery = z.infer<typeof replyQuerySchema>;

export const replyUpdateSchema = z.object({
  finalContent: z.string().min(1).max(10000).optional(),
  platformAccountId: z.string().cuid().optional(),
});

export type ReplyUpdateInput = z.infer<typeof replyUpdateSchema>;

export const replyCreateSchema = z.object({
  discoveredPostId: z.string().cuid(),
  draftContent: z.string().min(1).max(10000),
  draftModel: z.string().optional(),
  draftCost: z.number().optional(),
});

export type ReplyCreateInput = z.infer<typeof replyCreateSchema>;

// ─── Focus Scrape Schemas ────────────────────────────────────────────────────

export const focusScrapeSchema = z.object({
  focus: z.string().min(1, "Focus description required").max(500),
  platforms: z.array(platformSchema).min(1, "At least one platform required"),
});

export type FocusScrapeInput = z.infer<typeof focusScrapeSchema>;

// ─── Settings Schemas ────────────────────────────────────────────────────────

export const companyProfileSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  productName: z.string().min(1).max(100).optional(),
  productDescription: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  targetAudiences: z.array(z.string()).optional(),
  valuePropositions: z.array(z.string()).optional(),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

export const llmConfigSchema = z.object({
  defaultModelId: z.string().min(1),
  classifyModelId: z.string().optional(),
  draftModelId: z.string().optional(),
  classifyTemperature: z.coerce.number().min(0).max(2).optional(),
  draftTemperature: z.coerce.number().min(0).max(2).optional(),
  monthlyBudgetLimit: z.coerce.number().min(0).optional(),
  budgetHardStop: z.boolean().optional(),
  budgetHardStopExemptions: z.array(z.string()).optional(),
});

export type LlmConfigInput = z.infer<typeof llmConfigSchema>;

export const platformAccountSchema = z.object({
  platform: platformSchema,
  displayName: z.string().min(1).max(100),
  credentials: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type PlatformAccountInput = z.infer<typeof platformAccountSchema>;

export const keywordSchema = z.object({
  phrase: z.string().min(1).max(100),
  category: z.enum(["PRODUCT", "PAIN_POINT", "COMPETITOR", "RESEARCH"]),
  isActive: z.boolean().default(true),
});

export type KeywordInput = z.infer<typeof keywordSchema>;

// ─── Autopilot Schemas ───────────────────────────────────────────────────────

export const autopilotConfigSchema = z.object({
  autoDraftEnabled: z.boolean().optional(),
  autoScheduleEnabled: z.boolean().optional(),
  minRelevanceScore: z.coerce.number().min(0).max(100).optional(),
  maxDailyReplies: z.coerce.number().min(0).optional(),
  preferredHours: z.array(z.number().min(0).max(23)).optional(),
  excludedDays: z.array(z.number().min(0).max(6)).optional(),
});

export type AutopilotConfigInput = z.infer<typeof autopilotConfigSchema>;

// ─── OpenRouter Schemas ──────────────────────────────────────────────────────

export const chatCompletionSchema = z.object({
  model: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
});

export type ChatCompletionInput = z.infer<typeof chatCompletionSchema>;

// ─── Pagination Schema ───────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ─── ID Parameter Schema ─────────────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export type IdParam = z.infer<typeof idParamSchema>;
