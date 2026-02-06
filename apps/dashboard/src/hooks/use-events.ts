import { useQuery, useSubscription } from "urql";

import { EVENTS_QUERY } from "../graphql/queries";
import { EVENT_SUBSCRIPTION } from "../graphql/subscriptions";
import { DEFAULT_ORG_ID } from "../lib/constants";

export interface Event {
  id: string;
  type: string;
  actorId: string;
  actor?: { id: string; name: string } | null;
  entityType: string;
  entityId: string;
  severity: string;
  reasoning?: string;
  createdAt: string;
}

export function useEvents(orgId: string = DEFAULT_ORG_ID, limit = 50) {
  const [result, reexecute] = useQuery<{ events: Event[] }>({
    query: EVENTS_QUERY,
    variables: { orgId, limit, page: 1 },
  });

  // Subscribe to new events
  useSubscription<{ eventCreated: Event }>(
    { query: EVENT_SUBSCRIPTION, variables: { orgId } },
    (_prev, data) => {
      reexecute({ requestPolicy: "network-only" });
      return data;
    },
  );

  return {
    events: result.data?.events || [],
    loading: result.fetching,
    error: result.error,
    refetch: () => reexecute({ requestPolicy: "network-only" }),
  };
}
