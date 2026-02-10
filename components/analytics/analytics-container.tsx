"use client";

import { useState, useMemo } from "react";
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
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("30d");

  const filteredStats = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
    return dailyStats.slice(-days);
  }, [dailyStats, timeRange]);

  const totalPosts = filteredStats.reduce((sum, d) => sum + d.posts, 0);
  const totalReplies = filteredStats.reduce((sum, d) => sum + d.replies, 0);
  const conversionRate = funnelData.discovered > 0
    ? ((funnelData.sent / funnelData.discovered) * 100).toFixed(1)
    : "0";

  const maxValue = Math.max(...filteredStats.map((d) => (selectedMetric === "posts" ? d.posts : d.replies)), 1);

  // Calculate insights
  const insights = useMemo(() => {
    const result: { type: "success" | "warning" | "info"; message: string }[] = [];

    if (weekComparison.sent.change > 20) {
      result.push({ type: "success", message: `Replies sent up ${weekComparison.sent.change}% vs last week` });
    }
    if (weekComparison.posts.change > 30) {
      result.push({ type: "success", message: `${weekComparison.posts.change}% more opportunities discovered` });
    }
    if (funnelData.drafted > 0 && funnelData.sent === 0) {
      result.push({ type: "warning", message: `${funnelData.drafted} drafts waiting to be sent` });
    }
    if (funnelData.queued > funnelData.drafted * 2) {
      result.push({ type: "info", message: "Consider drafting more replies from queue" });
    }

    const bestPlatform = platformStats.reduce((best, p) =>
      p.conversionRate > (best?.conversionRate || 0) ? p : best, platformStats[0]);
    if (bestPlatform && bestPlatform.conversionRate > 0) {
      result.push({ type: "info", message: `${bestPlatform.platform} has highest conversion at ${bestPlatform.conversionRate}%` });
    }

    return result.slice(0, 3);
  }, [weekComparison, funnelData, platformStats]);

  // Calculate 7-day trend for sparklines
  const recentTrend = dailyStats.slice(-7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gradient">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your growth and engagement metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Key Insights</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  insight.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : insight.type === "warning"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStatCard
          label="Discovered"
          value={weekComparison.posts.current}
          change={weekComparison.posts.change}
          trend={recentTrend.map(d => d.posts)}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <HeroStatCard
          label="Drafted"
          value={weekComparison.replies.current}
          change={weekComparison.replies.change}
          trend={recentTrend.map(d => d.replies)}
          color="violet"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <HeroStatCard
          label="Sent"
          value={weekComparison.sent.current}
          change={weekComparison.sent.change}
          trend={recentTrend.map(d => d.replies)}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
        <HeroStatCard
          label="Conversion"
          value={parseFloat(conversionRate)}
          suffix="%"
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Activity Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Activity Over Time</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPosts.toLocaleString()} posts, {totalReplies.toLocaleString()} replies
            </p>
          </div>
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
        <div className="h-56 flex items-end gap-[2px] px-1">
          {filteredStats.map((day, i) => {
            const value = selectedMetric === "posts" ? day.posts : day.replies;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const isToday = i === filteredStats.length - 1;
            const isWeekend = [0, 6].includes(new Date(day.date).getDay());

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group min-w-[4px]">
                <div className="relative w-full h-48 flex items-end">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isToday
                        ? "bg-gradient-to-t from-primary to-primary/70 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                        : isWeekend
                        ? "bg-gradient-to-t from-white/5 to-white/10 group-hover:from-primary/20 group-hover:to-primary/40"
                        : "bg-gradient-to-t from-white/10 to-white/20 group-hover:from-primary/30 group-hover:to-primary/60"
                    }`}
                    style={{ height: `${Math.max(height, 1)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1f] border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    <div className="font-semibold text-foreground text-sm">{value.toLocaleString()}</div>
                    <div className="text-muted-foreground">{format(parseISO(day.date), "EEE, MMM d")}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-3 text-xs text-muted-foreground px-1">
          <span>{filteredStats.length > 0 ? format(parseISO(filteredStats[0].date), "MMM d") : ""}</span>
          <span className="text-muted-foreground/50">|</span>
          <span>{filteredStats.length > 0 ? format(parseISO(filteredStats[Math.floor(filteredStats.length / 2)].date), "MMM d") : ""}</span>
          <span className="text-muted-foreground/50">|</span>
          <span>{filteredStats.length > 0 ? format(parseISO(filteredStats[filteredStats.length - 1].date), "MMM d") : ""}</span>
        </div>
      </div>

      {/* Funnel & Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel - Visual */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Conversion Funnel</h2>
          <div className="relative">
            {/* Funnel visualization */}
            <div className="space-y-2">
              <FunnelStage
                label="Discovered"
                value={funnelData.discovered}
                percentage={100}
                width={100}
                color="from-blue-500 to-blue-600"
                bgColor="bg-blue-500/10"
              />
              <FunnelStage
                label="Queued"
                value={funnelData.queued}
                percentage={funnelData.discovered > 0 ? (funnelData.queued / funnelData.discovered) * 100 : 0}
                width={funnelData.discovered > 0 ? Math.max(20, (funnelData.queued / funnelData.discovered) * 100) : 20}
                color="from-violet-500 to-violet-600"
                bgColor="bg-violet-500/10"
              />
              <FunnelStage
                label="Drafted"
                value={funnelData.drafted}
                percentage={funnelData.discovered > 0 ? (funnelData.drafted / funnelData.discovered) * 100 : 0}
                width={funnelData.discovered > 0 ? Math.max(15, (funnelData.drafted / funnelData.discovered) * 100) : 15}
                color="from-purple-500 to-purple-600"
                bgColor="bg-purple-500/10"
              />
              <FunnelStage
                label="Sent"
                value={funnelData.sent}
                percentage={funnelData.discovered > 0 ? (funnelData.sent / funnelData.discovered) * 100 : 0}
                width={funnelData.discovered > 0 ? Math.max(10, (funnelData.sent / funnelData.discovered) * 100) : 10}
                color="from-emerald-500 to-emerald-600"
                bgColor="bg-emerald-500/10"
              />
            </div>

            {/* Conversion rates between stages */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="grid grid-cols-3 gap-2 text-center">
                <ConversionRate
                  from="Discovered"
                  to="Queued"
                  rate={funnelData.discovered > 0 ? (funnelData.queued / funnelData.discovered) * 100 : 0}
                />
                <ConversionRate
                  from="Queued"
                  to="Drafted"
                  rate={funnelData.queued > 0 ? (funnelData.drafted / funnelData.queued) * 100 : 0}
                />
                <ConversionRate
                  from="Drafted"
                  to="Sent"
                  rate={funnelData.drafted > 0 ? (funnelData.sent / funnelData.drafted) * 100 : 0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Platform Performance</h2>
          {platformStats.length === 0 ? (
            <EmptyState message="No platform data yet" icon="chart" />
          ) : (
            <div className="space-y-4">
              {platformStats.map((platform) => (
                <PlatformCard key={platform.platform} platform={platform} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Status Grid */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Reply Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["DRAFT", "SCHEDULED", "SENT", "FAILED"].map((status) => {
            const item = engagementBreakdown.find((e) => e.status === status);
            const count = item?.count || 0;
            return (
              <StatusCard key={status} status={status} count={count} />
            );
          })}
        </div>
      </div>

      {/* Recent Sent Replies */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          <span className="text-xs text-muted-foreground">{topReplies.length} sent this period</span>
        </div>
        {topReplies.length === 0 ? (
          <EmptyState message="No sent replies yet" icon="send" />
        ) : (
          <div className="space-y-3">
            {topReplies.slice(0, 5).map((reply, index) => (
              <ReplyCard key={reply.id} reply={reply} isFirst={index === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeRangeSelector({ value, onChange }: { value: string; onChange: (v: "7d" | "14d" | "30d") => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
      {(["7d", "14d", "30d"] as const).map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            value === range
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {range === "7d" ? "7D" : range === "14d" ? "14D" : "30D"}
        </button>
      ))}
    </div>
  );
}

function HeroStatCard({
  label,
  value,
  change,
  trend,
  color,
  icon,
  suffix = "",
}: {
  label: string;
  value: number;
  change?: number;
  trend?: number[];
  color: "blue" | "violet" | "emerald" | "amber";
  icon: React.ReactNode;
  suffix?: string;
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/10 text-blue-400",
    violet: "from-violet-500/20 to-violet-600/10 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 text-amber-400",
  };

  const sparklineColor = {
    blue: "#3b82f6",
    violet: "#8b5cf6",
    emerald: "#10b981",
    amber: "#f59e0b",
  };

  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color].split(" ").slice(0, 2).join(" ")} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
            {icon}
          </div>
          {change !== undefined && change !== 0 && (
            <div
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                change >= 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              <svg
                className={`w-3 h-3 ${change >= 0 ? "" : "rotate-180"}`}
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

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
              {typeof value === "number" && !suffix ? value.toLocaleString() : value}{suffix}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </div>

          {/* Mini sparkline */}
          {trend && trend.length > 0 && (
            <Sparkline data={trend} color={sparklineColor[color]} />
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 48;
    const y = 20 - ((v - min) / range) * 16;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="48" height="24" className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function FunnelStage({
  label,
  value,
  percentage,
  width,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  percentage: number;
  width: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="relative">
      <div className={`rounded-xl ${bgColor} p-4 transition-all`} style={{ width: `${width}%`, marginLeft: `${(100 - width) / 2}%` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${color}`} />
            <div>
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">{value.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversionRate({ from, to, rate }: { from: string; to: string; rate: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-foreground">{rate.toFixed(0)}%</div>
      <div className="text-xs text-muted-foreground truncate">{from} → {to}</div>
    </div>
  );
}

function PlatformCard({ platform }: { platform: PlatformStat }) {
  const maxPosts = 100; // normalize
  const barWidth = Math.min((platform.posts / maxPosts) * 100, 100);

  return (
    <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold ${getPlatformBg(platform.platform)} shadow-lg`}>
          {getPlatformIcon(platform.platform)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">{platform.platform}</span>
            <span className="text-sm font-bold text-foreground">{platform.conversionRate}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getPlatformGradient(platform.platform)}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{platform.posts} discovered</span>
            <span>{platform.replies} replies</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ status, count }: { status: string; count: number }) {
  const config = getStatusConfig(status);

  return (
    <div className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className="text-xs text-muted-foreground capitalize">{status.toLowerCase()}</span>
      </div>
      <div className="text-3xl font-bold text-foreground">{count.toLocaleString()}</div>
    </div>
  );
}

function ReplyCard({ reply, isFirst }: { reply: TopReply; isFirst: boolean }) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:bg-white/[0.04] ${
        isFirst ? "bg-white/[0.04] border-primary/20" : "bg-white/[0.02] border-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${getPlatformBg(reply.platform)}`}>
              {getPlatformIcon(reply.platform)}
            </span>
            <span className="text-sm font-medium text-foreground">
              {reply.postAuthor ? `@${reply.postAuthor}` : "Unknown"}
            </span>
            {reply.sentAt && (
              <span className="text-xs text-muted-foreground">
                • {format(new Date(reply.sentAt), "MMM d, h:mm a")}
              </span>
            )}
            {isFirst && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">Latest</span>
            )}
          </div>
          <p className="text-sm text-foreground/80 line-clamp-2">{reply.content}</p>
        </div>
        <a
          href={reply.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] hover:border-white/[0.1] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: "chart" | "send" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
        {icon === "chart" ? (
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
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
    X: "bg-zinc-800 text-white",
    LINKEDIN: "bg-[#0077b5] text-white",
    REDDIT: "bg-[#ff4500] text-white",
    HN: "bg-[#ff6600] text-white",
  };
  return bgs[platform] || "bg-zinc-600 text-white";
}

function getPlatformGradient(platform: string): string {
  const gradients: Record<string, string> = {
    X: "bg-gradient-to-r from-zinc-500 to-zinc-400",
    LINKEDIN: "bg-gradient-to-r from-[#0077b5] to-[#00a0dc]",
    REDDIT: "bg-gradient-to-r from-[#ff4500] to-[#ff6314]",
    HN: "bg-gradient-to-r from-[#ff6600] to-[#ff8533]",
  };
  return gradients[platform] || "bg-gradient-to-r from-zinc-500 to-zinc-400";
}

function getStatusConfig(status: string): { bg: string; border: string; dot: string } {
  const configs: Record<string, { bg: string; border: string; dot: string }> = {
    DRAFT: { bg: "bg-amber-500/5", border: "border-amber-500/20", dot: "bg-amber-400" },
    SCHEDULED: { bg: "bg-blue-500/5", border: "border-blue-500/20", dot: "bg-blue-400" },
    SENT: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    FAILED: { bg: "bg-red-500/5", border: "border-red-500/20", dot: "bg-red-400" },
  };
  return configs[status] || { bg: "bg-white/[0.02]", border: "border-white/[0.06]", dot: "bg-white/40" };
}
