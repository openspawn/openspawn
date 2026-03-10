import { useAgents as useRestAgents } from "../rest/hooks/use-agents";
import type { AgentFields } from "../index";

export type Agent = AgentFields;

export function useAgents() {
  const rest = useRestAgents();

  return {
    agents: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
