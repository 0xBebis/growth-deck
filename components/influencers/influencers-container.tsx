"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  externalProfileUrl: string | null;
  avatarUrl: string | null;
  followerCount: number;
  engagementRate: number | null;
  tier: string;
  bio: string | null;
  niche: string | null;
  topics: unknown;
  relationshipScore: number;
  ourInteractions: number;
  theirResponses: number;
  lastInteractionAt: Date | null;
  isAmbassador: boolean;
  tags: unknown;
  notes: string | null;
  interactions: {
    id: string;
    interactionType: string;
    content: string | null;
    theyResponded: boolean;
    createdAt: Date;
  }[];
  _count: { interactions: number };
}

interface InfluencersContainerProps {
  influencers: Influencer[];
  stats: {
    total: number;
    ambassadors: number;
    avgRelationship: number;
    totalInteractions: number;
    responseRate: number;
  };
  tierBreakdown: { tier: string; count: number; avgScore: number }[];
  platformBreakdown: { platform: string; count: number }[];
  currentFilters: {
    tier?: string;
    platform?: string;
    sort?: string;
  };
}

export function InfluencersContainer({
  influencers,
  stats,
  tierBreakdown,
  platformBreakdown,
  currentFilters,
}: InfluencersContainerProps) {
  const router = useRouter();
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    const filters = { ...currentFilters, [key]: value };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/influencers?${params.toString()}`);
  };

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl font-bold text-gradient">Influencers</h1>
              <p className="text-sm text-muted-foreground mt-1">Build relationships with key voices in your space</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Influencer
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
            <StatBadge label="Total" value={stats.total} icon="⭐" />
            <StatBadge label="Ambassadors" value={stats.ambassadors} icon="🏆" color="text-amber-400" />
            <StatBadge label="Avg Score" value={stats.avgRelationship} suffix="/100" icon="💪" />
            <StatBadge label="Interactions" value={stats.totalInteractions} icon="💬" />
            <StatBadge label="Response Rate" value={stats.responseRate} suffix="%" icon="📈" color="text-emerald-400" />
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["NANO", "MICRO", "MID", "MACRO", "MEGA"].map((tier) => {
            const data = tierBreakdown.find((t) => t.tier === tier);
            return (
              <button
                key={tier}
                onClick={() => updateFilter("tier", currentFilters.tier === tier ? undefined : tier)}
                className={`p-4 rounded-xl border transition-all ${
                  currentFilters.tier === tier
                    ? "bg-primary/10 border-primary/30"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                }`}
              >
                <div className="text-lg font-bold text-foreground">{data?.count || 0}</div>
                <div className="text-xs text-muted-foreground capitalize">{tier.toLowerCase()}</div>
                <div className={`text-[10px] mt-1 ${getTierColor(tier)}`}>
                  {getTierRange(tier)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentFilters.platform || ""}
            onChange={(e) => updateFilter("platform", e.target.value || undefined)}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Platforms</option>
            <option value="X">Twitter/X</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="REDDIT">Reddit</option>
            <option value="HN">Hacker News</option>
          </select>

          <select
            value={currentFilters.sort || "relationship"}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="relationship">Sort by Relationship</option>
            <option value="followers">Sort by Followers</option>
            <option value="engagement">Sort by Engagement</option>
            <option value="recent">Sort by Recent</option>
          </select>

          <span className="text-xs text-muted-foreground ml-auto">
            {influencers.length} influencers
          </span>
        </div>

        {/* Influencers List */}
        {influencers.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {influencers.map((influencer) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                isSelected={selectedInfluencer?.id === influencer.id}
                onSelect={() => setSelectedInfluencer(influencer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar - Influencer Detail */}
      {selectedInfluencer && (
        <aside className="w-80 shrink-0 hidden lg:block">
          <div className="sticky top-4">
            <InfluencerDetail influencer={selectedInfluencer} onClose={() => setSelectedInfluencer(null)} />
          </div>
        </aside>
      )}
    </div>
  );
}

function StatBadge({
  label,
  value,
  icon,
  suffix = "",
  color = "text-foreground",
}: {
  label: string;
  value: number;
  icon: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <div className={`text-xl font-bold ${color}`}>
          {value.toLocaleString()}
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function InfluencerCard({
  influencer,
  isSelected,
  onSelect,
}: {
  influencer: Influencer;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const responseRate = influencer.ourInteractions > 0
    ? Math.round((influencer.theirResponses / influencer.ourInteractions) * 100)
    : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center text-lg font-bold text-primary">
            {influencer.name[0]}
          </div>
          {influencer.isAmbassador && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-[10px]">🏆</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{influencer.name}</span>
            <TierBadge tier={influencer.tier} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${getPlatformBg(influencer.platform)}`}>
              {getPlatformIcon(influencer.platform)}
            </span>
            <span>@{influencer.handle}</span>
          </div>
          {influencer.niche && (
            <div className="text-xs text-muted-foreground mt-1 truncate">{influencer.niche}</div>
          )}
        </div>

        {/* Relationship Score */}
        <div className="text-right shrink-0">
          <div className={`text-lg font-bold ${getScoreColor(influencer.relationshipScore)}`}>
            {influencer.relationshipScore}
          </div>
          <div className="text-[10px] text-muted-foreground">score</div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>{formatFollowers(influencer.followerCount)} followers</span>
        <span>{influencer._count.interactions} interactions</span>
        {responseRate > 0 && <span className="text-emerald-400">{responseRate}% response</span>}
      </div>
    </button>
  );
}

