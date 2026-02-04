"use client";

import { useEffect, useState } from "react";

interface Metrics {
  postsFound: number;
  repliesSent: number;
  queueDepth: number;
  llmSpend: number;
}

export function MetricsBar() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/analytics/summary");
        if (res.ok) {
          setMetrics(await res.json());
        }
      } catch {
        // Non-critical
      }
    }
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center gap-6 border-b border-border/50 glass-subtle px-4 py-2">
        <span className="text-xs text-muted-foreground animate-pulse">Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 border-b border-border/50 glass-subtle px-4 py-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">This Week</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">{metrics.postsFound}</span>
        <span className="text-xs text-muted-foreground">found</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-green-400">{metrics.repliesSent}</span>
        <span className="text-xs text-muted-foreground">sent</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-amber-400">{metrics.queueDepth}</span>
        <span className="text-xs text-muted-foreground">queued</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-primary">${metrics.llmSpend.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">spent</span>
      </div>
    </div>
  );
}
