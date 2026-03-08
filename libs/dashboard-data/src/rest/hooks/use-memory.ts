import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useRestMemories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useRestMemorySearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["memories", "search", query],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory/search", {
        params: { query: { q: query } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!query,
  });
}

export function useRestContradictions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["memories", "contradictions"],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory/contradictions");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
