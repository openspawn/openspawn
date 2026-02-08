import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { ApiClient } from "../api-client.js";

export function registerEscalationTools(server: McpServer, client: ApiClient) {
  // Create escalation
  server.tool(
    "escalation_create",
    "Escalate a task to a higher-level agent",
    {
      taskId: z.string().describe("The task ID to escalate"),
      reason: z.string().describe("Reason for escalation (e.g., 'blocked', 'needs_approval', 'out_of_scope')"),
      targetAgentId: z.string().describe("Agent ID to escalate to (must be higher level)"),
    },
    async ({ taskId, reason, targetAgentId }) => {
      const result = await client.createEscalation(taskId, reason, targetAgentId);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // List escalations
  server.tool(
    "escalation_list",
    "List escalations, optionally filtered by task",
    {
      taskId: z.string().optional().describe("Filter by task ID"),
    },
    async ({ taskId }) => {
      const result = await client.getEscalations(taskId);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Resolve escalation
  server.tool(
    "escalation_resolve",
    "Resolve an escalation with a resolution note",
    {
      escalationId: z.string().describe("The escalation ID to resolve"),
      resolution: z.string().describe("How the escalation was resolved"),
    },
    async ({ escalationId, resolution }) => {
      const result = await client.resolveEscalation(escalationId, resolution);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Request consensus
  server.tool(
    "consensus_request",
    "Request a consensus vote from multiple agents",
    {
      taskId: z.string().describe("The task ID requiring consensus"),
      question: z.string().describe("The question to vote on"),
      voterIds: z.array(z.string()).describe("List of agent IDs who should vote"),
    },
    async ({ taskId, question, voterIds }) => {
      const result = await client.requestConsensus(taskId, question, voterIds);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Submit vote
  server.tool(
    "consensus_vote",
    "Submit your vote on a consensus request",
    {
      consensusId: z.string().describe("The consensus request ID"),
      vote: z.enum(["approve", "reject"]).describe("Your vote"),
      reason: z.string().optional().describe("Optional reason for your vote"),
    },
    async ({ consensusId, vote, reason }) => {
      const result = await client.submitVote(consensusId, vote, reason);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );

  // Get consensus status
  server.tool(
    "consensus_status",
    "Check the status of a consensus request",
    {
      consensusId: z.string().describe("The consensus request ID"),
    },
    async ({ consensusId }) => {
      const result = await client.getConsensusStatus(consensusId);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    }
  );
}
