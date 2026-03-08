import { isDemoMode, isSandboxMode } from "../lib/mode";
import { useCreditHistoryQuery } from "../graphql/generated/hooks";
import { useRestCredits } from "../rest/hooks/use-credits";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { CreditTransactionType as CreditTransaction } from "../graphql/generated/hooks";

const isLiveMode = !isDemoMode && !isSandboxMode;

export function useCredits(orgId: string = DEFAULT_ORG_ID, agentId?: string, limit = 50) {
  const rest = useRestCredits({ enabled: isLiveMode, limit });
  const gql = useCreditHistoryQuery({ orgId, agentId, limit, offset: 0 }, { enabled: !isLiveMode });

  if (!isLiveMode) {
    return {
      transactions: gql.data?.creditHistory ?? [],
      loading: gql.isLoading,
      error: gql.error ?? null,
      refetch: gql.refetch,
    };
  }

  const items = rest.data && "items" in rest.data ? rest.data.items : [];
  return {
    transactions: Array.isArray(items) ? items : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
