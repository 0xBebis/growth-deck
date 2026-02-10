/**
 * Empty state component for consistent "no data" messaging.
 * Provides clear explanations and actionable CTAs.
 */

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Icon to display (should be an SVG or emoji) */
  icon?: ReactNode;
  /** Main title explaining the empty state */
  title: string;
  /** Optional description with more context */
  description?: string;
  /** Optional call-to-action button or link */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Compact variant for smaller spaces */
  compact?: boolean;
}

/**
 * Displays a consistent empty state with icon, title, description, and optional action.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<SearchIcon className="w-12 h-12" />}
 *   title="No posts found"
 *   description="Try adjusting your filters or running a new search."
 *   action={<Button>Start Discovery</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div
          className={cn(
            "text-zinc-600",
            compact ? "mb-3" : "mb-4"
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-zinc-200",
          compact ? "text-base mb-1" : "text-lg mb-2"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-zinc-400 max-w-sm",
            compact ? "text-sm mb-4" : "text-sm mb-6"
          )}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Preset empty states for common scenarios.
 */
export const EmptyStatePresets = {
  /** No search results */
  noResults: {
    icon: (
      <svg
        className="w-12 h-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
  },

  /** No data available */
  noData: {
    icon: (
      <svg
        className="w-12 h-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    ),
    title: "No data yet",
    description: "Data will appear here once available.",
  },

  /** Error loading data */
  error: {
    icon: (
      <svg
        className="w-12 h-12 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    title: "Something went wrong",
    description: "We couldn't load the data. Please try again.",
  },

  /** Empty inbox/queue */
  emptyQueue: {
    icon: (
      <svg
        className="w-12 h-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    title: "All caught up!",
    description: "No items in your queue.",
  },
} as const;
