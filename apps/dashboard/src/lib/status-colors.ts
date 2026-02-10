import { AgentStatus } from "../graphql/generated/graphql";

/**
 * Shared status → badge variant mapping for agent statuses.
 * Used by agents page, agent detail panel, and anywhere agent status badges appear.
 *
 * Semantic colors:
 *   active  → success (emerald)
 *   pending → warning (amber)
 *   suspended/revoked → destructive (rose)
 *   default → secondary (slate)
 */
export function getStatusVariant(
  status: AgentStatus,
): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case AgentStatus.Active:
      return "success";
    case AgentStatus.Pending:
      return "warning";
    case AgentStatus.Suspended:
    case AgentStatus.Revoked:
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * Level colors matching network page — maps agent level → hex color.
 */
export const levelColors: Record<number, string> = {
  10: "#f472b6", // COO - pink
  9: "#a78bfa", // HR - purple
  8: "#22c55e", // Manager - green
  7: "#22c55e",
  6: "#06b6d4", // Senior - cyan
  5: "#06b6d4",
  4: "#fbbf24", // Worker - yellow
  3: "#fbbf24",
  2: "#71717a", // Probation - gray
  1: "#71717a",
};

export function getLevelColor(level: number): string {
  return levelColors[level] || "#71717a";
}

export function getLevelLabel(level: number): string {
  if (level >= 10) return "COO";
  if (level >= 9) return "HR";
  if (level >= 7) return "Manager";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Worker";
  return "Probation";
}
