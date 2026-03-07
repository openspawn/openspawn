import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useAgents(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
