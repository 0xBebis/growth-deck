"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProfileSection,
  AISection,
  AccountsSection,
  IntegrationsSection,
  TeamSection,
  RecycleBinSection,
} from "./sections";
import type {
  CompanyProfile,
  LlmConfig,
  PlatformAccount,
  SlackConfig,
  User,
} from "./shared/types";

interface SettingsContainerProps {
  profile: CompanyProfile | null;
  llmConfig: LlmConfig | null;
  platformAccounts: PlatformAccount[];
  slackConfig: SlackConfig | null;
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
  initialTab: string;
}

type Tab = "profile" | "ai" | "accounts" | "integrations" | "team" | "recycle";

const TABS: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
  { id: "profile", label: "Company", icon: "🏢" },
  { id: "ai", label: "AI & Models", icon: "🤖", adminOnly: true },
  { id: "accounts", label: "Accounts", icon: "👤" },
  { id: "integrations", label: "Integrations", icon: "🔗", adminOnly: true },
  { id: "team", label: "Team", icon: "👥", adminOnly: true },
  { id: "recycle", label: "Recycle Bin", icon: "🗑️" },
];

export function SettingsContainer({
  profile,
  llmConfig,
  platformAccounts,
  slackConfig,
  users,
  currentUserId,
  isAdmin,
  initialTab,
}: SettingsContainerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab || "profile");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="h-full">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up-fade ${
            toast.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/20"
              : "bg-red-500/20 text-red-400 border border-red-500/20"
          }`}
        >
          {toast.type === "success" ? "✓" : "✗"} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border/50 rounded-t-xl">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your workspace, AI models, and integrations
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/settings?tab=${tab.id}`);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-smooth whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl">
        {activeTab === "profile" && (
          <ProfileSection profile={profile} isAdmin={isAdmin} showToast={showToast} />
        )}
        {activeTab === "ai" && isAdmin && (
          <AISection config={llmConfig} showToast={showToast} />
        )}
        {activeTab === "accounts" && (
          <AccountsSection accounts={platformAccounts} showToast={showToast} />
        )}
        {activeTab === "integrations" && isAdmin && (
          <IntegrationsSection config={slackConfig} showToast={showToast} />
        )}
        {activeTab === "team" && isAdmin && (
          <TeamSection users={users} currentUserId={currentUserId} showToast={showToast} />
        )}
        {activeTab === "recycle" && (
          <RecycleBinSection showToast={showToast} />
        )}
      </div>
    </div>
  );
}
