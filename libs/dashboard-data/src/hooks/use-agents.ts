import { useAgents as useRestAgents } from "../rest/hooks/use-agents";
import type { AgentFields } from "../index";

export type Agent = AgentFields;

// Map snake_case API response to camelCase AgentFields
function mapAgent(raw: Record<string, unknown>): AgentFields {
  return {
    id: (raw.id as string) ?? "",
    agentId: (raw.agent_id as string) ?? (raw.agentId as string) ?? "",
    name: (raw.name as string) ?? "",
    role: (raw.role as string) ?? "",
    mode: (raw.mode as string) ?? "",
    status: (raw.status as string) ?? "",
    level: (raw.level as number) ?? 1,
    model: (raw.model as string) ?? "",
    currentBalance: (raw.current_balance as number) ?? (raw.currentBalance as number) ?? 0,
    budgetPeriodLimit: (raw.budget_period_limit as number | null) ?? (raw.budgetPeriodLimit as number | null) ?? null,
    budgetPeriodSpent: (raw.budget_period_spent as number) ?? (raw.budgetPeriodSpent as number) ?? 0,
    managementFeePct: (raw.management_fee_pct as number) ?? (raw.managementFeePct as number) ?? 0,
    parentId: (raw.parent_id as string | null) ?? (raw.parentId as string | null) ?? null,
    createdAt: (raw.created_at as string) ?? (raw.createdAt as string) ?? "",
    updatedAt: (raw.updated_at as string) ?? (raw.updatedAt as string) ?? "",
    trustScore: (raw.trust_score as number) ?? (raw.trustScore as number) ?? 0,
    reputationLevel: (raw.reputation_level as string) ?? (raw.reputationLevel as string) ?? "",
    tasksCompleted: (raw.tasks_completed as number) ?? (raw.tasksCompleted as number) ?? 0,
    tasksSuccessful: (raw.tasks_successful as number) ?? (raw.tasksSuccessful as number) ?? 0,
    lastActivityAt: (raw.last_activity_at as string | null) ?? (raw.lastActivityAt as string | null) ?? null,
    lastPromotionAt: (raw.last_promotion_at as string | null) ?? (raw.lastPromotionAt as string | null) ?? null,
    lifetimeEarnings: (raw.lifetime_earnings as number) ?? (raw.lifetimeEarnings as number) ?? 0,
    defaultAutonomyLevel: (raw.default_autonomy_level as number) ?? (raw.defaultAutonomyLevel as number) ?? 0,
    domain: (raw.domain as string | null) ?? null,
    teamId: (raw.team_id as string | null) ?? (raw.teamId as string | null) ?? null,
    avatar: (raw.avatar as string | null) ?? null,
    avatarColor: (raw.avatar_color as string | null) ?? (raw.avatarColor as string | null) ?? null,
    avatarUrl: (raw.avatar_url as string | null) ?? (raw.avatarUrl as string | null) ?? null,
  };
}

export function useAgents() {
  const rest = useRestAgents();

  const rawData = rest.data;
  const rawArray = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as Record<string, unknown>)?.data)
      ? (rawData as Record<string, unknown>).data as Record<string, unknown>[]
      : [];

  const agents = rawArray.map(mapAgent);

  return {
    agents,
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
