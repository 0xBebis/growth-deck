"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateCompanyProfile,
  updateLlmConfig,
  createPlatformAccount,
  deletePlatformAccount,
  togglePlatformAccountDefault,
  createKeyword,
  deleteKeyword,
  toggleKeyword,
  updateSlackConfig,
  updateUserRole,
} from "@/app/(dashboard)/settings/actions";
import { CURATED_MODELS, PLATFORM_LABELS } from "@/lib/utils/constants";

// Types
interface CompanyProfile {
  companyName: string;
  productName: string;
  productDescription: string;
  brandVoice: string;
  targetAudiences: unknown;
}

interface LlmConfig {
  defaultModelId: string;
  classificationTemp: number;
  draftingTemp: number;
  summarizationTemp: number;
  calendarTemp: number;
  monthlyBudgetLimit: number | null;
  budgetAlertThreshold: number;
  budgetHardStop: boolean;
}

interface PlatformAccount {
  id: string;
  platform: string;
  accountType: string;
  displayName: string;
  accountHandle: string | null;
  isActive: boolean;
  isDefault: boolean;
  user: { name: string | null } | null;
}

interface Keyword {
  id: string;
  phrase: string;
  category: string;
  isActive: boolean;
  postsMatched: number;
}

interface SlackConfig {
  webhookUrl: string | null;
  alertChannelName: string;
  metricsChannelName: string;
  highPriorityThreshold: number;
  enableHighPriorityAlerts: boolean;
  enableDailySummary: boolean;
  enableWeeklyRecap: boolean;
  enableQueueAlerts: boolean;
  enableCalendarReminders: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

interface SettingsContainerProps {
  profile: CompanyProfile | null;
  llmConfig: LlmConfig | null;
  platformAccounts: PlatformAccount[];
  keywords: Keyword[];
  slackConfig: SlackConfig | null;
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
  initialTab: string;
}

type Tab = "profile" | "ai" | "accounts" | "keywords" | "integrations" | "team" | "recycle";

export function SettingsContainer({
  profile,
  llmConfig,
  platformAccounts,
  keywords,
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

  const tabs: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: "profile", label: "Company", icon: "🏢" },
    { id: "ai", label: "AI & Models", icon: "🤖", adminOnly: true },
    { id: "accounts", label: "Accounts", icon: "👤" },
    { id: "keywords", label: "Keywords", icon: "🔑" },
    { id: "integrations", label: "Integrations", icon: "🔗", adminOnly: true },
    { id: "team", label: "Team", icon: "👥", adminOnly: true },
    { id: "recycle", label: "Recycle Bin", icon: "🗑️" },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

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
        {activeTab === "keywords" && (
          <KeywordsSection keywords={keywords} showToast={showToast} />
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

// Profile Section
function ProfileSection({
  profile,
  isAdmin,
  showToast,
}: {
  profile: CompanyProfile | null;
  isAdmin: boolean;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateCompanyProfile(formData);
        showToast("success", "Company profile updated");
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Company Profile</h2>
        <p className="text-sm text-muted-foreground">
          This information is used to personalize AI-generated content
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Company Name" name="companyName" defaultValue={profile?.companyName} disabled={!isAdmin} />
          <FormField label="Product Name" name="productName" defaultValue={profile?.productName} disabled={!isAdmin} />
        </div>

        <FormField
          label="Product Description"
          name="productDescription"
          defaultValue={profile?.productDescription}
          disabled={!isAdmin}
          multiline
          rows={4}
          placeholder="Describe your product and what problems it solves..."
        />

        <FormField
          label="Brand Voice"
          name="brandVoice"
          defaultValue={profile?.brandVoice}
          disabled={!isAdmin}
          multiline
          rows={4}
          placeholder="Describe the tone and personality for AI-generated replies..."
          help="This guides how the AI writes - e.g., 'Friendly and technical, like a smart coworker'"
        />

        <div>
          <label className="block text-sm font-medium mb-1">Target Audiences</label>
          <p className="text-xs text-muted-foreground mb-2">
            Define your audience segments (JSON format)
          </p>
          <textarea
            name="targetAudiences"
            defaultValue={JSON.stringify(profile?.targetAudiences ?? [], null, 2)}
            disabled={!isAdmin}
            rows={6}
            className="w-full rounded-lg border bg-card px-3 py-2 font-mono text-xs disabled:opacity-50"
          />
        </div>

        {isAdmin && (
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        )}

        {!isAdmin && (
          <p className="text-xs text-muted-foreground">
            Only admins can edit company settings
          </p>
        )}
      </form>
    </div>
  );
}

// AI Section
function AISection({
  config,
  showToast,
}: {
  config: LlmConfig | null;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateLlmConfig(formData);
        showToast("success", "AI settings updated");
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">AI & Models</h2>
        <p className="text-sm text-muted-foreground">
          Configure the AI models and parameters used for content generation
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* API Configuration Note */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <h3 className="text-sm font-medium text-blue-400 mb-1">API Configuration</h3>
          <p className="text-xs text-blue-300">
            The OpenRouter API key is configured via the <code className="px-1.5 py-0.5 bg-blue-500/20 rounded-md">OPENROUTER_API_KEY</code> environment variable.
            Set this in your deployment environment or <code className="px-1.5 py-0.5 bg-blue-500/20 rounded-md">.env.local</code> file.
          </p>
        </div>

        {/* Model Selection */}
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">Default Model</h3>
          <select
            name="defaultModelId"
            defaultValue={config?.defaultModelId ?? "moonshotai/kimi-k2.5"}
            className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CURATED_MODELS.map((model) => (
              <option key={model.id} value={model.id} className="bg-popover text-popover-foreground">
                {model.name} — ${model.inputCost}/${model.outputCost} per 1M tokens
                {model.tag ? ` (${model.tag})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            Used for classification and reply drafting
          </p>
        </div>

        {/* Temperature Settings */}
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">Temperature Settings</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Lower values = more deterministic, higher values = more creative
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "classificationTemp", label: "Classification", value: config?.classificationTemp ?? 0.2, help: "For categorizing posts" },
              { name: "draftingTemp", label: "Drafting", value: config?.draftingTemp ?? 0.6, help: "For writing replies" },
              { name: "summarizationTemp", label: "Summarization", value: config?.summarizationTemp ?? 0.3, help: "For summarizing content" },
              { name: "calendarTemp", label: "Calendar", value: config?.calendarTemp ?? 0.7, help: "For content planning" },
            ].map((t) => (
              <div key={t.name}>
                <label className="block text-xs font-medium mb-1 text-foreground">{t.label}</label>
                <input
                  name={t.name}
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  defaultValue={t.value}
                  className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{t.help}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Controls */}
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-medium mb-3 text-foreground">Budget Controls</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">Monthly Limit ($)</label>
                <input
                  name="monthlyBudgetLimit"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={config?.monthlyBudgetLimit ?? ""}
                  placeholder="No limit"
                  className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-foreground">Alert at (%)</label>
                <input
                  name="budgetAlertThreshold"
                  type="number"
                  step="5"
                  min="0"
                  max="100"
                  defaultValue={(config?.budgetAlertThreshold ?? 0.8) * 100}
                  className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                name="budgetHardStop"
                type="checkbox"
                defaultChecked={config?.budgetHardStop ?? true}
                className="rounded border-border/50"
              />
              <span className="text-sm text-foreground">Hard stop at 100% (drafting still works)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
        >
          {isPending ? "Saving..." : "Save AI Settings"}
        </button>
      </form>
    </div>
  );
}

// Accounts Section
function AccountsSection({
  accounts,
  showToast,
}: {
  accounts: PlatformAccount[];
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      try {
        await createPlatformAccount(formData);
        showToast("success", "Account added");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to add account");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deletePlatformAccount(id);
        showToast("success", "Account removed");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to remove");
      }
    });
  }

  async function handleSetDefault(id: string) {
    startTransition(async () => {
      try {
        await togglePlatformAccountDefault(id);
        showToast("success", "Default account updated");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  // Group accounts by platform
  const grouped = accounts.reduce((acc, a) => {
    if (!acc[a.platform]) acc[a.platform] = [];
    acc[a.platform].push(a);
    return acc;
  }, {} as Record<string, PlatformAccount[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Platform Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Add accounts you&apos;ll use to post replies
        </p>
      </div>

      {/* Add Account Form */}
      <form action={handleCreate} className="rounded-xl glass p-4">
        <h3 className="text-sm font-medium mb-3 text-foreground">Add Account</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Platform</label>
            <select name="platform" className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="X" className="bg-popover text-popover-foreground">X (Twitter)</option>
              <option value="LINKEDIN" className="bg-popover text-popover-foreground">LinkedIn</option>
              <option value="REDDIT" className="bg-popover text-popover-foreground">Reddit</option>
              <option value="HN" className="bg-popover text-popover-foreground">Hacker News</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Type</label>
            <select name="accountType" className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="COMPANY" className="bg-popover text-popover-foreground">Company</option>
              <option value="PERSONAL" className="bg-popover text-popover-foreground">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Display Name</label>
            <input
              name="displayName"
              required
              placeholder="e.g. Cod3x Official"
              className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Handle</label>
            <input
              name="accountHandle"
              placeholder="e.g. @cod3x"
              className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
        >
          {isPending ? "Adding..." : "Add Account"}
        </button>
      </form>

      {/* Account List by Platform */}
      <div className="space-y-4">
        {["X", "LINKEDIN", "REDDIT", "HN"].map((platform) => {
          const platformAccounts = grouped[platform] || [];
          return (
            <div key={platform} className="rounded-xl glass overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-border/30">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${getPlatformStyle(platform)}`}>
                  {getPlatformIcon(platform)}
                </span>
                <span className="text-sm font-medium text-foreground">{PLATFORM_LABELS[platform] || platform}</span>
                <span className="text-xs text-muted-foreground">({platformAccounts.length})</span>
              </div>
              {platformAccounts.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {platformAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{account.displayName}</span>
                          {account.accountHandle && (
                            <span className="text-xs text-muted-foreground">{account.accountHandle}</span>
                          )}
                          {account.isDefault && (
                            <span className="px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{account.accountType}</span>
                          {account.user?.name && (
                            <span className="text-[10px] text-muted-foreground">• Owner: {account.user.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.isDefault && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            disabled={isPending}
                            className="px-2 py-1 text-xs glass border-border/50 rounded-md hover:bg-white/5 disabled:opacity-50 transition-smooth"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={isPending}
                          className="px-2 py-1 text-xs text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 disabled:opacity-50 transition-smooth"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No accounts added
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Keywords Section
function KeywordsSection({
  keywords,
  showToast,
}: {
  keywords: Keyword[];
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const categories = [
    { value: "PRODUCT", label: "Product", color: "bg-blue-500/20 text-blue-400" },
    { value: "PAIN_POINT", label: "Pain Point", color: "bg-amber-500/20 text-amber-400" },
    { value: "COMPETITOR", label: "Competitor", color: "bg-purple-500/20 text-purple-400" },
    { value: "RESEARCH", label: "Research", color: "bg-green-500/20 text-green-400" },
  ];

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      try {
        await createKeyword(formData);
        showToast("success", "Keyword added");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteKeyword(id);
        showToast("success", "Keyword removed");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to remove");
      }
    });
  }

  async function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      try {
        await toggleKeyword(id, isActive);
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to toggle");
      }
    });
  }

  const grouped = keywords.reduce((acc, k) => {
    if (!acc[k.category]) acc[k.category] = [];
    acc[k.category].push(k);
    return acc;
  }, {} as Record<string, Keyword[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Monitoring Keywords</h2>
        <p className="text-sm text-muted-foreground">
          Keywords used to find relevant posts across platforms
        </p>
      </div>

      {/* Add Keyword Form */}
      <form action={handleCreate} className="rounded-xl glass p-4">
        <h3 className="text-sm font-medium mb-3 text-foreground">Add Keyword</h3>
        <div className="flex gap-3">
          <input
            name="phrase"
            required
            placeholder="Enter keyword or phrase..."
            className="flex-1 rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select name="category" className="rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            {categories.map((c) => (
              <option key={c.value} value={c.value} className="bg-popover text-popover-foreground">{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
          >
            Add
          </button>
        </div>
      </form>

      {/* Keywords by Category */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catKeywords = grouped[cat.value] || [];
          return (
            <div key={cat.value} className="rounded-xl glass">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-white/5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{catKeywords.length} keywords</span>
                </div>
              </div>
              <div className="p-3">
                {catKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {catKeywords.map((kw) => (
                      <div
                        key={kw.id}
                        className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass border-border/30 text-sm transition-smooth ${
                          kw.isActive ? "" : "opacity-50"
                        }`}
                      >
                        <button
                          onClick={() => handleToggle(kw.id, !kw.isActive)}
                          disabled={isPending}
                          className={`w-3 h-3 rounded-full border-2 transition-colors ${
                            kw.isActive ? "bg-green-400 border-green-400" : "border-zinc-500"
                          }`}
                        />
                        <span className="text-foreground">{kw.phrase}</span>
                        {kw.postsMatched > 0 && (
                          <span className="text-[10px] text-muted-foreground">({kw.postsMatched})</span>
                        )}
                        <button
                          onClick={() => handleDelete(kw.id)}
                          disabled={isPending}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No keywords</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Integrations Section
function IntegrationsSection({
  config,
  showToast,
}: {
  config: SlackConfig | null;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateSlackConfig(formData);
        showToast("success", "Slack settings updated");
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect external services for notifications and automation
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Slack */}
        <div className="rounded-xl glass p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💬</span>
            <h3 className="text-sm font-medium text-foreground">Slack</h3>
          </div>

          <div className="space-y-4">
            <FormField
              label="Webhook URL"
              name="webhookUrl"
              defaultValue={config?.webhookUrl || ""}
              placeholder="https://hooks.slack.com/services/..."
              help="Create an incoming webhook in your Slack workspace"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Alert Channel" name="alertChannelName" defaultValue={config?.alertChannelName || "#growth-alerts"} />
              <FormField label="Metrics Channel" name="metricsChannelName" defaultValue={config?.metricsChannelName || "#growth-metrics"} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">High Priority Threshold</label>
              <input
                name="highPriorityThreshold"
                type="number"
                min="0"
                max="100"
                defaultValue={config?.highPriorityThreshold ?? 80}
                className="w-32 rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Posts above this score trigger alerts</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Notifications</p>
              {[
                { name: "enableHighPriorityAlerts", label: "High-priority post alerts", checked: config?.enableHighPriorityAlerts ?? true },
                { name: "enableDailySummary", label: "Daily summary", checked: config?.enableDailySummary ?? true },
                { name: "enableWeeklyRecap", label: "Weekly recap", checked: config?.enableWeeklyRecap ?? true },
                { name: "enableQueueAlerts", label: "Queue alerts (stale drafts)", checked: config?.enableQueueAlerts ?? true },
                { name: "enableCalendarReminders", label: "Calendar reminders", checked: config?.enableCalendarReminders ?? true },
              ].map((n) => (
                <label key={n.name} className="flex items-center gap-2">
                  <input name={n.name} type="checkbox" defaultChecked={n.checked} className="rounded border-border/50" />
                  <span className="text-sm text-foreground">{n.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
        >
          {isPending ? "Saving..." : "Save Integrations"}
        </button>
      </form>
    </div>
  );
}

// Team Section
function TeamSection({
  users,
  currentUserId,
  showToast,
}: {
  users: User[];
  currentUserId: string;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRoleChange(userId: string, role: "ADMIN" | "CONTRIBUTOR") {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        showToast("success", "Role updated");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update role");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Team Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <div className="divide-y divide-border/30">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-foreground">
                    {user.name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{user.name || "Unknown"}</span>
                    {user.id === currentUserId && (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] text-muted-foreground">You</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  user.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-zinc-500/20 text-zinc-400"
                }`}>
                  {user.role}
                </span>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => handleRoleChange(user.id, user.role === "ADMIN" ? "CONTRIBUTOR" : "ADMIN")}
                    disabled={isPending}
                    className="px-2 py-1 text-xs glass border-border/50 rounded-md hover:bg-white/5 disabled:opacity-50 transition-smooth"
                  >
                    {user.role === "ADMIN" ? "Demote" : "Promote"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Recycle Bin Section
interface DismissedPost {
  id: string;
  platform: string;
  content: string;
  authorHandle: string | null;
  authorName: string | null;
  externalUrl: string;
  updatedAt: string;
}

function RecycleBinSection({
  showToast,
}: {
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<DismissedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Fetch dismissed posts
  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (platform) params.set("platform", platform);
        const res = await fetch(`/api/discovery/dismissed?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch {
        showToast("error", "Failed to load dismissed posts");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, [search, platform, showToast]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleRestore(ids: string[]) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/dismissed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", `Restored ${data.restored} post${data.restored !== 1 ? "s" : ""}`);
          setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
          setSelectedIds(new Set());
          router.refresh();
        }
      } catch {
        showToast("error", "Failed to restore posts");
      }
    });
  }

  async function handleRestoreAll() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/dismissed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", `Restored ${data.restored} posts`);
          setPosts([]);
          setSelectedIds(new Set());
          router.refresh();
        }
      } catch {
        showToast("error", "Failed to restore posts");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/discovery/dismissed?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          showToast("success", "Post permanently deleted");
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      } catch {
        showToast("error", "Failed to delete post");
      }
    });
  }

  async function handleEmptyTrash() {
    if (!confirm("Are you sure you want to permanently delete all dismissed posts? This cannot be undone.")) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/discovery/dismissed", {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", `Permanently deleted ${data.deleted} posts`);
          setPosts([]);
          setSelectedIds(new Set());
        }
      } catch {
        showToast("error", "Failed to empty recycle bin");
      }
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Recycle Bin</h2>
        <p className="text-sm text-muted-foreground">
          Posts you&apos;ve dismissed can be restored or permanently deleted here
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="recycle-search" className="sr-only">Search dismissed posts</label>
          <input
            id="recycle-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by content, author..."
            className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="recycle-platform" className="sr-only">Filter by platform</label>
          <select
            id="recycle-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" className="bg-popover text-popover-foreground">All Platforms</option>
            <option value="X" className="bg-popover text-popover-foreground">X (Twitter)</option>
            <option value="LINKEDIN" className="bg-popover text-popover-foreground">LinkedIn</option>
            <option value="REDDIT" className="bg-popover text-popover-foreground">Reddit</option>
            <option value="HN" className="bg-popover text-popover-foreground">Hacker News</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {posts.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl glass">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.size === posts.length && posts.length > 0
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground"
              }`}>
                {selectedIds.size === posts.length && posts.length > 0 && "✓"}
              </span>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => handleRestore(Array.from(selectedIds))}
                disabled={isPending}
                className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition-smooth"
              >
                Restore Selected
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreAll}
              disabled={isPending}
              className="px-3 py-1.5 text-sm glass border-border/50 rounded-lg hover:bg-white/5 disabled:opacity-50 transition-smooth"
            >
              Restore All
            </button>
            <button
              onClick={handleEmptyTrash}
              disabled={isPending}
              className="px-3 py-1.5 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-smooth"
            >
              Empty Trash
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="rounded-xl glass overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-3xl mb-2 block" role="img" aria-label="Empty trash">🗑️</span>
            <p className="text-sm text-muted-foreground">
              {search || platform ? "No dismissed posts match your search" : "No dismissed posts"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`flex items-start gap-3 p-4 transition-smooth ${
                  selectedIds.has(post.id) ? "bg-primary/5" : ""
                }`}
              >
                <button
                  onClick={() => toggleSelect(post.id)}
                  className={`mt-1 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selectedIds.has(post.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground hover:border-foreground"
                  }`}
                  aria-label={selectedIds.has(post.id) ? "Deselect post" : "Select post"}
                >
                  {selectedIds.has(post.id) && "✓"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${getPlatformStyle(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.authorHandle || post.authorName || "Unknown author"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • Dismissed {new Date(post.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore([post.id])}
                    disabled={isPending}
                    className="px-2 py-1 text-xs text-green-400 border border-green-500/20 rounded-md hover:bg-green-500/10 disabled:opacity-50 transition-smooth"
                    aria-label="Restore this post"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                    className="px-2 py-1 text-xs text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 disabled:opacity-50 transition-smooth"
                    aria-label="Permanently delete this post"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {posts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {posts.length} dismissed post{posts.length !== 1 ? "s" : ""} in recycle bin
        </p>
      )}
    </div>
  );
}

// Form Field Component
function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
  multiline,
  rows,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  help?: string;
}) {
  const inputClass = "w-full rounded-lg glass border-border/50 px-3 py-2 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary transition-smooth";

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-foreground">{label}</label>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows || 3}
          className={inputClass}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
        />
      )}
      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
    </div>
  );
}

function getPlatformStyle(platform: string) {
  const styles: Record<string, string> = {
    X: "bg-zinc-700 text-white",
    LINKEDIN: "bg-blue-600 text-white",
    REDDIT: "bg-orange-600 text-white",
    HN: "bg-orange-500 text-white",
  };
  return styles[platform] || "bg-zinc-600 text-white";
}

function getPlatformIcon(platform: string) {
  const icons: Record<string, string> = {
    X: "𝕏",
    LINKEDIN: "in",
    REDDIT: "r/",
    HN: "Y",
  };
  return icons[platform] || "?";
}
