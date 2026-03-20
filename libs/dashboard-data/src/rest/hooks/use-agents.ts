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

export function useAgent(agentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents/{agent_id}", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!agentId,
  });
}

export function useAgentReputation(agentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agent", agentId, "reputation"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents/{agent_id}/reputation", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!agentId,
  });
}

export function useAgentReputationHistory(agentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agent", agentId, "reputation", "history"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents/{agent_id}/reputation/history", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!agentId,
  });
}

export function useAgentBudget(agentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agent", agentId, "budget"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents/{agent_id}/budget", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!agentId,
  });
}

export function useAgentCapabilities(agentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["agent", agentId, "capabilities"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents/{agent_id}/capabilities", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!agentId,
  });
}
