import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await api.GET("/channels");
      if (error) throw error;
      return data;
    },
  });
}
