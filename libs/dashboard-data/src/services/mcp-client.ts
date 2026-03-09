/**
 * MCP Coordination Client — thin wrapper for calling the MCP coordinator server.
 * Falls back gracefully when the server isn't available.
 */

const MCP_URL = import.meta.env.VITE_MCP_URL || "/mcp";

export interface McpResponse {
  result?: { content?: Array<{ type: string; text: string }> };
  error?: { code: number; message: string };
}

export class McpError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message);
    this.name = "McpError";
  }
}

export async function mcpCall<T = unknown>(
  tool: string,
  params: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: tool, arguments: params },
      }),
    });
  } catch {
    throw new McpError("MCP server not reachable");
  }

  if (!res.ok) {
    throw new McpError(`MCP HTTP ${res.status}`, res.status);
  }

  const json: McpResponse = await res.json();
  if (json.error) {
    throw new McpError(json.error.message, json.error.code);
  }

  // MCP tools/call returns content array — parse the first text block as JSON
  const text = json.result?.content?.[0]?.text;
  if (text) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
  return json.result as unknown as T;
}

// ── Typed wrappers ──────────────────────────────────────────────────────

export const taskList = (opts?: { status?: string }) => mcpCall("task_list", opts || {});

export const taskCreate = (title: string, opts?: Record<string, unknown>) =>
  mcpCall("task_create", { title, ...opts });

export const taskClaim = (taskId: string, agentId: string) =>
  mcpCall("task_claim", { task_id: taskId, agent_id: agentId });

export const taskComplete = (taskId: string, result: string) =>
  mcpCall("task_complete", { task_id: taskId, result });

export const agentList = () => mcpCall("agent_list", {});

export const agentRegister = (agent: {
  id: string;
  name: string;
  role: string;
  level?: string;
  department?: string;
  model?: string;
}) => mcpCall("agent_register", agent);

export const agentUpdateStatus = (id: string, status: string) =>
  mcpCall("agent_update_status", { agent_id: id, status });

export const agentFire = (id: string) => mcpCall("agent_fire", { agent_id: id });

export const orgStatus = () => mcpCall("org_status", {});

export const eventList = (opts?: { agent_id?: string }) => mcpCall("event_list", opts || {});

export const escalate = (issue: string, severity?: string) =>
  mcpCall("escalation_create", { issue, severity: severity || "medium" });
