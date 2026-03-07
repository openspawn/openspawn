import { isDemoMode, isSandboxMode } from "../lib/mode";
import { useAgentsQuery } from "../graphql/generated/hooks";
import { useAgents as useRestAgents } from "../rest/hooks/use-agents";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { AgentType as Agent } from "../graphql/generated/hooks";

const isLiveMode = !isDemoMode && !isSandboxMode;

export function useAgents(orgId: string = DEFAULT_ORG_ID) {
  const rest = useRestAgents({ enabled: isLiveMode });
  const gql = useAgentsQuery({ orgId }, { enabled: !isLiveMode });

  if (!isLiveMode) {
    return {
      agents: gql.data?.agents ?? [],
      loading: gql.isLoading,
      error: gql.error ?? null,
      refetch: gql.refetch,
    };
  }

  return {
    agents: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
