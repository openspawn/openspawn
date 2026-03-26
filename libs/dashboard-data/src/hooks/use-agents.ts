import { useAgents as useRestAgents } from "../rest/hooks/use-agents";
import type { AgentFields } from "../index";

export type Agent = AgentFields;

export function useAgents() {
  const rest = useRestAgents();

  const rawData = rest.data;
  const agents = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as Record<string, unknown>)?.data)
      ? (rawData as Record<string, unknown>).data as AgentFields[]
      : [];

  return {
    agents,
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
