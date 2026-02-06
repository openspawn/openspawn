import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { ApiClient } from "./api-client.js";
import {
  registerAgentTools,
  registerCreditTools,
  registerMessageTools,
  registerTaskTools,
} from "./tools/index.js";

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

  // Register all tools
  registerTaskTools(server, apiClient);
  registerCreditTools(server, apiClient);
  registerMessageTools(server, apiClient);
  registerAgentTools(server, apiClient);

  return server;
}
