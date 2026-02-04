"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_LABELS } from "@/lib/utils/constants";

interface PlatformCardProps {
  entry: {
    id: string;
    platform: string;
    platformUrl: string;
    accountUrl: string | null;
    postingCadence: string;
    bestTimes: string | null;
    styleGuide: string;
    dos: string;
    donts: string;
    additionalNotes: string | null;
  };
}

export function PlatformCard({ entry }: PlatformCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl glass overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-smooth hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <PlatformIcon platform={entry.platform} className="h-8 w-8 text-sm" />
          <div>
            <h3 className="font-semibold text-foreground">
              {PLATFORM_LABELS[entry.platform] || entry.platform}
            </h3>
            <p className="text-xs text-muted-foreground">{entry.postingCadence}</p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-4 pb-4 pt-3 space-y-4 animate-slide-up-fade">
          <div className="flex gap-3">
            <a
              href={entry.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg glass border-border/50 px-3 py-1.5 text-xs hover:bg-white/5 transition-smooth"
            >
              Open Platform
            </a>
            {entry.accountUrl && (
              <a
                href={entry.accountUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg glass border-border/50 px-3 py-1.5 text-xs hover:bg-white/5 transition-smooth"
              >
                Company Account
              </a>
            )}
          </div>

          {entry.bestTimes && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Best Times
              </h4>
              <p className="mt-1 text-sm text-foreground">{entry.bestTimes}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Style Guide
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{entry.styleGuide}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase text-green-400">Do&apos;s</h4>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{entry.dos}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-red-400">Don&apos;ts</h4>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{entry.donts}</p>
            </div>
          </div>

          {entry.additionalNotes && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Notes
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{entry.additionalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
