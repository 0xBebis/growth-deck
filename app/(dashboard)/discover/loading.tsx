export default function DiscoverLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
