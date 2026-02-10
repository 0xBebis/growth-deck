/**
 * Shared time formatting utilities.
 * Consolidates duplicate getTimeAgo functions from queue-card.tsx, compact-post-card.tsx, etc.
 */

export interface TimeFormatOptions {
  /** Use short format (1h vs 1 hour) */
  short?: boolean;
  /** Include "ago" suffix in long format */
  includeSuffix?: boolean;
}

/**
 * Formats a date as a relative time string (e.g., "2h", "3d", "1w").
 * Uses short format by default for compact display.
 *
 * @param date - Date to format (Date object or ISO string)
 * @param options - Formatting options
 * @returns Relative time string
 *
 * @example
 * ```typescript
 * getTimeAgo(new Date(Date.now() - 3600000)); // "1h"
 * getTimeAgo(post.createdAt); // "3d"
 * getTimeAgo(date, { short: false }); // "3 days ago"
 * ```
 */
export function getTimeAgo(date: Date | string, options?: TimeFormatOptions): string {
  const { short = true, includeSuffix = true } = options || {};

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);

  if (seconds < 0) {
    return short ? "now" : "just now";
  }

  if (seconds < 60) {
    return short ? "now" : "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    if (short) return `${minutes}m`;
    const unit = minutes === 1 ? "minute" : "minutes";
    return includeSuffix ? `${minutes} ${unit} ago` : `${minutes} ${unit}`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (short) return `${hours}h`;
    const unit = hours === 1 ? "hour" : "hours";
    return includeSuffix ? `${hours} ${unit} ago` : `${hours} ${unit}`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    if (short) return `${days}d`;
    const unit = days === 1 ? "day" : "days";
    return includeSuffix ? `${days} ${unit} ago` : `${days} ${unit}`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    if (short) return `${weeks}w`;
    const unit = weeks === 1 ? "week" : "weeks";
    return includeSuffix ? `${weeks} ${unit} ago` : `${weeks} ${unit}`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    if (short) return `${months}mo`;
    const unit = months === 1 ? "month" : "months";
    return includeSuffix ? `${months} ${unit} ago` : `${months} ${unit}`;
  }

  const years = Math.floor(days / 365);
  if (short) return `${years}y`;
  const unit = years === 1 ? "year" : "years";
  return includeSuffix ? `${years} ${unit} ago` : `${years} ${unit}`;
}

/**
 * Formats a date for display in a UI (e.g., "Jan 15, 2024").
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date and time for display (e.g., "Jan 15, 2024 at 3:45 PM").
 *
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Checks if a date is within a given number of hours from now.
 *
 * @param date - Date to check
 * @param hours - Number of hours threshold
 * @returns true if date is within the threshold
 */
export function isWithinHours(date: Date | string, hours: number): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const threshold = Date.now() - hours * 60 * 60 * 1000;
  return dateObj.getTime() > threshold;
}

/**
 * Checks if a date is within a given number of days from now.
 *
 * @param date - Date to check
 * @param days - Number of days threshold
 * @returns true if date is within the threshold
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  return isWithinHours(date, days * 24);
}
