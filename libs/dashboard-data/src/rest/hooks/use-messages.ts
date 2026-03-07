import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useMessages(channelId?: string) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: async () => {
      const { data, error } = await api.GET("/messages", {
        params: { query: { channel_id: channelId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!channelId,
  });
}
