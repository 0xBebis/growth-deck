/**
 * Utility for merging Tailwind CSS class names.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * Handles conditional classes and removes duplicate/conflicting utilities.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary", "px-6")
 * // Returns: "py-2 bg-primary px-6" (px-6 overrides px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
