import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await api.GET("/integrations/webhooks");
      if (error) throw error;
      return data;
    },
  });
}

export function useWebhook(webhookId: string) {
  return useQuery({
    queryKey: ["webhooks", webhookId],
    queryFn: async () => {
      const { data, error } = await api.GET("/integrations/webhooks/{webhook_id}", {
        params: { path: { webhook_id: webhookId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!webhookId,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { url: string; events: string[] }) => {
      const { data, error } = await api.POST("/integrations/webhooks", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await api.DELETE("/integrations/webhooks/{webhook_id}", {
        params: { path: { webhook_id: webhookId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}
