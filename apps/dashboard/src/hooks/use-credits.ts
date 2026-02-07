import { useCreditHistoryQuery } from "../graphql/generated/hooks";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { CreditTransactionType as CreditTransaction } from "../graphql/generated/hooks";

export function useCredits(
  orgId: string = DEFAULT_ORG_ID,
  agentId?: string,
  limit = 50
) {
  const { data, isLoading, error, refetch } = useCreditHistoryQuery({
    orgId,
    agentId,
    limit,
    offset: 0,
  });

  return {
    transactions: data?.creditHistory ?? [],
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
