import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents");
      if (error) throw error;
      return data;
    },
  });
}
