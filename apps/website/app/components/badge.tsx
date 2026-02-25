type BadgeColor = "cyan" | "violet" | "amber" | "emerald" | "red" | "slate";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  color?: BadgeColor;
  size?: BadgeSize;
  uppercase?: boolean;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  cyan:    "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  violet:  "border-violet-500/20 bg-violet-500/10 text-violet-400",
  amber:   "border-amber-500/20 bg-amber-500/10 text-amber-400",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  red:     "border-red-500/20 bg-red-500/5 text-red-400",
  slate:   "border-white/10 bg-white/5 text-slate-400",
};

const dotColors: Record<BadgeColor, string> = {
  cyan:    "bg-cyan-400",
  violet:  "bg-violet-400",
  amber:   "bg-amber-400",
  emerald: "bg-emerald-400",
  red:     "bg-red-400",
  slate:   "bg-slate-400",
};

const sizeStyles: Record<BadgeSize, { pill: string; label: string }> = {
  sm: {
    pill:  "px-2.5 py-0.5 text-[10px]",
    label: "px-4 py-1 text-xs",
  },
  md: {
    pill:  "px-3 py-1 text-xs",
    label: "px-4 py-1 text-xs",
  },
};

/**
 * Badge — small pill or label for categories, protocol names, status tags.
 *
 * Variants by usage:
 *   Category (uppercase, tiny):  <Badge color="cyan" uppercase size="sm">REAL-WORLD</Badge>
 *   Protocol pill:               <Badge color="violet">A2A Protocol</Badge>
 *   Live indicator:              <Badge color="emerald" dot>Live</Badge>
 *   Feature label (landing bar): <Badge color="cyan" size="md">MIT</Badge>
 */
export function Badge({
  color = "cyan",
  size = "md",
  uppercase = false,
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  const textTransform = uppercase ? "uppercase tracking-widest font-bold" : "font-medium";
  const sizing = uppercase ? sizeStyles[size].pill : sizeStyles[size].label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorStyles[color]} ${sizing} ${textTransform} ${className}`}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`}
        />
      )}
      {children}
    </span>
  );
}
