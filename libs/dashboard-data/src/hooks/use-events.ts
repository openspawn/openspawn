import { isDemoMode, isSandboxMode } from "../lib/mode";
import { useEventsQuery } from "../graphql/generated/hooks";
import { useEvents as useRestEvents } from "../rest/hooks/use-events";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { EventType as Event } from "../graphql/generated/hooks";

const isLiveMode = !isDemoMode && !isSandboxMode;

export function useEvents(orgId: string = DEFAULT_ORG_ID, limit = 50) {
  const rest = useRestEvents({ enabled: isLiveMode });
  const gql = useEventsQuery({ orgId, limit, page: 1 }, { enabled: !isLiveMode });

  if (!isLiveMode) {
    return {
      events: gql.data?.events ?? [],
      loading: gql.isLoading,
      error: gql.error ?? null,
      refetch: gql.refetch,
    };
  }

  return {
    events: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
