import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await api.GET("/events");
      if (error) throw error;
      return data;
    },
  });
}
