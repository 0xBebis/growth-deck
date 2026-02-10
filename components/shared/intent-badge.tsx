import { INTENT_CONFIG } from "@/lib/utils/constants";

interface IntentBadgeProps {
  intent: string | null | undefined;
}

export function IntentBadge({ intent }: IntentBadgeProps) {
  if (!intent) return null;

  const config = INTENT_CONFIG[intent];
  const color = config?.color || "bg-gray-500/20 text-gray-400";
  const icon = config?.icon;
  const label = config?.label || intent.charAt(0) + intent.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${color}`}
      role="status"
      aria-label={`Intent: ${label}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
