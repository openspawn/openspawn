import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeHmacSignature, deliverWithRetry, notifySender } from "../notify.js";
import { Store } from "../store.js";
import type { AgentCard, Task } from "../types.js";
import { createHmac } from "node:crypto";

const TEST_DB = ":memory:";

function makeStore(): Store {
  return new Store(TEST_DB);
}

function makeAgent(overrides?: Partial<AgentCard>): AgentCard {
  return {
    agent_id: "dennis",
    name: "Agent Dennis",
    skills: ["coding"],
    gateway_url: "https://gw.example.com",
    gateway_token: "secret-token-123",
    hook_path: "/hooks/agent",
    ...overrides,
  };
}

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: "task-001",
    sender_id: "dennis",
    target_id: "drinkify",
    message: "Deploy staging",
    status: "completed",
    result: "Deployed successfully",
    created_at: "2026-03-25T12:00:00",
    updated_at: "2026-03-25T12:05:00",
    ...overrides,
  };
}

function mockFetchOk(): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve("OK"),
  }) as unknown as typeof fetch;
}

function mockFetchFail(status = 500): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve("Internal Server Error"),
  }) as unknown as typeof fetch;
}

describe("notify", () => {
  let store: Store;

  beforeEach(() => {
    store = makeStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    store.close();
    vi.useRealTimers();
  });

  describe("computeHmacSignature", () => {
    it("produces valid HMAC-SHA256 signature", () => {
      const body = '{"message":"hello"}';
      const secret = "my-secret";
      const sig = computeHmacSignature(body, secret);

      const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
      expect(sig).toBe(expected);
    });

    it("different secrets produce different signatures", () => {
      const body = '{"test":true}';
      const sig1 = computeHmacSignature(body, "secret-a");
      const sig2 = computeHmacSignature(body, "secret-b");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("deliverWithRetry", () => {
    it("delivers on first attempt and logs success", async () => {
      const fetchFn = mockFetchOk();
      const agent = makeAgent();

      const result = await deliverWithRetry(agent, { message: "test" }, store, "task-001", {
        fetchFn,
        delays: [0, 0, 0],
      });

      expect(result).toBe(true);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      const logs = store.getNotificationLogs("task-001");
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe("delivered");
      expect(logs[0].attempt).toBe(1);
      expect(logs[0].response_status).toBe(200);
    });

    it("includes Authorization and X-A2A-Signature headers", async () => {
      const fetchFn = mockFetchOk();
      const agent = makeAgent({ gateway_token: "tok-abc" });

      await deliverWithRetry(agent, { msg: "hi" }, store, "task-002", {
        fetchFn,
        delays: [0, 0, 0],
      });

      const call = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = call[1].headers;
      expect(headers["Authorization"]).toBe("Bearer tok-abc");
      expect(headers["X-A2A-Signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it("retries on HTTP failure and logs each attempt", async () => {
      let callCount = 0;
      const fetchFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ ok: false, status: 502, text: () => Promise.resolve("Bad Gateway") });
        }
        return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve("OK") });
      }) as unknown as typeof fetch;

      const agent = makeAgent();

      const resultPromise = deliverWithRetry(agent, { msg: "retry" }, store, "task-003", {
        fetchFn,
        delays: [10, 10, 10],
      });

      // Advance timers to allow retries
      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(fetchFn).toHaveBeenCalledTimes(3);

      const logs = store.getNotificationLogs("task-003");
      expect(logs).toHaveLength(3);
      expect(logs[0].status).toBe("retrying");
      expect(logs[0].attempt).toBe(1);
      expect(logs[1].status).toBe("retrying");
      expect(logs[1].attempt).toBe(2);
      expect(logs[2].status).toBe("delivered");
      expect(logs[2].attempt).toBe(3);
    });

    it("returns false after exhausting all retries", async () => {
      const fetchFn = mockFetchFail(500);
      const agent = makeAgent();

      const resultPromise = deliverWithRetry(agent, { msg: "fail" }, store, "task-004", {
        fetchFn,
        delays: [10, 10, 10],
      });

      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(fetchFn).toHaveBeenCalledTimes(3);

      const logs = store.getNotificationLogs("task-004");
      expect(logs).toHaveLength(3);
      expect(logs[0].status).toBe("retrying");
      expect(logs[1].status).toBe("retrying");
      expect(logs[2].status).toBe("failed");
    });

    it("handles connection errors with retry", async () => {
      let callCount = 0;
      const fetchFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("ECONNREFUSED"));
        }
        return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve("OK") });
      }) as unknown as typeof fetch;

      const agent = makeAgent();

      const resultPromise = deliverWithRetry(agent, { msg: "conn" }, store, "task-005", {
        fetchFn,
        delays: [10, 10, 10],
      });

      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(fetchFn).toHaveBeenCalledTimes(2);

      const logs = store.getNotificationLogs("task-005");
      expect(logs).toHaveLength(2);
      expect(logs[0].status).toBe("retrying");
      expect(logs[0].error).toContain("ECONNREFUSED");
      expect(logs[1].status).toBe("delivered");
    });

    it("skips auth headers when gateway_token is undefined", async () => {
      const fetchFn = mockFetchOk();
      const agent = makeAgent({ gateway_token: undefined });

      await deliverWithRetry(agent, { msg: "noauth" }, store, "task-006", {
        fetchFn,
        delays: [0, 0, 0],
      });

      const call = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = call[1].headers;
      expect(headers["Authorization"]).toBeUndefined();
      expect(headers["X-A2A-Signature"]).toBeUndefined();
    });
  });

  describe("notifySender", () => {
    it("notifies sender on completed task", async () => {
      const fetchFn = mockFetchOk();
      const sender = makeAgent({ agent_id: "dennis", name: "Dennis" });
      const target = makeAgent({ agent_id: "drinkify", name: "Drinkify" });
      store.registerAgent(sender);
      store.registerAgent(target);

      const task = store.createTask("dennis", "drinkify", "Deploy staging");
      const completed = store.completeTask(task.id, { agentId: "drinkify", status: "completed", result: "Done" });
      expect(completed).toBeTruthy();

      await notifySender(store, completed as NonNullable<typeof completed>, { fetchFn, delays: [0, 0, 0] });

      expect(fetchFn).toHaveBeenCalledTimes(1);
      const call = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toBe("https://gw.example.com/hooks/agent");

      const body = JSON.parse(call[1].body);
      expect(body.message).toContain("[a2a:result:");
      expect(body.message).toContain("Task completed by Drinkify");
    });

    it("notifies sender on failed task", async () => {
      const fetchFn = mockFetchOk();
      const sender = makeAgent({ agent_id: "dennis", name: "Dennis" });
      const target = makeAgent({ agent_id: "drinkify", name: "Drinkify" });
      store.registerAgent(sender);
      store.registerAgent(target);

      const task = store.createTask("dennis", "drinkify", "Deploy staging");
      const failed = store.completeTask(task.id, { agentId: "drinkify", status: "failed", result: "Build error" });
      expect(failed).toBeTruthy();

      await notifySender(store, failed as NonNullable<typeof failed>, { fetchFn, delays: [0, 0, 0] });

      expect(fetchFn).toHaveBeenCalledTimes(1);
      const call = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.message).toContain("Task failed by Drinkify");
    });

    it("does nothing for non-terminal task states", async () => {
      const fetchFn = mockFetchOk();
      const task = makeTask({ status: "working" });

      await notifySender(store, task, { fetchFn, delays: [0, 0, 0] });

      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("does nothing when sender is not registered", async () => {
      const fetchFn = mockFetchOk();
      const task = makeTask({ sender_id: "unknown-agent" });

      await notifySender(store, task, { fetchFn, delays: [0, 0, 0] });

      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("uses target_id as name when target agent not registered", async () => {
      const fetchFn = mockFetchOk();
      const sender = makeAgent({ agent_id: "dennis", name: "Dennis" });
      store.registerAgent(sender);

      const task = makeTask({ sender_id: "dennis", target_id: "unknown-target" });

      await notifySender(store, task, { fetchFn, delays: [0, 0, 0] });

      expect(fetchFn).toHaveBeenCalledTimes(1);
      const call = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.message).toContain("unknown-target");
    });
  });
});
