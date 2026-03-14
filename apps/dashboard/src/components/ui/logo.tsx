import { isBBTheme } from "../../lib/dashboard-theme";

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
} as const;

type LogoSize = keyof typeof sizes;

interface LogoProps {
  size?: LogoSize;
  className?: string;
  style?: React.CSSProperties;
}

const LOGO_EMOJI = isBBTheme ? "🍍" : "🐙";

export function Logo({ size = "md", className = "", style }: LogoProps) {
  const px = sizes[size];
  return (
    <span
      role="img"
      aria-label="OpenSpawn"
      className={`flex-shrink-0 leading-none select-none ${className}`}
      style={{ fontSize: px, lineHeight: 1, ...style }}
    >
      {LOGO_EMOJI}
    </span>
  );
}
