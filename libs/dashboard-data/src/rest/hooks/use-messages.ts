import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import type { components } from "../generated/schema";

export function useRestMessages(channelId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["messages", channelId ?? "all"],
    queryFn: async () => {
      const { data, error } = await api.GET("/messages", {
        params: { query: channelId ? { channel_id: channelId } : {} },
      });
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useChannelMessages(channelId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["messages", "channel", channelId],
    queryFn: async () => {
      const { data, error } = await api.GET("/messages", {
        params: { query: { channel_id: channelId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!channelId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["SendMessageDto"]) => {
      const { data, error } = await api.POST("/messages", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      if (variables.channel_id) {
        queryClient.invalidateQueries({ queryKey: ["messages", "channel", variables.channel_id] });
      }
      if (variables.parent_message_id) {
        queryClient.invalidateQueries({ queryKey: ["messages", "thread", variables.parent_message_id] });
      }
    },
  });
}

export function useMessageThread(messageId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["messages", "thread", messageId],
    queryFn: async () => {
      const { data, error } = await api.GET("/messages/{message_id}/thread", {
        params: { path: { message_id: messageId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!messageId,
    refetchInterval: 5000,
  });
}

export function useSendDM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["SendDirectMessageDto"]) => {
      const { data, error } = await api.POST("/dm", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dm", variables.recipient_id] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useDMHistory(agentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["dm", agentId],
    queryFn: async () => {
      const { data, error } = await api.GET("/dm/{agent_id}", {
        params: { path: { agent_id: agentId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: (options?.enabled ?? true) && !!agentId,
    refetchInterval: 5000,
  });
}
