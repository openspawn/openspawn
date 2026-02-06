import { useQuery, useSubscription } from "urql";

import { CREDIT_HISTORY_QUERY } from "../graphql/queries";
import { CREDIT_TRANSACTION_SUBSCRIPTION } from "../graphql/subscriptions";
import { DEFAULT_ORG_ID } from "../lib/constants";

export interface CreditTransaction {
  id: string;
  agentId: string;
  type: "earn" | "spend";
  amount: number;
  balanceAfter: number;
  reason: string;
  triggerType?: string;
  sourceTaskId?: string;
  createdAt: string;
}

export function useCredits(
  orgId: string = DEFAULT_ORG_ID,
  agentId?: string,
  limit = 50
) {
  const [result, reexecute] = useQuery<{ creditHistory: CreditTransaction[] }>({
    query: CREDIT_HISTORY_QUERY,
    variables: { orgId, agentId, limit, offset: 0 },
    pause: false, // Always run, even without agentId
  });

  // Subscribe to new transactions
  useSubscription<{ creditTransactionCreated: CreditTransaction }>(
    { query: CREDIT_TRANSACTION_SUBSCRIPTION, variables: { orgId } },
    (_prev, data) => {
      reexecute({ requestPolicy: "network-only" });
      return data;
    },
  );

  return {
    transactions: result.data?.creditHistory || [],
    loading: result.fetching,
    error: result.error,
    refetch: () => reexecute({ requestPolicy: "network-only" }),
  };
}
