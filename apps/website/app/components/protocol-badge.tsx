interface ProtocolBadgeProps {
  label: string;
  variant?: "protocol" | "core";
}

export function ProtocolBadge({ label, variant = "protocol" }: ProtocolBadgeProps) {
  const styles =
    variant === "protocol"
      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
      : "border-violet-500/20 bg-violet-500/10 text-violet-400";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
