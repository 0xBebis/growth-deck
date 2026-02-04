import { PLATFORM_LABELS } from "@/lib/utils/constants";

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const icons: Record<string, string> = {
  X: "𝕏",
  LINKEDIN: "in",
  REDDIT: "r/",
  HN: "Y",
};

const colors: Record<string, string> = {
  X: "bg-black text-white",
  LINKEDIN: "bg-blue-600 text-white",
  REDDIT: "bg-orange-500 text-white",
  HN: "bg-orange-600 text-white",
};

const sizes: Record<string, string> = {
  sm: "h-5 w-5 text-[8px]",
  md: "h-6 w-6 text-[10px]",
  lg: "h-8 w-8 text-xs",
};

export function PlatformIcon({ platform, size = "md", className = "" }: PlatformIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-bold ${sizes[size]} ${colors[platform] || "bg-gray-200"} ${className}`}
      title={PLATFORM_LABELS[platform] || platform}
    >
      {icons[platform] || "?"}
    </span>
  );
}
