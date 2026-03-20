import {
  useRestCredits,
  useCreditStats as useRestCreditStats,
  useCreditsByAgent as useRestCreditsByAgent,
  useTopSpenders as useRestTopSpenders,
  useSpendingTrends as useRestSpendingTrends,
  useCreditBalance as useRestCreditBalance,
} from "../rest/hooks/use-credits";

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

export function useCreditStats() {
  const rest = useRestCreditStats();
  return {
    stats: rest.data?.data ?? null,
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useCreditsByAgent() {
  const rest = useRestCreditsByAgent();
  return {
    agents: rest.data?.data ?? [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useTopSpenders(limit?: number) {
  const rest = useRestTopSpenders(limit);
  return {
    spenders: rest.data?.data ?? [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useSpendingTrends(days?: number) {
  const rest = useRestSpendingTrends(days);
  return {
    trends: rest.data?.data ?? [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useCreditBalance() {
  const rest = useRestCreditBalance();
  return {
    balance: rest.data?.data ?? null,
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}
