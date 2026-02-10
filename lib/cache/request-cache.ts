/**
 * Request-level caching for frequently-accessed configuration data.
 * Uses React's cache() for deduplication within a single request.
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Get LLM configuration with request-level caching.
 * Multiple calls within the same request will only hit the database once.
 */
export const getLlmConfig = cache(async () => {
  const config = await prisma.llmConfig.findFirst();
  return config;
});

/**
 * Get company profile with request-level caching.
 */
export const getCompanyProfile = cache(async () => {
  const profile = await prisma.companyProfile.findFirst();
  return profile;
});

/**
 * Get active keywords with request-level caching.
 */
export const getActiveKeywords = cache(async () => {
  const keywords = await prisma.keyword.findMany({
    where: { isActive: true },
    select: { phrase: true, category: true },
  });
  return keywords;
});

/**
 * Get writing rules with request-level caching.
 */
export const getWritingRules = cache(async () => {
  const rules = await prisma.writingRules.findFirst();
  return rules;
});

/**
 * Get playbook entries with request-level caching.
 */
export const getPlaybookEntries = cache(async () => {
  const entries = await prisma.playbookEntry.findMany({
    orderBy: { platform: "asc" },
  });
  return entries;
});

/**
 * Get Slack configuration with request-level caching.
 */
export const getSlackConfig = cache(async () => {
  const config = await prisma.slackConfig.findFirst();
  return config;
});

/**
 * Get default platform accounts (one per platform) with request-level caching.
 */
export const getDefaultPlatformAccounts = cache(async () => {
  const accounts = await prisma.platformAccount.findMany({
    where: { isDefault: true, isActive: true },
    select: {
      id: true,
      platform: true,
      displayName: true,
      accountHandle: true,
    },
  });
  return accounts;
});