function InfluencerDetail({ influencer, onClose }: { influencer: Influencer; onClose: () => void }) {
  const topics = Array.isArray(influencer.topics) ? influencer.topics as string[] : [];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="relative p-5 bg-gradient-to-br from-primary/20 to-purple-500/10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/30 flex items-center justify-center text-2xl font-bold text-white">
              {influencer.name[0]}
            </div>
            {influencer.isAmbassador && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-background">
                <span className="text-xs">🏆</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{influencer.name}</h3>
            <p className="text-sm text-muted-foreground">@{influencer.handle}</p>
          </div>
        </div>

        {/* Score ring */}
        <div className="absolute top-4 right-14">
          <div className={`w-12 h-12 rounded-full border-4 ${getScoreBorder(influencer.relationshipScore)} flex items-center justify-center`}>
            <span className="text-sm font-bold text-foreground">{influencer.relationshipScore}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <TierBadge tier={influencer.tier} large />
          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${getPlatformBg(influencer.platform)}`}>
            {getPlatformIcon(influencer.platform)}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-white/[0.04]">
            <div className="text-lg font-bold text-foreground">{formatFollowers(influencer.followerCount)}</div>
            <div className="text-[10px] text-muted-foreground">Followers</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/[0.04]">
            <div className="text-lg font-bold text-foreground">{influencer.ourInteractions}</div>
            <div className="text-[10px] text-muted-foreground">Interactions</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/[0.04]">
            <div className="text-lg font-bold text-emerald-400">{influencer.theirResponses}</div>
            <div className="text-[10px] text-muted-foreground">Responses</div>
          </div>
        </div>

        {influencer.bio && (
          <div className="p-3 rounded-lg bg-white/[0.04]">
            <div className="text-xs text-muted-foreground mb-1">Bio</div>
            <div className="text-sm text-foreground line-clamp-3">{influencer.bio}</div>
          </div>
        )}

        {topics.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Topics</div>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((topic, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {influencer.externalProfileUrl && (
            <a
              href={influencer.externalProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground hover:bg-white/[0.08] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Profile
            </a>
          )}
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 text-sm text-primary hover:bg-primary/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Engage
          </button>
        </div>

        {/* Recent Interactions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent Interactions
          </h4>
          {influencer.interactions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No interactions yet</div>
          ) : (
            <div className="space-y-2">
              {influencer.interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground capitalize">
                      {interaction.interactionType.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      {interaction.theyResponded && (
                        <span className="text-emerald-400">Responded</span>
                      )}
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {interaction.content && (
                    <div className="text-foreground line-clamp-2">{interaction.content}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {influencer.notes && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
            <div className="p-3 rounded-lg bg-white/[0.04] text-sm text-foreground">{influencer.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier, large = false }: { tier: string; large?: boolean }) {
  const styles: Record<string, string> = {
    NANO: "bg-zinc-500/20 text-zinc-300",
    MICRO: "bg-blue-500/20 text-blue-300",
    MID: "bg-purple-500/20 text-purple-300",
    MACRO: "bg-amber-500/20 text-amber-300",
    MEGA: "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full font-medium capitalize ${styles[tier] || styles.NANO} ${
        large ? "text-sm" : "text-xs"
      }`}
    >
      {tier.toLowerCase()}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center">
        <span className="text-3xl">⭐</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No influencers tracked</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Start building relationships with key voices in your industry.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      >
        Add Your First Influencer
      </button>
    </div>
  );
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    NANO: "text-zinc-400",
    MICRO: "text-blue-400",
    MID: "text-purple-400",
    MACRO: "text-amber-400",
    MEGA: "text-orange-400",
  };
  return colors[tier] || colors.NANO;
}

function getTierRange(tier: string): string {
  const ranges: Record<string, string> = {
    NANO: "<1K",
    MICRO: "1K-10K",
    MID: "10K-100K",
    MACRO: "100K-1M",
    MEGA: "1M+",
  };
  return ranges[tier] || "";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-blue-400";
  return "text-zinc-400";
}

function getScoreBorder(score: number): string {
  if (score >= 80) return "border-emerald-500/50";
  if (score >= 60) return "border-amber-500/50";
  if (score >= 40) return "border-blue-500/50";
  return "border-zinc-500/50";
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
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
