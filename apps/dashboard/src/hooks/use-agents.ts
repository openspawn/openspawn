import { useAgentsQuery } from "../graphql/generated/hooks";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { AgentType as Agent } from "../graphql/generated/hooks";

export function useAgents(orgId: string = DEFAULT_ORG_ID) {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useAgentsQuery({ orgId });

  // Debug logging
  console.log('[useAgents] status:', { 
    isLoading, 
    isFetching, 
    agentCount: data?.agents?.length ?? 0,
    error: error?.message,
    dataUpdatedAt: new Date(dataUpdatedAt).toISOString(),
  });

  return {
    agents: data?.agents ?? [],
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
