import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
        params: { query: { query } },
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

export function useMemoryList(params?: {
  agent_id?: string | null;
  type?: string | null;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["memory", "list", params],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory", {
        params: {
          query: {
            agent_id: params?.agent_id ?? undefined,
            type: params?.type ?? undefined,
            limit: params?.limit ?? 20,
            offset: params?.offset ?? 0,
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMemoryFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memoryId, helpful }: { memoryId: string; helpful: boolean }) => {
      const { data, error } = await api.POST("/memory/{memory_id}/feedback", {
        params: { path: { memory_id: memoryId } },
        body: { helpful },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memory"] });
      qc.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}
