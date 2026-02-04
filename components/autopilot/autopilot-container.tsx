"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface AutopilotConfig {
  id: string;
  isEnabled: boolean;
  autoDraftEnabled: boolean;
  autoDraftMinScore: number;
  autoDraftIntents: unknown;
  autoDraftPlatforms: unknown;
  maxDraftsPerDay: number;
  autoScheduleEnabled: boolean;
  scheduleDelayMinutes: number;
  postingWindows: unknown;
  maxRepliesPerHour: number;
  maxRepliesPerDay: number;
  draftsToday: number;
  repliesSentToday: number;
  lastResetAt: Date;
}

interface QueueItem {
  id: string;
  discoveredPostId: string;
  priority: number;
  scheduledFor: Date | null;
  status: string;
  draftContent: string | null;
  skipReason: string | null;
  createdAt: Date;
  post: {
    id: string;
    platform: string;
    content: string;
    externalUrl: string;
    authorHandle: string | null;
    relevanceScore: number | null;
    intentType: string | null;
  } | null;
}

interface AutopilotContainerProps {
  config: AutopilotConfig;
  queue: QueueItem[];
  stats: {
    pendingCount: number;
    draftedCount: number;
    approvedCount: number;
    sentCount: number;
    skippedCount: number;
  };
}

export function AutopilotContainer({ config, queue, stats }: AutopilotContainerProps) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(config.autoDraftEnabled);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(config.autoScheduleEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const intents = Array.isArray(config.autoDraftIntents) ? config.autoDraftIntents as string[] : [];
  const platforms = Array.isArray(config.autoDraftPlatforms) ? config.autoDraftPlatforms as string[] : [];

  const handleToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await fetch("/api/autopilot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (field === "isEnabled") setIsEnabled(value);
      if (field === "autoDraftEnabled") setAutoDraftEnabled(value);
      if (field === "autoScheduleEnabled") setAutoScheduleEnabled(value);

      router.refresh();
    } catch (error) {
      console.error("Failed to update config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      await fetch(`/api/autopilot/queue/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleSkip = async (itemId: string) => {
    try {
      await fetch(`/api/autopilot/queue/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "skipped" }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to skip:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnabled ? "bg-gradient-to-br from-emerald-500/30 to-green-500/20" : "bg-white/[0.04]"}`}>
              <span className="text-2xl">{isEnabled ? "🤖" : "💤"}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Autopilot</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isEnabled ? "Actively drafting and scheduling replies" : "Autopilot is paused"}
              </p>
            </div>
          </div>
          <Toggle
            enabled={isEnabled}
            onChange={(v) => handleToggle("isEnabled", v)}
            disabled={isSaving}
            label={isEnabled ? "Active" : "Paused"}
          />
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
          <StatBadge label="Pending" value={stats.pendingCount} color="text-blue-400" />
          <StatBadge label="Drafted" value={stats.draftedCount} color="text-amber-400" />
          <StatBadge label="Approved" value={stats.approvedCount} color="text-purple-400" />
          <StatBadge label="Sent Today" value={config.repliesSentToday} max={config.maxRepliesPerDay} color="text-emerald-400" />
          <StatBadge label="Skipped" value={stats.skippedCount} color="text-zinc-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Auto-Draft Settings */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Auto-Draft</h3>
              <Toggle
                enabled={autoDraftEnabled}
                onChange={(v) => handleToggle("autoDraftEnabled", v)}
                disabled={isSaving || !isEnabled}
                small
              />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Automatically generate reply drafts for high-scoring posts
            </p>

            <div className="space-y-3">
              <SettingRow label="Min Score" value={`${config.autoDraftMinScore}/100`} />
              <SettingRow label="Max/Day" value={`${config.draftsToday}/${config.maxDraftsPerDay}`} />
              <SettingRow label="Intent Types" value={intents.join(", ") || "None"} />
              <SettingRow label="Platforms" value={platforms.join(", ") || "All"} />
            </div>
          </div>

          {/* Auto-Schedule Settings */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Auto-Schedule</h3>
              <Toggle
                enabled={autoScheduleEnabled}
                onChange={(v) => handleToggle("autoScheduleEnabled", v)}
                disabled={isSaving || !isEnabled}
                small
              />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Automatically schedule approved drafts for sending
            </p>

            <div className="space-y-3">
              <SettingRow label="Delay" value={`${config.scheduleDelayMinutes} mins`} />
              <SettingRow label="Max/Hour" value={`${config.maxRepliesPerHour}`} />
              <SettingRow label="Max/Day" value={`${config.maxRepliesPerDay}`} />
            </div>
          </div>

          {/* Rate Limits */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Safety Limits</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hourly limit</span>
                <span className="text-foreground">{config.maxRepliesPerHour}/hour</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full" style={{ width: "30%" }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily limit</span>
                <span className="text-foreground">{config.repliesSentToday}/{config.maxRepliesPerDay}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60 rounded-full transition-all"
                  style={{ width: `${(config.repliesSentToday / config.maxRepliesPerDay) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-foreground">Autopilot Queue</h2>
              <p className="text-xs text-muted-foreground mt-1">Review and approve auto-generated drafts</p>
            </div>

            {queue.length === 0 ? (
              <EmptyQueue />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {queue.map((item) => (
                  <QueueItemCard
                    key={item.id}
                    item={item}
                    onApprove={() => handleApprove(item.id)}
                    onSkip={() => handleSkip(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
  disabled = false,
  small = false,
  label,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  small?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label && <span className={`text-sm ${enabled ? "text-emerald-400" : "text-muted-foreground"}`}>{label}</span>}
      <div
        className={`relative rounded-full transition-colors ${
          enabled ? "bg-emerald-500" : "bg-white/10"
        } ${small ? "w-10 h-5" : "w-12 h-6"}`}
      >
        <div
          className={`absolute top-0.5 rounded-full bg-white shadow-sm transition-transform ${
            small ? "w-4 h-4" : "w-5 h-5"
          } ${enabled ? (small ? "translate-x-5" : "translate-x-6") : "translate-x-0.5"}`}
        />
      </div>
    </button>
  );
}

function StatBadge({
  label,
  value,
  max,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>
        {value}
        {max !== undefined && <span className="text-sm text-muted-foreground">/{max}</span>}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function QueueItemCard({
  item,
  onApprove,
  onSkip,
}: {
  item: QueueItem;
  onApprove: () => void;
  onSkip: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusStyles: Record<string, string> = {
    pending: "bg-blue-500/20 text-blue-300",
    drafted: "bg-amber-500/20 text-amber-300",
    approved: "bg-purple-500/20 text-purple-300",
    sent: "bg-emerald-500/20 text-emerald-300",
    skipped: "bg-zinc-500/20 text-zinc-400",
  };

  return (
    <div className="p-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-4">
        {/* Priority indicator */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
          item.priority >= 80 ? "bg-emerald-500/20 text-emerald-300" :
          item.priority >= 50 ? "bg-amber-500/20 text-amber-300" :
          "bg-zinc-500/20 text-zinc-400"
        }`}>
          {item.priority}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {item.post && (
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${getPlatformBg(item.post.platform)}`}>
                {getPlatformIcon(item.post.platform)}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[item.status] || statusStyles.pending}`}>
              {item.status}
            </span>
            {item.post?.intentType && (
              <span className="text-xs text-muted-foreground">{item.post.intentType}</span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Original post preview */}
          {item.post && (
            <p className="text-sm text-foreground line-clamp-2 mb-2">{item.post.content}</p>
          )}

          {/* Draft preview (if exists) */}
          {item.draftContent && (
            <div className="mt-2 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="text-xs text-muted-foreground mb-1">Draft reply:</div>
              <p className={`text-sm text-foreground ${expanded ? "" : "line-clamp-2"}`}>
                {item.draftContent}
              </p>
              {item.draftContent.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-primary hover:text-primary/80 mt-1"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* Skip reason */}
          {item.skipReason && (
            <div className="mt-2 text-xs text-red-400">Skipped: {item.skipReason}</div>
          )}

          {/* Actions */}
          {(item.status === "pending" || item.status === "drafted") && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onApprove}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={onSkip}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-muted-foreground text-xs font-medium hover:bg-white/[0.08] hover:text-foreground transition-colors"
              >
                Skip
              </button>
              {item.post && (
                <a
                  href={item.post.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-muted-foreground text-xs font-medium hover:bg-white/[0.08] hover:text-foreground transition-colors ml-auto"
                >
                  View Post
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center">
        <span className="text-2xl">📭</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Queue is empty</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Enable autopilot to automatically queue high-scoring posts for reply drafting.
      </p>
    </div>
  );
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    X: "𝕏",
    LINKEDIN: "in",
    REDDIT: "r/",
    HN: "Y",
  };
  return icons[platform] || "?";
}

function getPlatformBg(platform: string): string {
  const bgs: Record<string, string> = {
    X: "bg-zinc-700 text-white",
    LINKEDIN: "bg-blue-600 text-white",
    REDDIT: "bg-orange-500 text-white",
    HN: "bg-orange-400 text-white",
  };
  return bgs[platform] || "bg-zinc-600 text-white";
}
