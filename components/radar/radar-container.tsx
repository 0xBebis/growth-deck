"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface CompetitorMention {
  id: string;
  platform: string;
  externalUrl: string;
  authorHandle: string | null;
  content: string;
  sentiment: string | null;
  intentType: string | null;
  isOpportunity: boolean;
  discoveredAt: Date;
}

interface CompetitorStat {
  id: string;
  name: string;
  domain: string | null;
  totalMentions: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platforms: { platform: string; count: number }[];
  opportunities: number;
  recentMentions: CompetitorMention[];
}

interface ShareOfVoice {
  id: string;
  date: Date;
  platform: string | null;
  ourMentions: number;
  competitorData: unknown;
  totalMarketMentions: number;
}

interface Opportunity extends CompetitorMention {
  competitor: { name: string };
}

interface RadarContainerProps {
  competitors: CompetitorStat[];
  shareOfVoice: ShareOfVoice[];
  opportunities: Opportunity[];
}

export function RadarContainer({
  competitors,
  shareOfVoice,
  opportunities,
}: RadarContainerProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorStat | null>(
    competitors[0] || null
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const totalMentions = competitors.reduce((sum, c) => sum + c.totalMentions, 0);
  const totalOpportunities = competitors.reduce((sum, c) => sum + c.opportunities, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl font-bold text-gradient">Radar</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor competitors and find opportunities</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Competitor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          <StatBadge label="Competitors" value={competitors.length} icon="🎯" />
          <StatBadge label="Total Mentions" value={totalMentions} icon="📢" />
          <StatBadge label="Opportunities" value={totalOpportunities} icon="💡" color="text-amber-400" />
          <StatBadge label="Negative Sentiment" value={opportunities.length} icon="👎" color="text-red-400" />
        </div>
      </div>

      {competitors.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitors List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
              Tracked Competitors
            </h2>
            {competitors.map((comp) => (
              <CompetitorCard
                key={comp.id}
                competitor={comp}
                isSelected={selectedCompetitor?.id === comp.id}
                onSelect={() => setSelectedCompetitor(comp)}
              />
            ))}
          </div>

          {/* Details & Mentions */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCompetitor && (
              <>
                {/* Competitor Detail */}
                <CompetitorDetail competitor={selectedCompetitor} />

                {/* Recent Mentions */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recent Mentions</h3>
                  {selectedCompetitor.recentMentions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No mentions found yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCompetitor.recentMentions.map((mention) => (
                        <MentionCard key={mention.id} mention={mention} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Opportunities Section */}
      {opportunities.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Engagement Opportunities</h2>
              <p className="text-xs text-muted-foreground">Negative competitor mentions you can respond to</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {opportunities.slice(0, 6).map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({
  label,
  value,
  icon,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function CompetitorCard({
  competitor,
  isSelected,
  onSelect,
}: {
  competitor: CompetitorStat;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const totalSentiment = competitor.sentiment.positive + competitor.sentiment.neutral + competitor.sentiment.negative;
  const sentimentScore = totalSentiment > 0
    ? Math.round(((competitor.sentiment.positive - competitor.sentiment.negative) / totalSentiment) * 100)
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
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-foreground">{competitor.name}</h3>
          {competitor.domain && (
            <p className="text-xs text-muted-foreground">{competitor.domain}</p>
          )}
        </div>
        <SentimentIndicator score={sentimentScore} />
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span>{competitor.totalMentions} mentions</span>
        {competitor.opportunities > 0 && (
          <span className="text-amber-400">{competitor.opportunities} opportunities</span>
        )}
      </div>
    </button>
  );
}

function CompetitorDetail({ competitor }: { competitor: CompetitorStat }) {
  const total = competitor.sentiment.positive + competitor.sentiment.neutral + competitor.sentiment.negative;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{competitor.name}</h2>
          {competitor.domain && (
            <a
              href={`https://${competitor.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {competitor.domain}
            </a>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{competitor.totalMentions}</div>
          <div className="text-xs text-muted-foreground">total mentions</div>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Sentiment Analysis</h4>
        <div className="flex h-4 rounded-full overflow-hidden bg-white/[0.04]">
          {total > 0 && (
            <>
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(competitor.sentiment.positive / total) * 100}%` }}
              />
              <div
                className="bg-zinc-500 transition-all"
                style={{ width: `${(competitor.sentiment.neutral / total) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(competitor.sentiment.negative / total) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-emerald-400">{competitor.sentiment.positive} positive</span>
          <span className="text-zinc-400">{competitor.sentiment.neutral} neutral</span>
          <span className="text-red-400">{competitor.sentiment.negative} negative</span>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">By Platform</h4>
        <div className="flex flex-wrap gap-2">
          {competitor.platforms.map((p) => (
            <div
              key={p.platform}
              className={`px-3 py-1.5 rounded-lg ${getPlatformBg(p.platform)} text-sm font-medium`}
            >
              {p.platform}: {p.count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MentionCard({ mention }: { mention: CompetitorMention }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${getPlatformBg(mention.platform)}`}>
              {getPlatformIcon(mention.platform)}
            </span>
            {mention.authorHandle && (
              <span className="text-xs text-muted-foreground">@{mention.authorHandle}</span>
            )}
            <SentimentBadge sentiment={mention.sentiment} />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(mention.discoveredAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground line-clamp-3">{mention.content}</p>
        </div>
        <a
          href={mention.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${getPlatformBg(opportunity.platform)}`}>
          {getPlatformIcon(opportunity.platform)}
        </span>
        <span className="text-xs font-medium text-amber-300">{opportunity.competitor.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDistanceToNow(new Date(opportunity.discoveredAt), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-foreground line-clamp-2 mb-3">{opportunity.content}</p>
      <a
        href={opportunity.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
      >
        Engage now
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}

function SentimentIndicator({ score }: { score: number }) {
  const color = score > 20 ? "bg-emerald-500" : score < -20 ? "bg-red-500" : "bg-zinc-500";
  return (
    <div className={`w-8 h-8 rounded-full ${color}/20 flex items-center justify-center`}>
      <div className={`w-3 h-3 rounded-full ${color}`} />
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;

  const styles: Record<string, string> = {
    positive: "bg-emerald-500/20 text-emerald-300",
    neutral: "bg-zinc-500/20 text-zinc-300",
    negative: "bg-red-500/20 text-red-300",
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[sentiment] || styles.neutral}`}>
      {sentiment}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center">
        <span className="text-3xl">📡</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No competitors tracked</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Add competitors to monitor their mentions and find engagement opportunities.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      >
        Add Your First Competitor
      </button>
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
