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

export function useAgents() {
  const rest = useRestAgents();

  return {
    agents: Array.isArray(rest.data?.data) ? rest.data.data : Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useAgent(agentId: string) {
  const rest = useRestAgent(agentId);
  return {
    agent: rest.data?.data ?? null,
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
