import { useEventsQuery } from "../graphql/generated/hooks";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { EventType as Event } from "../graphql/generated/hooks";

export function useEvents(orgId: string = DEFAULT_ORG_ID, limit = 50) {
  const { data, isLoading, error, refetch } = useEventsQuery({
    orgId,
    limit,
    page: 1,
  });

  return {
    events: data?.events ?? [],
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
