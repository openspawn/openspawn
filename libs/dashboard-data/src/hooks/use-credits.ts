import type { CreditTransactionFields } from "@openspawn/shared-types";
import { useRestCredits } from "../rest/hooks/use-credits";

// Derived from shared-types, widening enum field to string for API compat
export type CreditTransaction = Omit<CreditTransactionFields, "type"> & {
  type: string;
};

export function useCredits(_orgId?: string, _agentId?: string, limit = 50) {
  const rest = useRestCredits({ limit });

  const items = rest.data && "items" in rest.data ? rest.data.items : [];
  return {
    transactions: Array.isArray(items) ? items : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
