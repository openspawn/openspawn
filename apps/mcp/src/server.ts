import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { ApiClient } from "./api-client.js";
import {
  registerAgentTools,
  registerCreditTools,
  registerEscalationTools,
  registerMessageTools,
  registerTaskTools,
  registerTrustTools,
} from "./tools/index.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "openspawn",
    version: "1.0.0",
  });

  // Get config from environment (support both OPENSPAWN_ and plain prefixes)
  const baseUrl = process.env["OPENSPAWN_API_URL"] || process.env["API_URL"] || "http://localhost:3000";
  const apiKey = process.env["OPENSPAWN_API_KEY"];
  const agentId = process.env["OPENSPAWN_AGENT_ID"] || process.env["AGENT_ID"];
  const secret = process.env["OPENSPAWN_AGENT_SECRET"] || process.env["AGENT_SECRET"];

  // Create API client - prefer API key if available, fall back to HMAC
  const apiClient = apiKey
    ? new ApiClient({ baseUrl, apiKey })
    : new ApiClient({ baseUrl, agentId: agentId || "", secret: secret || "" });

  // Register all tools
  registerTaskTools(server, apiClient);
  registerCreditTools(server, apiClient);
  registerMessageTools(server, apiClient);
  registerAgentTools(server, apiClient);
  registerTrustTools(server, apiClient);
  registerEscalationTools(server, apiClient);

  return server;
}
