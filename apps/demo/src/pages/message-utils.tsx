/**
 * Shared utilities for the Messages page sub-components.
 * Extracted from messages.tsx to reduce file size.
 */
import { darkenForBackground } from "../lib/avatar-utils";
import { resolveAvatarUrl } from "../lib/resolve-avatar-url";
import type { Agent, Message } from "../hooks";

// ─── InlineAvatar ─────────────────────────────────────────────────────────────

interface InlineAvatarProps {
  agentId: string;
  agents: Agent[];
  className?: string;
  fontSize?: string;
}

/** Lightweight emoji/image avatar for use in compact message list items. */
export function InlineAvatar({
  agentId,
  agents,
  className = "w-5 h-5",
  fontSize = "text-xs",
}: InlineAvatarProps) {
  const agent = agents.find((a) => a.id === agentId);
  const avatar = agent?.avatar;
  const avatarColor = agent?.avatarColor || "#71717a";
  const avatarUrl = agent?.avatarUrl;

  if (avatarUrl) {
    return (
      <img
        src={resolveAvatarUrl(avatarUrl)}
        alt={agent?.name}
        className={`rounded-full object-contain p-0.5 ${className}`}
        style={{ backgroundColor: darkenForBackground(avatarColor) }}
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${fontSize} ${className}`}
      style={{ backgroundColor: darkenForBackground(avatarColor) }}
    >
      {avatar || "🤖"}
    </span>
  );
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Message type metadata ────────────────────────────────────────────────────

export const typeColors: Record<string, string> = {
  TASK: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  STATUS: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  REPORT: "bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30",
  QUESTION: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  ESCALATION: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  GENERAL: "bg-secondary text-muted-foreground border-border",
};

export const typeIcons: Record<string, string> = {
  TASK: "📋",
  STATUS: "✅",
  REPORT: "📊",
  QUESTION: "❓",
  ESCALATION: "🚨",
  GENERAL: "💬",
};

// ─── ACP message renderers (sandbox mode) ────────────────────────────────────

type AcpRenderResult = { label: string; className: string; compact?: boolean };

export const acpTypeRenderers: Record<string, (msg: Message) => AcpRenderResult> = {
  ack: () => ({
    label: "👍 Acknowledged",
    className:
      "bg-muted/60 text-muted-foreground text-[10px] rounded-full px-2 py-0.5 inline-block",
    compact: true,
  }),
  delegation: (msg) => ({
    label: `📋 Delegated: ${msg.taskRef || "task"}`,
    className: "border-l-4 border-l-blue-500 bg-blue-500/5 pl-2",
  }),
  progress: (msg) => ({ label: `📊 ${msg.content}`, className: "bg-muted/30" }),
  escalation: (msg) => ({
    label: `⚠️ Escalated: ${msg.reason || "unknown"} — ${msg.content}`,
    className: "bg-red-500/10 border border-red-500/20",
  }),
  completion: (msg) => ({
    label: `✅ Completed: ${msg.summary || msg.content}`,
    className: "bg-emerald-500/10 border border-emerald-500/20",
  }),
};
