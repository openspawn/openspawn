// ── Sync Module Tests ────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Store } from "../store.js";
import {
  syncAgentRegistered,
  syncTaskCreated,
  syncTaskTransition,
  initSync,
  mapStatus,
} from "../sync.js";
import type { AgentCard, Task } from "../types.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function mockFetch(status = 200, body = "OK"): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  });
}

const testAgent: AgentCard = {
  agent_id: "test-agent",
  name: "Test Agent",
  skills: ["code"],
  gateway_url: "http://localhost:9999",
  hook_path: "/hooks/agent",
};

const testTask: Task = {
  id: "task-123",
  sender_id: "agent-a",
  target_id: "agent-b",
  message: "Do something useful",
  status: "submitted",
  result: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ── Status Mapping ──────────────────────────────────────────────────────────

describe("mapStatus", () => {
  it("maps A2A statuses to API statuses", () => {
    expect(mapStatus("submitted")).toBe("backlog");
    expect(mapStatus("working")).toBe("in_progress");
    expect(mapStatus("completed")).toBe("done");
    expect(mapStatus("failed")).toBe("cancelled");
    expect(mapStatus("canceled")).toBe("cancelled");
  });

  it("defaults unknown statuses to backlog", () => {
    expect(mapStatus("unknown")).toBe("backlog");
  });
});

// ── Sync Functions (with SYNC_ENABLED) ──────────────────────────────────────

describe("sync functions", () => {
  // We need to test with SYNC_ENABLED=true. The module reads env at import
  // time, so we test the internal functions by passing fetchImpl directly
  // and checking the calls. When SYNC_ENABLED is false, they're no-ops.

  describe("when sync is disabled (default)", () => {
    it("syncAgentRegistered is a no-op", async () => {
      const fetch = mockFetch();
      await syncAgentRegistered(testAgent, fetch as unknown as typeof globalThis.fetch);
      // SYNC_ENABLED is false in test env, so fetch should NOT be called
      expect(fetch).not.toHaveBeenCalled();
    });

    it("syncTaskCreated is a no-op", async () => {
      const fetch = mockFetch();
      await syncTaskCreated(testTask, fetch as unknown as typeof globalThis.fetch);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("syncTaskTransition is a no-op", async () => {
      const fetch = mockFetch();
      await syncTaskTransition("task-123", "completed", "done!", fetch as unknown as typeof globalThis.fetch);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});

// ── initSync wiring ─────────────────────────────────────────────────────────

describe("initSync", () => {
  let store: Store;

  beforeEach(() => {
    store = new Store(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  it("does not throw when sync is disabled", () => {
    expect(() => initSync(store)).not.toThrow();
  });

  it("registers event listeners on the store event bus", () => {
    // Even though SYNC_ENABLED=false, initSync should not crash
    initSync(store);

    // The events are registered on store.events — check they exist
    // When disabled, no listeners should be added
    const taskStatusListeners = store.events.listenerCount("task-status");
    const taskCreatedListeners = store.events.listenerCount("task-created");
    const agentRegisteredListeners = store.events.listenerCount("agent-registered");

    // With SYNC_ENABLED=false, no listeners should be added
    expect(taskStatusListeners).toBe(0);
    expect(taskCreatedListeners).toBe(0);
    expect(agentRegisteredListeners).toBe(0);
  });
});

// ── Store event emissions ───────────────────────────────────────────────────

describe("Store event emissions", () => {
  let store: Store;

  beforeEach(() => {
    store = new Store(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  it("emits agent-registered when an agent is registered", () => {
    const listener = vi.fn();
    store.events.on("agent-registered", listener);

    store.registerAgent({
      agent_id: "test-agent",
      name: "Test Agent",
      skills: [],
      gateway_url: "http://localhost:9999",
      hook_path: "/hooks/agent",
    });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].agent.agent_id).toBe("test-agent");
  });

  it("emits task-created when a task is created (legacy)", () => {
    const listener = vi.fn();
    store.events.on("task-created", listener);

    // Need agents first
    store.registerAgent({
      agent_id: "sender",
      name: "Sender",
      skills: [],
      gateway_url: "http://localhost:1",
      hook_path: "/hooks/agent",
    });
    store.registerAgent({
      agent_id: "target",
      name: "Target",
      skills: [],
      gateway_url: "http://localhost:2",
      hook_path: "/hooks/agent",
    });

    store.createTask("sender", "target", "Do something");

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].task.sender_id).toBe("sender");
    expect(listener.mock.calls[0][0].task.target_id).toBe("target");
  });

  it("emits task-status when task status is updated", () => {
    const listener = vi.fn();
    store.events.on("task-status", listener);

    store.registerAgent({
      agent_id: "sender",
      name: "Sender",
      skills: [],
      gateway_url: "http://localhost:1",
      hook_path: "/hooks/agent",
    });
    store.registerAgent({
      agent_id: "target",
      name: "Target",
      skills: [],
      gateway_url: "http://localhost:2",
      hook_path: "/hooks/agent",
    });

    const task = store.createTask("sender", "target", "Do something");
    store.updateTaskStatus(task.id, "completed", "All done");

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toEqual({
      taskId: task.id,
      status: "completed",
      result: "All done",
    });
  });

  it("emits task-created for A2A tasks", () => {
    const listener = vi.fn();
    store.events.on("task-created", listener);

    store.registerAgent({
      agent_id: "sender",
      name: "Sender",
      skills: [],
      gateway_url: "http://localhost:1",
      hook_path: "/hooks/agent",
    });
    store.registerAgent({
      agent_id: "target",
      name: "Target",
      skills: [],
      gateway_url: "http://localhost:2",
      hook_path: "/hooks/agent",
    });

    store.createA2ATask("sender", "target", {
      role: "user",
      parts: [{ kind: "text" as const, text: "A2A task" }],
    });

    expect(listener).toHaveBeenCalled();
  });

  it("emits task-status for A2A task status updates", () => {
    const listener = vi.fn();
    store.events.on("task-status", listener);

    store.registerAgent({
      agent_id: "sender",
      name: "Sender",
      skills: [],
      gateway_url: "http://localhost:1",
      hook_path: "/hooks/agent",
    });
    store.registerAgent({
      agent_id: "target",
      name: "Target",
      skills: [],
      gateway_url: "http://localhost:2",
      hook_path: "/hooks/agent",
    });

    const task = store.createA2ATask("sender", "target", {
      role: "user",
      parts: [{ kind: "text" as const, text: "A2A task" }],
    });

    store.updateA2ATaskStatus(task.id, "completed", "Done");

    expect(listener).toHaveBeenCalled();
    const call = listener.mock.calls.find(
      (c: Array<{ status: string }>) => c[0].status === "completed",
    );
    expect(call).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(call![0].taskId).toBe(task.id);
  });
});
