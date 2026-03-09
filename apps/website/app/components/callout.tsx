import type { ReactNode } from "react";

export enum CalloutVariant {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Danger = "danger",
}

interface CalloutProps {
  variant?: CalloutVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<CalloutVariant, string> = {
  [CalloutVariant.Info]: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
  [CalloutVariant.Success]: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  [CalloutVariant.Warning]: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  [CalloutVariant.Danger]: "border-red-500/20 bg-red-500/5 text-red-300",
};

const variantIcons: Record<CalloutVariant, string> = {
  [CalloutVariant.Info]: "ℹ️",
  [CalloutVariant.Success]: "✅",
  [CalloutVariant.Warning]: "⚠️",
  [CalloutVariant.Danger]: "🚨",
};

/**
 * Callout — contextual info box for docs and landing pages.
 *
 * Usage:
 *   <Callout>Plain info callout (cyan by default)</Callout>
 *   <Callout variant="warning">Watch out for this</Callout>
 */
export function Callout({ variant = CalloutVariant.Info, children, className = "" }: CalloutProps) {
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
export function CalloutBlock({
  variant = CalloutVariant.Info,
  children,
  className = "",
}: CalloutProps) {
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
