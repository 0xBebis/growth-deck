"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  name: string | null;
  handle: string | null;
  email: string | null;
  platform: string | null;
  externalProfileUrl: string | null;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  bio: string | null;
  score: number;
  status: string;
  source: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastEngagedAt: Date | null;
  totalInteractions: number;
  tags: unknown;
  notes: string | null;
  interactions: {
    id: string;
    interactionType: string;
    content: string | null;
    createdAt: Date;
  }[];
  _count: { interactions: number; conversions: number };
}

interface LeadsContainerProps {
  leads: Lead[];
  stats: {
    total: number;
    hot: number;
    warm: number;
    converted: number;
    avgScore: number;
  };
  sourceBreakdown: { source: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  currentFilters: {
    status?: string;
    source?: string;
    sort?: string;
  };
}

export function LeadsContainer({
  leads,
  stats,
  sourceBreakdown,
  statusBreakdown,
  currentFilters,
}: LeadsContainerProps) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    const filters = { ...currentFilters, [key]: value };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl font-bold text-gradient">Leads</h1>
              <p className="text-sm text-muted-foreground mt-1">Track and nurture your growth opportunities</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Lead
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
            <StatBadge label="Total Leads" value={stats.total} />
            <StatBadge label="Hot" value={stats.hot} color="text-red-400" />
            <StatBadge label="Warm" value={stats.warm} color="text-amber-400" />
            <StatBadge label="Converted" value={stats.converted} color="text-emerald-400" />
            <StatBadge label="Avg Score" value={stats.avgScore} suffix="/100" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentFilters.status || ""}
            onChange={(e) => updateFilter("status", e.target.value || undefined)}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="ENGAGED">Engaged</option>
            <option value="WARM">Warm</option>
            <option value="HOT">Hot</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            value={currentFilters.source || ""}
            onChange={(e) => updateFilter("source", e.target.value || undefined)}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Sources</option>
            <option value="REDDIT">Reddit</option>
            <option value="TWITTER">Twitter</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="HN">Hacker News</option>
            <option value="INBOUND">Inbound</option>
            <option value="REFERRAL">Referral</option>
          </select>

          <select
            value={currentFilters.sort || "score"}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="score">Sort by Score</option>
            <option value="recent">Sort by Recent</option>
            <option value="interactions">Sort by Interactions</option>
          </select>

          <span className="text-xs text-muted-foreground ml-auto">
            {leads.length} leads
          </span>
        </div>

        {/* Leads List */}
        {leads.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLead?.id === lead.id}
                onSelect={() => setSelectedLead(lead)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar - Lead Detail */}
      {selectedLead && (
        <aside className="w-80 shrink-0 hidden lg:block">
          <div className="sticky top-4">
            <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </div>
        </aside>
      )}

      {/* Add Modal would go here */}
    </div>
  );
}

function StatBadge({
  label,
  value,
  color = "text-foreground",
  suffix = "",
}: {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function LeadRow({
  lead,
  isSelected,
  onSelect,
}: {
  lead: Lead;
  isSelected: boolean;
  onSelect: () => void;
}) {
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
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
          {lead.name?.[0] || lead.handle?.[0] || "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {lead.name || lead.handle || "Unknown"}
            </span>
            <StatusBadge status={lead.status} />
          </div>
          {lead.handle && (
            <div className="text-sm text-muted-foreground truncate">@{lead.handle}</div>
          )}
          {lead.company && (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {lead.jobTitle ? `${lead.jobTitle} at ` : ""}{lead.company}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <div className={`text-lg font-bold ${getScoreColor(lead.score)}`}>{lead.score}</div>
          <div className="text-xs text-muted-foreground">score</div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        {lead.platform && (
          <span className="flex items-center gap-1">
            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${getPlatformBg(lead.platform)}`}>
              {getPlatformIcon(lead.platform)}
            </span>
            {lead.platform}
          </span>
        )}
        <span>{lead._count.interactions} interactions</span>
        <span>Last seen {formatDistanceToNow(new Date(lead.lastSeenAt), { addSuffix: true })}</span>
      </div>
    </button>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/30 flex items-center justify-center text-2xl font-bold text-white">
            {lead.name?.[0] || lead.handle?.[0] || "?"}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{lead.name || lead.handle || "Unknown"}</h3>
            {lead.handle && <p className="text-sm text-muted-foreground">@{lead.handle}</p>}
          </div>
        </div>

        {/* Score ring */}
        <div className="absolute top-4 right-14">
          <div className={`w-12 h-12 rounded-full border-4 ${getScoreBorder(lead.score)} flex items-center justify-center`}>
            <span className="text-sm font-bold text-foreground">{lead.score}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={lead.status} large />
          <span className="text-xs text-muted-foreground">
            Source: {lead.source}
          </span>
        </div>

        {lead.company && (
          <div className="p-3 rounded-lg bg-white/[0.04]">
            <div className="text-xs text-muted-foreground mb-1">Company</div>
            <div className="text-sm font-medium text-foreground">{lead.company}</div>
            {lead.jobTitle && <div className="text-xs text-muted-foreground">{lead.jobTitle}</div>}
          </div>
        )}

        {lead.bio && (
          <div className="p-3 rounded-lg bg-white/[0.04]">
            <div className="text-xs text-muted-foreground mb-1">Bio</div>
            <div className="text-sm text-foreground line-clamp-3">{lead.bio}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {lead.externalProfileUrl && (
            <a
              href={lead.externalProfileUrl}
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
            Recent Activity
          </h4>
          {lead.interactions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No interactions yet</div>
          ) : (
            <div className="space-y-2">
              {lead.interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground capitalize">
                      {interaction.interactionType.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
                    </span>
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
        {lead.notes && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
            <div className="p-3 rounded-lg bg-white/[0.04] text-sm text-foreground">{lead.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, large = false }: { status: string; large?: boolean }) {
  const styles: Record<string, string> = {
    NEW: "bg-zinc-500/20 text-zinc-300",
    ENGAGED: "bg-blue-500/20 text-blue-300",
    WARM: "bg-amber-500/20 text-amber-300",
    HOT: "bg-red-500/20 text-red-300",
    CONVERTED: "bg-emerald-500/20 text-emerald-300",
    LOST: "bg-zinc-700/20 text-zinc-400",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full font-medium capitalize ${styles[status] || styles.NEW} ${
        large ? "text-sm" : "text-xs"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No leads yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Leads are automatically captured when you engage with posts. You can also add leads manually.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      >
        Add Your First Lead
      </button>
    </div>
  );
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
