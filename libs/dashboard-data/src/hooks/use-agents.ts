import {
  useAgents as useRestAgents,
  useAgent as useRestAgent,
  useAgentReputation as useRestAgentReputation,
  useAgentReputationHistory as useRestAgentReputationHistory,
  useAgentBudget as useRestAgentBudget,
  useAgentCapabilities as useRestAgentCapabilities,
} from "../rest/hooks/use-agents";
import type { AgentFields } from "../index";

export type Agent = AgentFields;

/* Map snake_case API response to camelCase AgentFields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAgent(raw: any): AgentFields {
  if (!raw) return raw;
  return {
    id: raw.id,
    agentId: raw.agent_id ?? raw.agentId ?? "",
    name: raw.name ?? "",
    role: raw.role ?? "",
    mode: raw.mode ?? "",
    status: raw.status ?? "",
    level: raw.level ?? 0,
    model: raw.model ?? "",
    currentBalance: raw.current_balance ?? raw.currentBalance ?? 0,
    budgetPeriodLimit: raw.budget_period_limit ?? raw.budgetPeriodLimit ?? null,
    budgetPeriodSpent: raw.budget_period_spent ?? raw.budgetPeriodSpent ?? 0,
    managementFeePct: raw.management_fee_pct ?? raw.managementFeePct ?? 0,
    parentId: raw.parent_id ?? raw.parentId ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? "",
    updatedAt: raw.updated_at ?? raw.updatedAt ?? "",
    trustScore: raw.trust_score ?? raw.trustScore ?? 50,
    reputationLevel: raw.reputation_level ?? raw.reputationLevel ?? "",
    tasksCompleted: raw.tasks_completed ?? raw.tasksCompleted ?? 0,
    tasksSuccessful: raw.tasks_successful ?? raw.tasksSuccessful ?? 0,
    lastActivityAt: raw.last_activity_at ?? raw.lastActivityAt ?? null,
    lastPromotionAt: raw.last_promotion_at ?? raw.lastPromotionAt ?? null,
    lifetimeEarnings: raw.lifetime_earnings ?? raw.lifetimeEarnings ?? 0,
    defaultAutonomyLevel: raw.default_autonomy_level ?? raw.defaultAutonomyLevel ?? 5,
    domain: raw.domain ?? null,
    teamId: raw.team_id ?? raw.teamId ?? null,
    avatar: raw.avatar ?? null,
    avatarColor: raw.avatar_color ?? raw.avatarColor ?? null,
    avatarUrl: raw.avatar_url ?? raw.avatarUrl ?? null,
  };
}

export function useAgents() {
  const rest = useRestAgents();
  const raw = rest.data?.data ?? rest.data;

  return {
    agents: Array.isArray(raw) ? raw.map(mapAgent) : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useAgent(agentId: string) {
  const rest = useRestAgent(agentId);
  return {
    agent: rest.data?.data ? mapAgent(rest.data.data) : null,
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useAgentReputation(agentId: string) {
  const rest = useRestAgentReputation(agentId);
  return {
    reputation: rest.data?.data ?? null,
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useAgentReputationHistory(agentId: string) {
  const rest = useRestAgentReputationHistory(agentId);
  const raw = rest.data?.data;
  return {
    history: Array.isArray(raw) ? raw : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useAgentBudget(agentId: string) {
  const rest = useRestAgentBudget(agentId);
  return {
    budget: rest.data?.data ?? null,
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useAgentCapabilities(agentId: string) {
  const rest = useRestAgentCapabilities(agentId);
  const raw = rest.data?.data;
  return {
    capabilities: Array.isArray(raw) ? raw : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}
