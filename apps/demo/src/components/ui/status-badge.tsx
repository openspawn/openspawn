import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold font-body uppercase tracking-wide border",
  {
    variants: {
      status: {
        idle: "bg-bb-status-idle/10 text-bb-status-idle border-bb-status-idle/30",
        working: "bg-bb-status-working/15 text-bb-status-working border-bb-status-working/40",
        busy: "bg-bb-status-busy/15 text-bb-status-busy border-bb-status-busy/40",
        overwhelmed:
          "bg-bb-status-overwhelmed/20 text-bb-status-overwhelmed border-bb-status-overwhelmed/50",
        paused: "bg-slate-400/15 text-slate-400 border-slate-400/30",
      },
    },
    defaultVariants: {
      status: "idle",
    },
  },
);

const statusDotVariants = cva("size-1.5 rounded-full", {
  variants: {
    status: {
      idle: "bg-bb-status-idle",
      working: "bg-bb-status-working animate-[status-pulse_2s_ease-in-out_infinite]",
      busy: "bg-bb-status-busy",
      overwhelmed: "bg-bb-status-overwhelmed animate-[status-pulse_1s_ease-in-out_infinite]",
      paused: "bg-slate-400",
    },
  },
  defaultVariants: {
    status: "idle",
  },
});

interface StatusBadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof statusBadgeVariants> {
  label: string;
  showDot?: boolean;
}

function StatusBadge({ status, label, showDot = true, className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showDot && <span className={cn(statusDotVariants({ status }))} aria-hidden="true" />}
      {label}
    </span>
  );
}

export { StatusBadge, statusBadgeVariants, statusDotVariants };
