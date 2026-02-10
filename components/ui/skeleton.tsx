/**
 * Skeleton loading components for consistent loading states.
 * These components match the actual content layout for minimal layout shift.
 */

import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton element with shimmer animation.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/**
 * Text skeleton for paragraph content.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "skeleton h-4 rounded",
            i === lines - 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton for profile images.
 */
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div
      className={cn("skeleton rounded-full", sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

/**
 * Card skeleton for content cards.
 */
export function SkeletonCard({
  className,
  showAvatar = false,
}: {
  className?: string;
  showAvatar?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 p-4",
        className
      )}
      aria-hidden="true"
    >
      {showAvatar && (
        <div className="mb-3 flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
        </div>
      )}
      <SkeletonText lines={3} />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-8 w-20 rounded-lg" />
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton for data tables.
 */
export function SkeletonTableRow({
  cols = 4,
  className,
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)} aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "skeleton h-4 rounded",
            i === 0 ? "w-1/4" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Stat card skeleton for metric displays.
 */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 p-6",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-6 w-6 rounded" />
      </div>
      <div className="mt-4">
        <div className="skeleton h-8 w-24 rounded" />
      </div>
      <div className="mt-2">
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  );
}

/**
 * Page header skeleton.
 */
export function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-4 w-72 rounded" />
    </div>
  );
}

/**
 * Feed/list skeleton showing multiple cards.
 */
export function SkeletonFeed({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)} role="status" aria-label="Loading content">
      <span className="sr-only">Loading...</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showAvatar />
      ))}
    </div>
  );
}
