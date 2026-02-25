import type { ReactNode } from "react";

type CalloutVariant = "info" | "success" | "warning" | "danger";

interface CalloutProps {
  variant?: CalloutVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<CalloutVariant, string> = {
  info:    "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
  success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  danger:  "border-red-500/20 bg-red-500/5 text-red-300",
};

const variantIcons: Record<CalloutVariant, string> = {
  info:    "ℹ️",
  success: "✅",
  warning: "⚠️",
  danger:  "🚨",
};

/**
 * Callout — contextual info box for docs and landing pages.
 *
 * Usage:
 *   <Callout>Plain info callout (cyan by default)</Callout>
 *   <Callout variant="warning">Watch out for this</Callout>
 */
export function Callout({ variant = "info", children, className = "" }: CalloutProps) {
  return (
    <div
      role="note"
      className={`rounded-lg border px-4 py-3 text-sm ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * CalloutBlock — larger callout with an icon, for standalone block usage.
 */
export function CalloutBlock({ variant = "info", children, className = "" }: CalloutProps) {
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-lg border px-5 py-4 text-sm ${variantStyles[variant]} ${className}`}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-base leading-none">
        {variantIcons[variant]}
      </span>
      <div>{children}</div>
    </div>
  );
}
