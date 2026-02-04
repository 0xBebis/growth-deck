"use client";

interface AccountSelectorProps {
  accounts: Array<{
    id: string;
    displayName: string;
    platform: string;
  }>;
  selectedId: string | null;
  platform: string;
  onChange: (accountId: string) => void;
}

export function AccountSelector({
  accounts,
  selectedId,
  platform,
  onChange,
}: AccountSelectorProps) {
  const filtered = accounts.filter((a) => a.platform === platform);
  if (filtered.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No accounts for this platform</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Post as:</span>
      <select
        value={selectedId || ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border bg-card px-2 py-1 text-xs"
      >
        <option value="">Select account...</option>
        {filtered.map((a) => (
          <option key={a.id} value={a.id}>
            {a.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
