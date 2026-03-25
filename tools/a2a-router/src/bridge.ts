// ── OpenClaw Hook Bridge ─────────────────────────────────────────────────────
// Translates A2A messages into OpenClaw gateway hook payloads and POSTs them.

import type { AgentCard, Task } from "./types.js";

export interface HookPayload {
  message: string;
  agentId: string;
}

/**
 * Build the hook payload for delivering a task to an agent.
 */
export function buildTaskPayload(task: Task): HookPayload {
  return {
    message: `[a2a:task:${task.id}]\n\n${task.message}`,
    agentId: "main",
  };
}

/**
 * Build the hook payload for notifying the sender that a task completed.
 */
export function buildResultPayload(task: Task, targetName: string): HookPayload {
  const statusLine = task.status === "completed"
    ? `Task completed by ${targetName}`
    : `Task failed by ${targetName}`;
  const resultText = task.result ? `:\n${task.result}` : "";
  return {
    message: `[a2a:result:${task.id}]\n\n${statusLine}${resultText}`,
    agentId: "main",
  };
}

/**
 * POST a hook payload to an agent's OpenClaw gateway.
 */
export async function deliverHook(agent: AgentCard, payload: HookPayload): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${agent.gateway_url}${agent.hook_path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (agent.gateway_token) {
    headers["Authorization"] = `Bearer ${agent.gateway_token}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, body: `Connection failed: ${message}` };
  }
}
