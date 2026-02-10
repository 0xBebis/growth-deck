/**
 * Shared platform utilities for consistent styling and display across components.
 * Consolidates duplicate getPlatformStyle, getPlatformIcon functions from queue-card.tsx,
 * analytics-container.tsx, settings-container.tsx, playbook-container.tsx, etc.
 */

import type { Platform } from "@prisma/client";

export interface PlatformConfig {
  id: Platform;
  label: string;
  icon: string;
  style: string;
  gradient: string;
  accentColor: string;
  characterLimit: number;
}

/**
 * Comprehensive platform configuration.
 * Single source of truth for all platform-specific display properties.
 */
export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  X: {
    id: "X",
    label: "X (Twitter)",
    icon: "\u{1D54F}", // Mathematical double-struck X
    style: "bg-zinc-700 text-white",
    gradient: "from-zinc-700 to-zinc-800",
    accentColor: "#000000",
    characterLimit: 280,
  },
  LINKEDIN: {
    id: "LINKEDIN",
    label: "LinkedIn",
    icon: "in",
    style: "bg-blue-600 text-white",
    gradient: "from-blue-600 to-blue-700",
    accentColor: "#0A66C2",
    characterLimit: 3000,
  },
  REDDIT: {
    id: "REDDIT",
    label: "Reddit",
    icon: "r/",
    style: "bg-orange-600 text-white",
    gradient: "from-orange-500 to-orange-600",
    accentColor: "#FF4500",
    characterLimit: 10000,
  },
  HN: {
    id: "HN",
    label: "Hacker News",
    icon: "Y",
    style: "bg-orange-500 text-white",
    gradient: "from-orange-400 to-orange-500",
    accentColor: "#FF6600",
    characterLimit: 2000,
  },
};

/**
 * Gets the Tailwind CSS classes for a platform badge/tag.
 *
 * @param platform - Platform identifier
 * @returns Tailwind class string for background and text color
 *
 * @example
 * ```tsx
 * <span className={getPlatformStyle(post.platform)}>
 *   {getPlatformIcon(post.platform)}
 * </span>
 * ```
 */
export function getPlatformStyle(platform: string): string {
  const config = PLATFORM_CONFIG[platform as Platform];
  return config?.style ?? "bg-zinc-600 text-white";
}

/**
 * Gets the icon/symbol for a platform.
 *
 * @param platform - Platform identifier
 * @returns Single character or short string icon
 */
export function getPlatformIcon(platform: string): string {
  const config = PLATFORM_CONFIG[platform as Platform];
  return config?.icon ?? "?";
}

/**
 * Gets the human-readable label for a platform.
 *
 * @param platform - Platform identifier
 * @returns Full platform name
 */
export function getPlatformLabel(platform: string): string {
  const config = PLATFORM_CONFIG[platform as Platform];
  return config?.label ?? platform;
}

/**
 * Gets the gradient classes for a platform card background.
 *
 * @param platform - Platform identifier
 * @returns Tailwind gradient class string
 */
export function getPlatformGradient(platform: string): string {
  const config = PLATFORM_CONFIG[platform as Platform];
  return config?.gradient ?? "from-zinc-600 to-zinc-700";
}

/**
 * Gets the character limit for a platform.
 *
 * @param platform - Platform identifier
 * @returns Maximum character count for posts
 */
export function getPlatformCharacterLimit(platform: string): number {
  const config = PLATFORM_CONFIG[platform as Platform];
  return config?.characterLimit ?? 1000;
}

/**
 * Gets the hex accent color for a platform.
 * Useful for charts and custom styling.
 *
 * @param platform - Platform identifier
 * @returns Hex color code
 */
export function getPlatformAccentColor(platform: string): string {
  const config = PLATFORM_CONFIG[platform as Platform];
  return config?.accentColor ?? "#666666";
}

/**
 * All platform IDs as an array.
 * Useful for iterating over all platforms.
 */
export const ALL_PLATFORMS: Platform[] = ["X", "LINKEDIN", "REDDIT", "HN"];
