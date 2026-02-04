import { AUDIENCE_CONFIG } from "@/lib/utils/constants";

interface AudienceBadgeProps {
  audience: string | null | undefined;
}

export function AudienceBadge({ audience }: AudienceBadgeProps) {
  if (!audience) return null;

  const config = AUDIENCE_CONFIG[audience];
  const color = config?.color || "bg-gray-500/20 text-gray-400";
  const icon = config?.icon;
  const label = config?.label || audience.charAt(0) + audience.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${color}`}
      role="status"
      aria-label={`Audience: ${label}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
