"use client";

import Link from "next/link";

interface SettingsTabsProps {
  currentTab: string;
  isAdmin: boolean;
}

const allTabs = [
  { key: "profile", label: "Profile", adminOnly: false },
  { key: "accounts", label: "Accounts", adminOnly: false },
  { key: "keywords", label: "Keywords", adminOnly: false },
  { key: "llm", label: "LLM", adminOnly: true },
  { key: "slack", label: "Slack", adminOnly: true },
  { key: "team", label: "Team", adminOnly: true },
];

export function SettingsTabs({ currentTab, isAdmin }: SettingsTabsProps) {
  const tabs = allTabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/settings?tab=${tab.key}`}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            currentTab === tab.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
