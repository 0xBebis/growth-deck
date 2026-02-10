/**
 * Breadcrumbs navigation component.
 * Provides hierarchical navigation context for users.
 */

"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** URL to navigate to (omit for current page) */
  href?: string;
  /** Optional icon to display */
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon as first item */
  showHome?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Separator between items */
  separator?: ReactNode;
}

/**
 * Displays a breadcrumb navigation trail.
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: "Settings", href: "/settings" },
 *     { label: "Team", href: "/settings/team" },
 *     { label: "Invite Member" }
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  showHome = true,
  className,
  separator,
}: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/discover", icon: <Home className="h-4 w-4" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm" role="list">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.label} className="flex items-center gap-1">
              {!isFirst && (
                <span className="text-zinc-600" aria-hidden="true">
                  {separator || <ChevronRight className="h-4 w-4" />}
                </span>
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5",
                    "text-zinc-400 hover:text-zinc-200",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
                  )}
                >
                  {item.icon && (
                    <span className="shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className={isFirst && item.icon ? "sr-only" : undefined}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    isLast ? "text-zinc-200 font-medium" : "text-zinc-400"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && (
                    <span className="shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className={isFirst && item.icon ? "sr-only" : undefined}>
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Simple page header with breadcrumbs.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("space-y-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-2" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-zinc-400 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
