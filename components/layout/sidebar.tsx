"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/discover", label: "Discover", icon: "🔍", description: "Find engagement opportunities" },
  { href: "/queue", label: "Queue", icon: "📋", description: "Manage reply drafts" },
  { href: "/analytics", label: "Analytics", icon: "📊", description: "Track engagement and ROI" },
  { href: "/leads", label: "Leads", icon: "🎯", description: "CRM and lead scoring" },
  { href: "/radar", label: "Radar", icon: "📡", description: "Competitor intelligence" },
  { href: "/influencers", label: "Influencers", icon: "⭐", description: "Relationship tracking" },
  { href: "/autopilot", label: "Autopilot", icon: "🤖", description: "Automated engagement" },
  { href: "/playbook", label: "Playbook", icon: "📖", description: "Writing guides and templates" },
  { href: "/settings", label: "Settings", icon: "⚙️", description: "Configure your account" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-50 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1c1c22] border-2 border-border shadow-lg md:hidden hover:bg-[#232329] transition-colors"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
      >
        <svg
          className="h-5 w-5 text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-nav"
        role="navigation"
        aria-label="Main navigation"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          bg-gradient-to-b from-[#0f0f12] to-[#0a0a0c]
          border-r border-white/[0.06]
          shadow-[1px_0_0_rgba(255,255,255,0.02),4px_0_24px_rgba(0,0,0,0.4)]
          transform transition-transform duration-300 ease-out
          md:relative md:w-60 md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header with close button on mobile */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.04] px-5">
          <Link
            href="/discover"
            className="text-xl font-bold tracking-tight text-gradient"
          >
            GrowthDeck
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 md:hidden"
            aria-label="Close navigation menu"
          >
            <svg
              className="h-5 w-5 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 ease-out relative
                  ${isActive
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                aria-describedby={`nav-desc-${item.label.toLowerCase()}`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                )}
                <span className={`text-lg transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} aria-hidden="true">
                  {item.icon}
                </span>
                <span className="tracking-[-0.01em]">{item.label}</span>
                <span id={`nav-desc-${item.label.toLowerCase()}`} className="sr-only">
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile keyboard hint */}
        <div className="border-t border-border/50 p-3 md:hidden">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> to close
          </p>
        </div>
      </aside>
    </>
  );
}
