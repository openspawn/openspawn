import { z } from "zod";

import type { ApiClient } from "../api-client";

export function registerAgentTools(
  server: {
    tool: (
      name: string,
      description: string,
      schema: z.ZodObject<z.ZodRawShape>,
      handler: (params: Record<string, unknown>) => Promise<unknown>,
    ) => void;
  },
  client: ApiClient,
) {
  server.tool("agent_list", "List all agents in the organization", z.object({}), async () => {
    const result = await client.listAgents();
    return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
  });

  server.tool("agent_whoami", "Get information about the current agent", z.object({}), async () => {
    // For now, return the agent ID from config
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              agentId: process.env["AGENT_ID"],
              message: "Use agent_list to see full details",
            },
            null,
            2,
          ),
        },
      ],
    };
  });
}
