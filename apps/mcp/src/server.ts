import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";

import { ApiClient } from "./api-client";
import {
  registerAgentTools,
  registerCreditTools,
  registerMessageTools,
  registerTaskTools,
} from "./tools";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "openspawn",
    version: "1.0.0",
  });

  // Create API client from environment
  const apiClient = new ApiClient({
    baseUrl: process.env["API_URL"] || "http://localhost:3000",
    agentId: process.env["AGENT_ID"] || "",
    secret: process.env["AGENT_SECRET"] || "",
  });

  // Create a wrapper that matches the expected interface
  const toolRegistry = {
    tool: (
      name: string,
      description: string,
      schema: z.ZodObject<z.ZodRawShape>,
      handler: (params: Record<string, unknown>) => Promise<unknown>,
    ) => {
      server.tool(name, description, schema.shape, handler);
    },
  };

  // Register all tools
  registerTaskTools(toolRegistry, apiClient);
  registerCreditTools(toolRegistry, apiClient);
  registerMessageTools(toolRegistry, apiClient);
  registerAgentTools(toolRegistry, apiClient);

  return server;
}
