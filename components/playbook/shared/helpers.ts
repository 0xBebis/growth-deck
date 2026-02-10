/**
 * Helper functions for playbook components.
 */

export function getPlatformStyle(platform: string): string {
  const styles: Record<string, string> = {
    X: "bg-gradient-to-br from-zinc-600 to-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
    LINKEDIN: "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]",
    REDDIT: "bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-[0_2px_8px_rgba(234,88,12,0.3)]",
    HN: "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_2px_8px_rgba(251,146,60,0.3)]",
  };
  return styles[platform] || "bg-gradient-to-br from-zinc-600 to-zinc-700 text-white";
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    X: "𝕏",
    LINKEDIN: "in",
    REDDIT: "r/",
    HN: "Y",
  };
  return icons[platform] || "?";
}

export function getDefaultMaxLength(platform: string): number {
  switch (platform) {
    case "X": return 280;
    case "LINKEDIN": return 1300;
    case "REDDIT": return 10000;
    case "HN": return 10000;
    default: return 500;
  }
}

export function getDefaultTone(platform: string): string {
  switch (platform) {
    case "X": return "casual, punchy, direct";
    case "LINKEDIN": return "professional but warm, personal stories welcome";
    case "REDDIT": return "authentic, detailed, zero marketing speak";
    case "HN": return "technical, intellectually honest, cite specifics";
    default: return "helpful and authentic";
  }
}

export function getPlatformUrl(platform: string): string {
  switch (platform) {
    case "X": return "https://x.com";
    case "LINKEDIN": return "https://linkedin.com";
    case "REDDIT": return "https://reddit.com";
    case "HN": return "https://news.ycombinator.com";
    default: return "";
  }
}
