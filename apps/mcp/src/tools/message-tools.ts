import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { ApiClient } from "../api-client";

export function registerMessageTools(server: McpServer, client: ApiClient) {
  server.tool("message_channels", "List available messaging channels", {}, async () => {
    const result = await client.listChannels();
    return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
  });

  server.tool(
    "message_send",
    "Send a message to a channel",
    {
      channelId: z.string().describe("Channel ID"),
      body: z.string().describe("Message content"),
      type: z.enum(["text", "handoff", "status_update", "request"]).default("text"),
    },
    async (params) => {
      const result = await client.sendMessage(
        params.channelId,
        params.body,
        params.type
      );
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  server.tool(
    "message_read",
    "Read messages from a channel",
    {
      channelId: z.string().describe("Channel ID"),
      limit: z.number().int().positive().default(50).describe("Number of messages"),
    },
    async (params) => {
      const result = await client.getMessages(params.channelId, params.limit);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );
}
