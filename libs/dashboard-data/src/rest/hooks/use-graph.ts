import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useRestGraphEntities(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["graph", "entities"],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory/graph/entities");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useRestGraphRelationships(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["graph", "relationships"],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory/graph/relationships");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useRestGraphCytoscape(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["graph", "cytoscape"],
    queryFn: async () => {
      const { data, error } = await api.GET("/memory/graph/cytoscape");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
