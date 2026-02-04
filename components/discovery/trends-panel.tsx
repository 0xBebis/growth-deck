"use client";

interface TrendsPanelProps {
  trends: {
    keyword: string;
    count: number;
    velocity: number;
    platforms: string[];
  }[];
}

export function TrendsPanel({ trends }: TrendsPanelProps) {
  const sortedTrends = [...trends].sort((a, b) => {
    if (b.velocity !== a.velocity) return b.velocity - a.velocity;
    return b.count - a.count;
  });

  const hotTrends = sortedTrends.filter((t) => t.velocity > 0);
  const stableTrends = sortedTrends.filter((t) => t.velocity === 0);
  const coolingTrends = sortedTrends.filter((t) => t.velocity < 0);

  return (
    <div className="sticky top-4 space-y-4">
      {/* Hot trends */}
      <div className="rounded-xl glass p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Trending Up
        </h3>
        {hotTrends.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rising trends yet</p>
        ) : (
          <div className="space-y-2">
            {hotTrends.slice(0, 5).map((trend) => (
              <TrendItem key={trend.keyword} trend={trend} />
            ))}
          </div>
        )}
      </div>

      {/* Post ideas section */}
      <div className="rounded-xl glass p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
          <span className="text-amber-400">💡</span>
          Post Ideas
        </h3>
        <div className="space-y-2 text-xs">
          {hotTrends.slice(0, 3).map((trend) => (
            <div key={trend.keyword} className="p-3 bg-white/5 rounded-lg border border-border/30">
              <p className="font-medium text-foreground">&ldquo;{generatePostIdea(trend.keyword)}&rdquo;</p>
              <p className="text-muted-foreground mt-1.5">
                Target: {trend.platforms.join(", ")}
              </p>
            </div>
          ))}
          {hotTrends.length === 0 && (
            <p className="text-muted-foreground">
              Scrape more data to generate post ideas
            </p>
          )}
        </div>
      </div>

      {/* Stable topics */}
      {stableTrends.length > 0 && (
        <div className="rounded-xl glass p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
            <span className="text-blue-400">📊</span>
            Consistent Topics
          </h3>
          <div className="space-y-2">
            {stableTrends.slice(0, 5).map((trend) => (
              <TrendItem key={trend.keyword} trend={trend} />
            ))}
          </div>
        </div>
      )}

      {/* Cooling trends */}
      {coolingTrends.length > 0 && (
        <div className="rounded-xl glass p-4 opacity-60">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
            <span className="text-blue-300">❄️</span>
            Cooling Down
          </h3>
          <div className="space-y-2">
            {coolingTrends.slice(0, 3).map((trend) => (
              <TrendItem key={trend.keyword} trend={trend} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendItem({ trend }: { trend: { keyword: string; count: number; velocity: number; platforms: string[] } }) {
  const velocityColor = trend.velocity > 0 ? "text-green-400" : trend.velocity < 0 ? "text-red-400" : "text-muted-foreground";
  const velocityArrow = trend.velocity > 0 ? "↑" : trend.velocity < 0 ? "↓" : "→";

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate text-foreground">{trend.keyword}</span>
        <div className="flex gap-0.5">
          {trend.platforms.map((p) => (
            <PlatformMini key={p} platform={p} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{trend.count}</span>
        <span className={`text-xs font-medium ${velocityColor}`}>
          {velocityArrow} {Math.abs(trend.velocity)}%
        </span>
      </div>
    </div>
  );
}

function PlatformMini({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    X: "bg-zinc-400",
    LINKEDIN: "bg-blue-500",
    REDDIT: "bg-orange-500",
    HN: "bg-orange-400",
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[platform] || "bg-gray-400"}`} />;
}

function generatePostIdea(keyword: string): string {
  const templates = [
    `The rise of ${keyword}: What you need to know in 2026`,
    `I've been exploring ${keyword} - here's what I learned`,
    `Hot take: ${keyword} is changing how we think about trading`,
    `${keyword} explained: A thread 🧵`,
    `Why everyone's talking about ${keyword} right now`,
  ];
  const index = keyword.length % templates.length;
  return templates[index];
}
