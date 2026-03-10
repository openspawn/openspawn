import { useRestCredits } from "../rest/hooks/use-credits";

export type CreditTransaction = {
  id: string;
  agentId: string;
  amount: number;
  type: string;
  description?: string | null;
  createdAt: string;
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
