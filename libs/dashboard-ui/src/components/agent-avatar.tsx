import { cn } from "../lib/utils";

const LEVEL_COLORS: Record<number, string> = {
  10: "#f472b6",
  9: "#a78bfa",
  8: "#22c55e",
  7: "#22c55e",
  6: "#06b6d4",
  5: "#06b6d4",
  4: "#fbbf24",
  3: "#fbbf24",
  2: "#71717a",
  1: "#71717a",
};

const SIZE_MAP = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-xl",
} as const;

interface AgentAvatarProps {
  name: string;
  level?: number;
  avatar?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AgentAvatar({
  name,
  level = 5,
  avatar,
  avatarColor,
  avatarUrl,
  size = "md",
  className,
}: AgentAvatarProps) {
  const levelColor = LEVEL_COLORS[level] ?? "#71717a";
  const accentColor = avatarColor ?? levelColor;

  if (avatarUrl) {
    return (
      <div
        className={cn("relative shrink-0 rounded-2xl overflow-hidden", SIZE_MAP[size], className)}
      >
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (avatar) {
    return (
      <div
        className={cn(
          "relative shrink-0 rounded-2xl flex items-center justify-center",
          SIZE_MAP[size],
          className,
        )}
        style={{ backgroundColor: `${accentColor}30` }}
      >
        <span className="leading-none">{avatar}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-2xl flex items-center justify-center font-bold text-white/90 border border-white/10",
        SIZE_MAP[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${levelColor}40, ${levelColor}15)`,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
