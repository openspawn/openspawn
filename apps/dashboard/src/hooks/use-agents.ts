import { useQuery } from "urql";

import { AGENTS_QUERY } from "../graphql/queries";
import { DEFAULT_ORG_ID } from "../lib/constants";

export interface Agent {
  id: string;
  agentId: string;
  name: string;
  role: string;
  status: string;
  level: number;
  model: string;
  currentBalance: number;
  budgetPeriodLimit?: number;
  budgetPeriodSpent: number;
  managementFeePct: number;
  createdAt: string;
}

export function useAgents(orgId: string = DEFAULT_ORG_ID) {
  const [result, reexecute] = useQuery<{ agents: Agent[] }>({
    query: AGENTS_QUERY,
    variables: { orgId },
  });

  return {
    agents: result.data?.agents || [],
    loading: result.fetching,
    error: result.error,
    refetch: () => reexecute({ requestPolicy: "network-only" }),
  };
}
