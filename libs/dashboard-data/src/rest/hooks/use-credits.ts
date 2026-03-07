import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useCreditHistory() {
  return useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data, error } = await api.GET("/credits");
      if (error) throw error;
      return data;
    },
  });
}
