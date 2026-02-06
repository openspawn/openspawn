import { useQuery, useSubscription } from "urql";

import { CREDIT_HISTORY_QUERY } from "../graphql/queries";
import { CREDIT_TRANSACTION_SUBSCRIPTION } from "../graphql/subscriptions";

export interface CreditTransaction {
  id: string;
  agentId: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  reason: string;
  triggerType?: string;
  sourceTaskId?: string;
  createdAt: string;
}

export function useCredits(orgId: string, agentId: string, limit = 50) {
  const [result, reexecute] = useQuery<{ creditHistory: CreditTransaction[] }>({
    query: CREDIT_HISTORY_QUERY,
    variables: { orgId, agentId, limit, offset: 0 },
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
