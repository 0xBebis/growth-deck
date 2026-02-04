"use client";

interface QualityPanelProps {
  quality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export function QualityPanel({ quality }: QualityPanelProps) {
  const scoreColor = quality.score >= 70 ? "text-green-600" : quality.score >= 40 ? "text-amber-600" : "text-red-600";
  const scoreBg = quality.score >= 70 ? "bg-green-100" : quality.score >= 40 ? "bg-amber-100" : "bg-red-100";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Humanness Score</h3>
        <div className={`px-3 py-1 rounded-full ${scoreBg} ${scoreColor} font-bold text-lg`}>
          {quality.score}
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 rounded-full bg-muted mb-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            quality.score >= 70 ? "bg-green-500" :
            quality.score >= 40 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${quality.score}%` }}
        />
      </div>

      {/* Score interpretation */}
      <p className="text-xs text-muted-foreground mb-4">
        {quality.score >= 70
          ? "✓ This reply sounds human and natural. Ready to send!"
          : quality.score >= 40
          ? "⚠ Some AI patterns detected. Consider editing before sending."
          : "✗ Strong AI signals detected. Needs significant editing."}
      </p>

      {/* Issues */}
      {quality.issues.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-red-700 mb-2">Issues ({quality.issues.length})</h4>
          <ul className="space-y-1">
            {quality.issues.map((issue, i) => (
              <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {quality.suggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-amber-700 mb-2">Suggestions</h4>
          <ul className="space-y-1">
            {quality.suggestions.map((suggestion, i) => (
              <li key={i} className="text-xs text-amber-600 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {quality.issues.length === 0 && quality.suggestions.length === 0 && (
        <div className="text-xs text-green-600">
          No issues found. Your reply sounds natural!
        </div>
      )}
    </div>
  );
}

// Mini version for inline use
export function QualityBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        score >= 70
          ? "bg-green-100 text-green-700"
          : score >= 40
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {score >= 70 ? "✓" : score >= 40 ? "⚠" : "✗"}
      {score}%
    </span>
  );
}
