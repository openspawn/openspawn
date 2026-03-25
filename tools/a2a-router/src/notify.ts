// ── Push Notification Delivery ───────────────────────────────────────────────
// Auto-notifies the sender agent when a task transitions to completed/failed.
// Retry with exponential backoff. Fire-and-forget — never blocks task response.

import { createHmac } from "node:crypto";
import { buildResultPayload } from "./bridge.js";
import type { Store } from "./store.js";
import type { AgentCard, Task } from "./types.js";

/** Retry delays in milliseconds: 1s, 5s, 15s */
const RETRY_DELAYS = [1_000, 5_000, 15_000];

/**
 * Compute HMAC-SHA256 signature for defense-in-depth webhook verification.
 * Uses the sender's gateway_token as the HMAC key.
 */
export function computeHmacSignature(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

/**
 * Deliver a webhook notification to the sender's gateway with retries.
 * Returns true if delivered successfully, false otherwise.
 */
export async function deliverWithRetry(
  agent: AgentCard,
  payload: object,
  store: Store,
  taskId: string,
  opts?: { delays?: number[]; fetchFn?: typeof fetch },
): Promise<boolean> {
  const delays = opts?.delays ?? RETRY_DELAYS;
  const maxAttempts = delays.length;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const url = `${agent.gateway_url}${agent.hook_path}`;
    const bodyStr = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (agent.gateway_token) {
      headers["Authorization"] = `Bearer ${agent.gateway_token}`;
      headers["X-A2A-Signature"] = computeHmacSignature(bodyStr, agent.gateway_token);
    }

    try {
      const fetchImpl = opts?.fetchFn ?? fetch;
      const res = await fetchImpl(url, {
        method: "POST",
        headers,
        body: bodyStr,
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        store.logNotification({
          task_id: taskId,
          target_agent_id: agent.agent_id,
          status: "delivered",
          attempt,
          response_status: res.status,
        });
        return true;
      }

      // Non-ok response — log and retry
      const errorBody = await res.text().catch(() => "");
      store.logNotification({
        task_id: taskId,
        target_agent_id: agent.agent_id,
        status: attempt < maxAttempts ? "retrying" : "failed",
        attempt,
        response_status: res.status,
        error: `HTTP ${res.status}: ${errorBody}`.slice(0, 500),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      store.logNotification({
        task_id: taskId,
        target_agent_id: agent.agent_id,
        status: attempt < maxAttempts ? "retrying" : "failed",
        attempt,
        response_status: null,
        error: message.slice(0, 500),
      });
    }

    // Wait before next retry (skip wait after last attempt)
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delays[attempt - 1]));
    }
  }

  return false;
}

/**
 * Notify the sender agent that a task has been completed/failed.
 * Fire-and-forget: call this without awaiting.
 */
export async function notifySender(
  store: Store,
  task: Task,
  opts?: { fetchFn?: typeof fetch; delays?: number[] },
): Promise<void> {
  // Only notify on terminal states
  if (task.status !== "completed" && task.status !== "failed") return;

  const sender = store.getAgent(task.sender_id);
  if (!sender) return;

  const target = store.getAgent(task.target_id);
  const targetName = target?.name ?? task.target_id;
  const payload = buildResultPayload(task, targetName);

  await deliverWithRetry(sender, payload, store, task.id, opts);
}
