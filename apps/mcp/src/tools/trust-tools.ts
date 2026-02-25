import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { ApiClient } from "../api-client";

export function registerTrustTools(server: McpServer, client: ApiClient) {
  // Get agent reputation
  server.tool(
    "trust_get_reputation",
    "Get trust score and reputation details for an agent",
    {
      agentId: z.string().describe("The agent ID to get reputation for"),
    },
    async ({ agentId }) => {
      const result = await client.getAgentReputation(agentId);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Get reputation history
  server.tool(
    "trust_get_history",
    "Get reputation change history for an agent",
    {
      agentId: z.string().describe("The agent ID"),
      limit: z.number().optional().describe("Max events to return (default 20)"),
    },
    async ({ agentId, limit }) => {
      const result = await client.getReputationHistory(agentId, limit);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Get trust leaderboard
  server.tool(
    "trust_leaderboard",
    "Get top agents ranked by trust score",
    {
      limit: z.number().optional().describe("Number of agents to return (default 10)"),
    },
    async ({ limit }) => {
      const result = await client.getTrustLeaderboard(limit);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Apply reputation bonus (requires HR role)
  server.tool(
    "trust_bonus",
    "Award a reputation bonus to an agent (requires HR role)",
    {
      agentId: z.string().describe("The agent ID to reward"),
      amount: z.number().min(1).max(20).describe("Bonus amount (1-20)"),
      reason: z.string().describe("Reason for the bonus"),
    },
    async ({ agentId, amount, reason }) => {
      const result = await client.applyReputationBonus(agentId, amount, reason);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Apply reputation penalty (requires HR role)
  server.tool(
    "trust_penalty",
    "Apply a reputation penalty to an agent (requires HR role)",
    {
      agentId: z.string().describe("The agent ID to penalize"),
      amount: z.number().min(1).max(20).describe("Penalty amount (1-20)"),
      reason: z.string().describe("Reason for the penalty"),
    },
    async ({ agentId, amount, reason }) => {
      const result = await client.applyReputationPenalty(agentId, amount, reason);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );
}
