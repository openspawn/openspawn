import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { ApiClient } from "../api-client.js";

export function registerAgentTools(server: McpServer, client: ApiClient) {
  server.tool("agent_list", "List all agents in the organization", {}, async () => {
    const result = await client.listAgents();
    return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
  });

  server.tool("agent_whoami", "Get information about the current agent", {}, async () => {
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
            2
          ),
        },
      ],
    };
  });
}
