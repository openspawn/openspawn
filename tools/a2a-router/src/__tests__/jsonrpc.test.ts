import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../index.js";
import { Store } from "../store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Express } from "express";

// Mock fetch for bridge delivery tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function rpc(app: Express, method: string, params: Record<string, unknown>, id: string | number = "1") {
  return request(app)
    .post("/a2a/jsonrpc")
    .send({ jsonrpc: "2.0", id, method, params });
}

describe("JSON-RPC 2.0 Endpoint", () => {
  let app: Express;
  let store: Store;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "a2a-jsonrpc-test-"));
    const created = createApp(new Store(join(tempDir, "test.db")));
    app = created.app;
    store = created.store;
    mockFetch.mockReset();

    // Register test agents
    store.registerAgent({ agent_id: "dennis", name: "Agent Dennis", skills: ["coding"], gateway_url: "http://127.0.0.1:18789", hook_path: "/hooks/ingest" });
    store.registerAgent({ agent_id: "drinkify", name: "Agent Drinkify", skills: ["ecommerce"], gateway_url: "http://127.0.0.1:18810", gateway_token: "tok", hook_path: "/hooks/ingest" });
  });

  afterEach(() => {
    store.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ── Envelope Validation ────────────────────────────────────────────────

  describe("envelope validation", () => {
    it("rejects missing jsonrpc version", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ id: "1", method: "tasks/get", params: {} });

      expect(res.status).toBe(200);
      expect(res.body.error.code).toBe(-32600);
      expect(res.body.error.data.reason).toContain("jsonrpc");
    });

    it("rejects wrong jsonrpc version", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ jsonrpc: "1.0", id: "1", method: "tasks/get", params: {} });

      expect(res.status).toBe(200);
      expect(res.body.error.code).toBe(-32600);
    });

    it("rejects missing id", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ jsonrpc: "2.0", method: "tasks/get", params: {} });

      expect(res.status).toBe(200);
      expect(res.body.error.code).toBe(-32600);
      expect(res.body.id).toBe(0);
    });

    it("rejects missing method", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ jsonrpc: "2.0", id: "1", params: {} });

      expect(res.status).toBe(200);
      expect(res.body.error.code).toBe(-32600);
      expect(res.body.error.data.reason).toContain("method");
    });

    it("rejects empty method string", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ jsonrpc: "2.0", id: "1", method: "", params: {} });

      expect(res.status).toBe(200);
      expect(res.body.error.code).toBe(-32600);
    });

    it("rejects unknown method", async () => {
      const res = await rpc(app, "unknown/method", {});

      expect(res.body.error.code).toBe(-32601);
      expect(res.body.error.data.method).toBe("unknown/method");
    });

    it("preserves request id in response", async () => {
      const res = await rpc(app, "tasks/get", { taskId: "nonexistent" }, 42);
      expect(res.body.id).toBe(42);
    });

    it("preserves string id in response", async () => {
      const res = await rpc(app, "tasks/get", { taskId: "nonexistent" }, "req-abc");
      expect(res.body.id).toBe("req-abc");
    });

    it("works without explicit params", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ jsonrpc: "2.0", id: "1", method: "tasks/list" });

      expect(res.body.jsonrpc).toBe("2.0");
      expect(res.body.result).toBeDefined();
    });
  });

  // ── message/send ───────────────────────────────────────────────────────

  describe("message/send", () => {
    const validMessage = {
      kind: "message",
      messageId: "msg-1",
      role: "user",
      parts: [{ kind: "text", text: "Status update please" }],
    };

    it("sends a message and creates a task", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: validMessage,
      });

      expect(res.body.error).toBeUndefined();
      expect(res.body.result.id).toBeTruthy();
      expect(res.body.result.status.state).toBe("working");
      expect(res.body.result.messages).toHaveLength(1);
      expect(res.body.result.messages[0].parts[0].text).toBe("Status update please");
    });

    it("includes contextId when provided", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: validMessage,
        contextId: "project-drinkify",
      });

      expect(res.body.result.contextId).toBe("project-drinkify");
    });

    it("handles multi-part messages", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: {
          kind: "message",
          messageId: "msg-multi",
          role: "user",
          parts: [
            { kind: "text", text: "Check this out" },
            { kind: "data", data: { foo: "bar" } },
          ],
        },
      });

      expect(res.body.result.messages[0].parts).toHaveLength(2);
    });

    it("rejects missing agentId", async () => {
      const res = await rpc(app, "message/send", {
        senderId: "dennis",
        message: validMessage,
      });

      expect(res.body.error.code).toBe(-32602);
      expect(res.body.error.data.reason).toContain("agentId");
    });

    it("rejects missing senderId", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        message: validMessage,
      });

      expect(res.body.error.code).toBe(-32602);
      expect(res.body.error.data.reason).toContain("senderId");
    });

    it("rejects missing message", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
      });

      expect(res.body.error.code).toBe(-32602);
      expect(res.body.error.data.reason).toContain("message");
    });

    it("rejects invalid message — missing kind", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: { messageId: "m", role: "user", parts: [{ kind: "text", text: "hi" }] },
      });

      expect(res.body.error.code).toBe(-32602);
    });

    it("rejects invalid message — missing messageId", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: { kind: "message", role: "user", parts: [{ kind: "text", text: "hi" }] },
      });

      expect(res.body.error.code).toBe(-32602);
    });

    it("rejects invalid message — empty parts", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: { kind: "message", messageId: "m", role: "user", parts: [] },
      });

      expect(res.body.error.code).toBe(-32602);
    });

    it("rejects invalid message — invalid part kind", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: { kind: "message", messageId: "m", role: "user", parts: [{ kind: "unknown" }] },
      });

      expect(res.body.error.code).toBe(-32602);
    });

    it("returns AGENT_NOT_FOUND for unknown target agent", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "unknown",
        senderId: "dennis",
        message: validMessage,
      });

      expect(res.body.error.code).toBe(-32002);
      expect(res.body.error.data.agentId).toBe("unknown");
    });

    it("returns AGENT_NOT_FOUND for unknown sender agent", async () => {
      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "unknown",
        message: validMessage,
      });

      expect(res.body.error.code).toBe(-32002);
      expect(res.body.error.data.agentId).toBe("unknown");
    });

    it("reverts to submitted when gateway delivery fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: validMessage,
      });

      // Still returns the task but with submitted status
      expect(res.body.result.status.state).toBe("submitted");
      expect(res.body.result.status.message).toContain("Delivery");
    });
  });

  // ── tasks/get ──────────────────────────────────────────────────────────

  describe("tasks/get", () => {
    it("returns a task by ID", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const createRes = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "hi" }] },
      });
      const taskId = createRes.body.result.id;

      const res = await rpc(app, "tasks/get", { taskId });

      expect(res.body.result.id).toBe(taskId);
      expect(res.body.result.messages).toHaveLength(1);
    });

    it("returns TASK_NOT_FOUND for unknown task", async () => {
      const res = await rpc(app, "tasks/get", { taskId: "nonexistent" });

      expect(res.body.error.code).toBe(-32001);
      expect(res.body.error.data.taskId).toBe("nonexistent");
    });

    it("rejects missing taskId", async () => {
      const res = await rpc(app, "tasks/get", {});

      expect(res.body.error.code).toBe(-32602);
      expect(res.body.error.data.reason).toContain("taskId");
    });
  });

  // ── tasks/list ─────────────────────────────────────────────────────────

  describe("tasks/list", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => "ok" });
    });

    it("lists all tasks", async () => {
      await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "t1" }] },
      });
      await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m2", role: "user", parts: [{ kind: "text", text: "t2" }] },
      });

      const res = await rpc(app, "tasks/list", {});

      expect(res.body.result.total).toBe(2);
      expect(res.body.result.tasks).toHaveLength(2);
    });

    it("filters by agentId", async () => {
      store.registerAgent({ agent_id: "other", name: "Other", skills: [], gateway_url: "http://o", hook_path: "/" });

      await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "t1" }] },
      });

      // Create a task via legacy store to have different agents
      store.createTask("other", "drinkify", "other task");

      const res = await rpc(app, "tasks/list", { agentId: "other" });
      expect(res.body.result.total).toBe(1);
    });

    it("filters by status", async () => {
      await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "t1" }] },
      });

      // All tasks should be "working" after successful delivery
      const res = await rpc(app, "tasks/list", { status: "working" });
      expect(res.body.result.total).toBeGreaterThan(0);

      const res2 = await rpc(app, "tasks/list", { status: "completed" });
      expect(res2.body.result.total).toBe(0);
    });

    it("filters by contextId", async () => {
      await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "t1" }] },
        contextId: "project-a",
      });
      await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m2", role: "user", parts: [{ kind: "text", text: "t2" }] },
        contextId: "project-b",
      });

      const res = await rpc(app, "tasks/list", { contextId: "project-a" });
      expect(res.body.result.total).toBe(1);
    });

    it("supports pagination with limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await rpc(app, "message/send", {
          agentId: "drinkify", senderId: "dennis",
          message: { kind: "message", messageId: `m${i}`, role: "user", parts: [{ kind: "text", text: `t${i}` }] },
        });
      }

      const res = await rpc(app, "tasks/list", { limit: 2, offset: 0 });
      expect(res.body.result.tasks).toHaveLength(2);
      expect(res.body.result.total).toBe(5);
      expect(res.body.result.limit).toBe(2);
      expect(res.body.result.offset).toBe(0);

      const res2 = await rpc(app, "tasks/list", { limit: 2, offset: 4 });
      expect(res2.body.result.tasks).toHaveLength(1);
    });

    it("returns empty result for offset beyond total", async () => {
      const res = await rpc(app, "tasks/list", { offset: 100 });
      expect(res.body.result.tasks).toHaveLength(0);
      expect(res.body.result.total).toBe(0);
    });

    it("rejects negative limit", async () => {
      const res = await rpc(app, "tasks/list", { limit: -1 });
      expect(res.body.error.code).toBe(-32602);
    });

    it("rejects negative offset", async () => {
      const res = await rpc(app, "tasks/list", { offset: -1 });
      expect(res.body.error.code).toBe(-32602);
    });

    it("rejects invalid status value", async () => {
      const res = await rpc(app, "tasks/list", { status: "invalid" });
      expect(res.body.error.code).toBe(-32602);
    });

    it("defaults limit to 50", async () => {
      const res = await rpc(app, "tasks/list", {});
      expect(res.body.result.limit).toBe(50);
    });
  });

  // ── tasks/cancel ───────────────────────────────────────────────────────

  describe("tasks/cancel", () => {
    let taskId: string;

    beforeEach(async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => "ok" });

      const res = await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m1", role: "user", parts: [{ kind: "text", text: "do it" }] },
      });
      taskId = res.body.result.id;
    });

    it("cancels a working task", async () => {
      const res = await rpc(app, "tasks/cancel", { taskId });

      expect(res.body.result.status.state).toBe("canceled");
    });

    it("cancels a submitted task", async () => {
      // Create a task that fails delivery (stays submitted)
      mockFetch.mockRejectedValueOnce(new Error("fail"));
      const createRes = await rpc(app, "message/send", {
        agentId: "drinkify", senderId: "dennis",
        message: { kind: "message", messageId: "m2", role: "user", parts: [{ kind: "text", text: "test" }] },
      });
      const submittedTaskId = createRes.body.result.id;

      const res = await rpc(app, "tasks/cancel", { taskId: submittedTaskId });
      expect(res.body.result.status.state).toBe("canceled");
    });

    it("rejects canceling a completed task", async () => {
      store.updateA2ATaskStatus(taskId, "completed");

      const res = await rpc(app, "tasks/cancel", { taskId });
      expect(res.body.error.code).toBe(-32602);
      expect(res.body.error.data.reason).toContain("completed");
    });

    it("rejects canceling a failed task", async () => {
      store.updateA2ATaskStatus(taskId, "failed");

      const res = await rpc(app, "tasks/cancel", { taskId });
      expect(res.body.error.code).toBe(-32602);
    });

    it("rejects canceling an already canceled task", async () => {
      store.updateA2ATaskStatus(taskId, "canceled");

      const res = await rpc(app, "tasks/cancel", { taskId });
      expect(res.body.error.code).toBe(-32602);
    });

    it("returns TASK_NOT_FOUND for unknown task", async () => {
      const res = await rpc(app, "tasks/cancel", { taskId: "nonexistent" });
      expect(res.body.error.code).toBe(-32001);
    });

    it("rejects missing taskId", async () => {
      const res = await rpc(app, "tasks/cancel", {});
      expect(res.body.error.code).toBe(-32602);
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles numeric id = 0", async () => {
      const res = await request(app)
        .post("/a2a/jsonrpc")
        .send({ jsonrpc: "2.0", id: 0, method: "tasks/list", params: {} });

      // id=0 is falsy but valid in JSON-RPC
      expect(res.body.jsonrpc).toBe("2.0");
    });

    it("handles empty params object", async () => {
      const res = await rpc(app, "tasks/list", {});
      expect(res.body.result).toBeDefined();
    });

    it("handles file parts in messages", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const res = await rpc(app, "message/send", {
        agentId: "drinkify",
        senderId: "dennis",
        message: {
          kind: "message",
          messageId: "m-file",
          role: "user",
          parts: [{ kind: "file", name: "test.txt", mimeType: "text/plain", uri: "file:///tmp/test.txt" }],
        },
      });

      expect(res.body.result.messages[0].parts[0].kind).toBe("file");
    });
  });
});
