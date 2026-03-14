import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import type { components } from "../generated/schema";

type UpdateAgentBody = components["schemas"]["UpdateAgentDto"];
type SpawnAgentBody = components["schemas"]["SpawnAgentDto"];
type TransferCreditsBody = components["schemas"]["TransferCreditsDto"];
type SetBudgetBody = components["schemas"]["SetBudgetDto"];

export function useUpdateAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateAgentBody) => {
      const { data, error } = await api.PATCH("/agents/{agent_id}", {
        params: { path: { agent_id: agentId } },
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useActivateAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/agents/{agent_id}/activate", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useRevokeAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/agents/{agent_id}/revoke", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useSpawnAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SpawnAgentBody) => {
      const { data, error } = await api.POST("/agents/spawn", {
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useTransferCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransferCreditsBody) => {
      const { data, error } = await api.POST("/agents/credits/transfer", {
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useSetBudget(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SetBudgetBody) => {
      const { data, error } = await api.PATCH("/agents/{agent_id}/budget", {
        params: { path: { agent_id: agentId } },
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
