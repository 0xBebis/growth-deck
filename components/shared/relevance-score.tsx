interface RelevanceScoreProps {
  score: number | null | undefined;
}

export function RelevanceScore({ score }: RelevanceScoreProps) {
  if (score == null) return null;
  const color =
    score >= 80
      ? "text-green-600"
      : score >= 60
        ? "text-amber-600"
        : "text-gray-500";
  return (
    <span className={`text-sm font-bold ${color}`} title="Relevance score">
      {score}
    </span>
  );
}
