/**
 * Real-time presence indicator components.
 *
 * - StatusDot        – small colored dot with optional pulse
 * - PresenceGlow     – wrapper that adds a glow ring around children
 * - TypingIndicator  – animated "···" dots
 * - ActiveAgentsBadge – "N agents active" header pill
 */

import { motion } from "motion/react";
import { cn } from "../lib/utils";
import type { PresenceStatus } from "../hooks/use-presence";

/* ------------------------------------------------------------------ */
/*  Color mappings                                                     */
/* ------------------------------------------------------------------ */

const dotColors: Record<PresenceStatus, string> = {
  active: "bg-emerald-500",
  busy: "bg-amber-500",
  error: "bg-rose-500",
  idle: "bg-muted-foreground",
};

const glowShadow: Record<PresenceStatus, string> = {
  active: "shadow-[0_0_12px] shadow-emerald-500/45",
  busy: "shadow-[0_0_12px] shadow-amber-500/35",
  error: "shadow-[0_0_12px] shadow-rose-500/45",
  idle: "shadow-[0_0_12px] shadow-slate-500/18",
};

const ringColors: Record<PresenceStatus, string> = {
  active: "ring-emerald-500/60",
  busy: "ring-amber-500/50",
  error: "ring-rose-500/60",
  idle: "ring-muted-foreground/25",
};

/* ------------------------------------------------------------------ */
/*  StatusDot                                                          */
/* ------------------------------------------------------------------ */

interface StatusDotProps {
  status: PresenceStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusDot({ status, size = "sm", className }: StatusDotProps) {
  const sizeClass = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const shouldPulse = status === "active" || status === "error";

  return (
    <span className={cn("relative inline-flex", className)}>
      {shouldPulse && (
        <motion.span
          className={cn(
            "absolute inline-flex rounded-full opacity-75",
            sizeClass,
            dotColors[status],
          )}
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{
            repeat: Infinity,
            duration: status === "error" ? 1.2 : 2,
            ease: "easeInOut",
          }}
        />
      )}
      <span className={cn("relative inline-flex rounded-full", sizeClass, dotColors[status])} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  PresenceGlow                                                       */
/* ------------------------------------------------------------------ */

interface PresenceGlowProps {
  status: PresenceStatus;
  children: React.ReactNode;
  className?: string;
}

export function PresenceGlow({ status, children, className }: PresenceGlowProps) {
  const shouldPulse = status === "active" || status === "error";

  return (
    <div className={cn("relative", className)}>
      {shouldPulse ? (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full ring-2",
            ringColors[status],
            glowShadow[status],
          )}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            repeat: Infinity,
            duration: status === "error" ? 1.2 : 2.5,
            ease: "easeInOut",
          }}
        />
      ) : (
        <div className={cn("absolute inset-0 rounded-full ring-1", ringColors[status])} />
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TypingIndicator                                                    */
/* ------------------------------------------------------------------ */

interface TypingIndicatorProps {
  agentName: string;
  className?: string;
}

export function TypingIndicator({ agentName, className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="font-medium text-foreground/70">{agentName}</span>
      <span className="inline-flex items-center gap-0.5">
        is typing
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block w-1 h-1 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActiveAgentsBadge (for header)                                     */
/* ------------------------------------------------------------------ */

interface ActiveAgentsBadgeProps {
  count: number;
  className?: string;
}

export function ActiveAgentsBadge({ count, className }: ActiveAgentsBadgeProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20",
        className,
      )}
    >
      <StatusDot status="active" size="sm" />
      <span>
        {count} agent{count !== 1 ? "s" : ""} active
      </span>
    </div>
  );
}
