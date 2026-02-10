"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function SpendBadge() {
  const [spend, setSpend] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSpend() {
      try {
        const data = await api.analytics.getSpend();
        setSpend(data.monthlySpend ?? 0);
      } catch {
        // Silently fail — badge is non-critical
      }
    }
    fetchSpend();
    const interval = setInterval(fetchSpend, 60000);
    return () => clearInterval(interval);
  }, []);

  if (spend === null) return null;

  const isHigh = spend > 10;

  return (
    <span className={`rounded-lg glass border-border/50 px-2.5 py-1 text-xs font-medium transition-smooth ${
      isHigh ? "text-amber-400" : "text-muted-foreground"
    }`}>
      ${spend.toFixed(2)}
      <span className="ml-1 text-[10px] opacity-60">this month</span>
    </span>
  );
}
