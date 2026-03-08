import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

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
