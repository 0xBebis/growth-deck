"use client";

import { useState } from "react";
import {
  PlatformGuides,
  WritingGuide,
  AIChecker,
  TemplateLibrary,
} from "./sections";
import type { PlaybookEntry, WritingRules } from "./shared/types";

interface PlaybookContainerProps {
  entries: PlaybookEntry[];
  writingRules: WritingRules;
}

type Tab = "platforms" | "writing" | "checker" | "templates";

const TABS = [
  { id: "platforms" as const, label: "Platforms", icon: "📱" },
  { id: "writing" as const, label: "Humanlike Writing", icon: "✍️" },
  { id: "checker" as const, label: "AI Checker", icon: "🔍" },
  { id: "templates" as const, label: "Templates", icon: "📋" },
];

export function PlaybookContainer({ entries, writingRules }: PlaybookContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("platforms");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("X");

  return (
    <div className="h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 glass rounded-t-2xl border-b-0">
        <div className="px-5 py-4">
          <h1 className="text-lg font-semibold text-foreground">Playbook</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Platform guides, writing tips, and templates for authentic engagement
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-5 pb-3 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-b from-primary/90 to-primary text-white shadow-[0_0_16px_-2px_rgba(139,92,246,0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "platforms" && (
          <PlatformGuides
            entries={entries}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
          />
        )}
        {activeTab === "writing" && <WritingGuide writingRules={writingRules} />}
        {activeTab === "checker" && <AIChecker writingRules={writingRules} />}
        {activeTab === "templates" && <TemplateLibrary />}
      </div>
    </div>
  );
}
