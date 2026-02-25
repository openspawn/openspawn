/**
 * ProtocolBadge — pill tags used in the hero section of the landing page.
 * Wrapper around the unified Badge component's protocol styling.
 */
interface ProtocolBadgeProps {
  label: string;
  /** "protocol" = cyan, "core" = violet, "feature" = emerald */
  variant?: "protocol" | "core" | "feature";
}

export function ProtocolBadge({ label, variant = "protocol" }: ProtocolBadgeProps) {
  const styles: Record<string, string> = {
    protocol: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    core:     "border-violet-500/20 bg-violet-500/10 text-violet-400",
    feature:  "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
