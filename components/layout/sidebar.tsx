"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
  BarChart3,
  Target,
  Radio,
  Star,
  Bot,
  BookOpen,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { href: "/discover", label: "Discover", icon: Search, description: "Find engagement opportunities", shortcut: "D" },
  { href: "/queue", label: "Queue", icon: ClipboardList, description: "Manage reply drafts", shortcut: "Q" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Track engagement and ROI", shortcut: "A" },
  { href: "/leads", label: "Leads", icon: Target, description: "CRM and lead scoring", shortcut: "L" },
  { href: "/radar", label: "Radar", icon: Radio, description: "Competitor intelligence", shortcut: "R" },
  { href: "/influencers", label: "Influencers", icon: Star, description: "Relationship tracking", shortcut: "I" },
  { href: "/autopilot", label: "Autopilot", icon: Bot, description: "Automated engagement" },
  { href: "/playbook", label: "Playbook", icon: BookOpen, description: "Writing guides and templates", shortcut: "P" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Configure your account", shortcut: "," },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard navigation shortcuts
  const handleKeyboardNav = useCallback(
    (e: KeyboardEvent) => {
      // Only handle if not in input/textarea and Cmd/Ctrl is pressed
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputFocused || !e.metaKey) return;

      const key = e.key.toUpperCase();
      const item = navItems.find(
        (nav) => nav.shortcut?.toUpperCase() === key
      );

      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    },
    [router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardNav);
    return () => document.removeEventListener("keydown", handleKeyboardNav);
  }, [handleKeyboardNav]);

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
            const Icon = item.icon;
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
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? "text-primary" : "group-hover:scale-110"}`}
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                <span className="tracking-[-0.01em] flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd
                    className="hidden md:inline-flex h-5 min-w-5 items-center justify-center rounded bg-white/[0.06] px-1.5 text-[10px] font-medium text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-400"
                    aria-hidden="true"
                  >
                    {item.shortcut}
                  </kbd>
                )}
                <span id={`nav-desc-${item.label.toLowerCase()}`} className="sr-only">
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Keyboard hints */}
        <div className="border-t border-border/50 p-3">
          <p className="text-xs text-muted-foreground text-center md:hidden">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> to close
          </p>
          <p className="hidden md:block text-[10px] text-zinc-600 text-center">
            <kbd className="px-1 py-0.5 bg-white/5 rounded">Cmd</kbd> + key to navigate
          </p>
        </div>
      </aside>
    </>
  );
}
