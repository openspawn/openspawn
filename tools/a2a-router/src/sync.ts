// ── API Sync Module ──────────────────────────────────────────────────────────
// Fire-and-forget bridge: pushes A2A router events to the OpenSpawn API
// (api.openspawn.ai) so they appear on the team dashboard.
//
// Design: best-effort, non-blocking. Errors are logged but never thrown.
// When OPENSPAWN_SYNC_ENABLED is falsy, every method is a silent no-op.

import type { Store } from "./store.js";
import type { AgentCard, Task } from "./types.js";

// ── Config ──────────────────────────────────────────────────────────────────

const API_URL = process.env.OPENSPAWN_API_URL || "https://api.openspawn.ai";
const API_TOKEN = process.env.OPENSPAWN_API_TOKEN || "owner-static-token-local-dev";
const SYNC_ENABLED = ["true", "1", "yes"].includes(
  (process.env.OPENSPAWN_SYNC_ENABLED ?? "").toLowerCase(),
);

// ── Status mapping ──────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  submitted: "backlog",
  working: "in_progress",
  completed: "done",
  failed: "cancelled",
  canceled: "cancelled",
};

function mapStatus(a2aStatus: string): string {
  return STATUS_MAP[a2aStatus] ?? "backlog";
}

// ── HTTP helper ─────────────────────────────────────────────────────────────

type FetchFn = typeof globalThis.fetch;

async function post(
  path: string,
  body: Record<string, unknown>,
  fetchImpl: FetchFn = globalThis.fetch,
): Promise<void> {
  try {
    const url = `${API_URL}${path}`;
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[sync] POST ${path} → ${res.status}: ${text.slice(0, 200)}`);
    } else {
      console.log(`[sync] POST ${path} → ${res.status} OK`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[sync] POST ${path} failed: ${msg}`);
  }
}

// ── Sync functions ──────────────────────────────────────────────────────────

export async function syncAgentRegistered(
  agent: AgentCard,
  fetchImpl?: FetchFn,
): Promise<void> {
  if (!SYNC_ENABLED) return;

  await post(
    "/agents/register",
    {
      agent_id: agent.agent_id,
      name: agent.name,
      level: 1,
      role: "worker",
      status: "active",
      model: "unknown",
      mode: "worker",
    },
    fetchImpl,
  );
}

export async function syncTaskCreated(
  task: Task,
  fetchImpl?: FetchFn,
): Promise<void> {
  if (!SYNC_ENABLED) return;

  await post(
    "/tasks",
    {
      title: task.message.slice(0, 500),
      description: task.message,
      priority: "normal",
      assignee_id: null, // API uses UUID; we can't map string agent_id directly
      status: mapStatus(task.status),
      metadata: {
        a2a_task_id: task.id,
        a2a_sender_id: task.sender_id,
        a2a_target_id: task.target_id,
      },
    },
    fetchImpl,
  );
}

export async function syncTaskTransition(
  taskId: string,
  newStatus: string,
  result?: string | null,
  fetchImpl?: FetchFn,
): Promise<void> {
  if (!SYNC_ENABLED) return;

  const apiStatus = mapStatus(newStatus);
  // The API transition endpoint uses task UUID — but we only know A2A IDs.
  // We POST to /tasks with metadata for now; the API side can reconcile.
  // If we had the API task UUID we'd call /tasks/{uuid}/transition.
  // For now, log the transition intent.
  await post(
    "/tasks/sync-transition",
    {
      a2a_task_id: taskId,
      status: apiStatus,
      reason: result ?? undefined,
    },
    fetchImpl,
  );
}

// ── Wiring ──────────────────────────────────────────────────────────────────

/**
 * Initialize sync listeners on the store's event bus.
 * Call once at startup. All listeners are fire-and-forget.
 */
export function initSync(store: Store, fetchImpl?: FetchFn): void {
  if (!SYNC_ENABLED) {
    console.log("[sync] Sync disabled (OPENSPAWN_SYNC_ENABLED is not set)");
    return;
  }

  console.log(`[sync] Sync enabled → ${API_URL}`);

  // Listen to all task events from the event bus
  store.events.on("task-status", (data: { taskId: string; status: string; result?: string | null }) => {
    syncTaskTransition(data.taskId, data.status, data.result, fetchImpl).catch((_err) => { /* fire-and-forget */ });
  });

  store.events.on("task-created", (data: { task: Task }) => {
    syncTaskCreated(data.task, fetchImpl).catch((_err) => { /* fire-and-forget */ });
  });

  store.events.on("agent-registered", (data: { agent: AgentCard }) => {
    syncAgentRegistered(data.agent, fetchImpl).catch((_err) => { /* fire-and-forget */ });
  });
}

// ── Exports for testing ─────────────────────────────────────────────────────

export { SYNC_ENABLED, API_URL, API_TOKEN, STATUS_MAP, mapStatus, post };
