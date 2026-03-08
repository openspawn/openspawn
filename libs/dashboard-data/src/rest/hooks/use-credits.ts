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

export function useRestCredits(options?: { enabled?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ["credits", "history", options?.limit ?? 50],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits/history", {
        params: { query: { limit: options?.limit ?? 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
