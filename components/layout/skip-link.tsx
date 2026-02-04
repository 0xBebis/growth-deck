"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only sr-only-focusable fixed top-4 left-4 z-[100] rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
