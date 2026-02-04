"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";

interface DailyStat {
  date: string;
  posts: number;
  replies: number;
  engagements: number;
}

interface PlatformStat {
  platform: string;
  posts: number;
  replies: number;
  avgScore: number;
  conversionRate: number;
}

interface TopReply {
  id: string;
  platform: string;
  content: string;
  sentAt: Date | null;
  postUrl: string;
  postAuthor: string | null;
}

interface FunnelData {
  discovered: number;
  queued: number;
  drafted: number;
  sent: number;
}

interface WeekComparison {
  posts: { current: number; previous: number; change: number };
  replies: { current: number; previous: number; change: number };
  sent: { current: number; previous: number; change: number };
}

interface AnalyticsContainerProps {
  dailyStats: DailyStat[];
  engagementBreakdown: { status: string; count: number }[];
  platformStats: PlatformStat[];
  topReplies: TopReply[];
  funnelData: FunnelData;
  weekComparison: WeekComparison;
}

export function AnalyticsContainer({
  dailyStats,
  engagementBreakdown,
  platformStats,
  topReplies,
  funnelData,
  weekComparison,
}: AnalyticsContainerProps) {
  const [selectedMetric, setSelectedMetric] = useState<"posts" | "replies">("posts");

  const totalPosts = dailyStats.reduce((sum, d) => sum + d.posts, 0);
  const totalReplies = dailyStats.reduce((sum, d) => sum + d.replies, 0);
  const responseRate = totalPosts > 0 ? Math.round((totalReplies / totalPosts) * 100) : 0;

  const maxValue = Math.max(...dailyStats.map((d) => (selectedMetric === "posts" ? d.posts : d.replies)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gradient">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your growth and engagement metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Last 30 days</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Week-over-Week Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Posts Discovered"
          value={weekComparison.posts.current}
          change={weekComparison.posts.change}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <StatCard
          label="Replies Drafted"
          value={weekComparison.replies.current}
          change={weekComparison.replies.change}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          label="Replies Sent"
          value={weekComparison.sent.current}
          change={weekComparison.sent.change}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
      </div>

      {/* Activity Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Activity Over Time</h2>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setSelectedMetric("posts")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedMetric === "posts"
                  ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setSelectedMetric("replies")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedMetric === "replies"
                  ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Replies
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 flex items-end gap-1">
          {dailyStats.slice(-30).map((day, i) => {
            const value = selectedMetric === "posts" ? day.posts : day.replies;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const isToday = i === dailyStats.length - 1;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full">
                  <div
                    className={`w-full rounded-t transition-all duration-200 ${
                      isToday
                        ? "bg-gradient-to-t from-primary/60 to-primary shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                        : "bg-gradient-to-t from-white/10 to-white/20 group-hover:from-primary/30 group-hover:to-primary/50"
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1f] border border-white/10 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="font-medium text-foreground">{value}</div>
                    <div className="text-muted-foreground">{format(parseISO(day.date), "MMM d")}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{dailyStats.length > 0 ? format(parseISO(dailyStats[0].date), "MMM d") : ""}</span>
          <span>{dailyStats.length > 0 ? format(parseISO(dailyStats[dailyStats.length - 1].date), "MMM d") : ""}</span>
        </div>
      </div>

      {/* Funnel & Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            <FunnelStep
              label="Discovered"
              value={funnelData.discovered}
              percentage={100}
              color="from-blue-500/20 to-blue-500/10"
            />
            <FunnelStep
              label="Queued"
              value={funnelData.queued}
              percentage={funnelData.discovered > 0 ? (funnelData.queued / funnelData.discovered) * 100 : 0}
              color="from-violet-500/20 to-violet-500/10"
            />
            <FunnelStep
              label="Drafted"
              value={funnelData.drafted}
              percentage={funnelData.discovered > 0 ? (funnelData.drafted / funnelData.discovered) * 100 : 0}
              color="from-purple-500/20 to-purple-500/10"
            />
            <FunnelStep
              label="Sent"
              value={funnelData.sent}
              percentage={funnelData.discovered > 0 ? (funnelData.sent / funnelData.discovered) * 100 : 0}
              color="from-emerald-500/20 to-emerald-500/10"
            />
          </div>
        </div>

        {/* Platform Performance */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Platform Performance</h2>
          {platformStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No platform data yet</div>
          ) : (
            <div className="space-y-4">
              {platformStats.map((platform) => (
                <div key={platform.platform} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${getPlatformBg(platform.platform)}`}>
                    {getPlatformIcon(platform.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{platform.platform}</span>
                      <span className="text-xs text-muted-foreground">{platform.posts} posts</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">{platform.replies} replies</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-muted-foreground">{platform.conversionRate}% rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Status Breakdown */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Reply Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {engagementBreakdown.map((item) => (
            <div
              key={item.status}
              className={`p-4 rounded-xl border ${getStatusStyle(item.status)}`}
            >
              <div className="text-2xl font-bold text-foreground">{item.count}</div>
              <div className="text-xs text-muted-foreground capitalize">{item.status.toLowerCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sent Replies */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Sent Replies</h2>
        {topReplies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No sent replies yet</div>
        ) : (
          <div className="space-y-3">
            {topReplies.map((reply) => (
              <div
                key={reply.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${getPlatformBg(reply.platform)}`}>
                        {getPlatformIcon(reply.platform)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {reply.postAuthor ? `@${reply.postAuthor}` : "Unknown"}
                      </span>
                      {reply.sentAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.sentAt), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{reply.content}</p>
                  </div>
                  <a
                    href={reply.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}) {
  const isPositive = change >= 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
          {icon}
        </div>
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <svg
              className={`w-3 h-3 ${isPositive ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value.toLocaleString()}</span>
      </div>
      <div className="h-8 rounded-lg bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-lg bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
      <div className="absolute right-0 -top-1 text-xs text-muted-foreground">
        {Math.round(percentage)}%
      </div>
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

function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    DRAFT: "bg-amber-500/10 border-amber-500/20",
    SCHEDULED: "bg-blue-500/10 border-blue-500/20",
    SENT: "bg-emerald-500/10 border-emerald-500/20",
    FAILED: "bg-red-500/10 border-red-500/20",
  };
  return styles[status] || "bg-white/[0.04] border-white/[0.06]";
}
