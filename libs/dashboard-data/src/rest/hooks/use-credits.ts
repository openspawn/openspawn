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
