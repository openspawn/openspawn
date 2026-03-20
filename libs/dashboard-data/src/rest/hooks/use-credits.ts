import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useCreditHistory(agentId: string) {
  return useQuery({
    queryKey: ["credits", agentId],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents/{agent_id}/credits/balance", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });
}

export function useRestCredits(options?: { enabled?: boolean; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["credits", "history", options?.limit ?? 50, options?.offset ?? 0],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/history", {
        params: { query: { limit: options?.limit ?? 50, offset: options?.offset ?? 0 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreditStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["credits", "stats"],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/analytics/stats");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreditsByAgent(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["credits", "by-agent"],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/analytics/agents");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useTopSpenders(limit?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["credits", "top-spenders", limit ?? 10],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/analytics/top-spenders", {
        params: { query: { limit: limit ?? 10 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useSpendingTrends(days?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["credits", "trends", days ?? 30],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/analytics/trends", {
        params: { query: { days: days ?? 30 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCreditBalance(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["credits", "balance"],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/balance");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
