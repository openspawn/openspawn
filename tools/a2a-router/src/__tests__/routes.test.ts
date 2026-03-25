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

describe("API Routes", () => {
  let app: Express;
  let store: Store;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "a2a-route-test-"));
    const created = createApp(new Store(join(tempDir, "test.db")));
    app = created.app;
    store = created.store;
    mockFetch.mockReset();
  });

  afterEach(() => {
    store.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("GET /health", () => {
    it("returns ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("POST /a2a/agents", () => {
    it("registers a new agent", async () => {
      const res = await request(app)
        .post("/a2a/agents")
        .send({
          agentId: "dennis",
          name: "Agent Dennis",
          skills: ["coding"],
          gateway_url: "http://127.0.0.1:18789",
          gateway_token: "secret",
          hook_path: "/hooks/ingest",
        });

      expect(res.status).toBe(201);
      expect(res.body.agent_id).toBe("dennis");
      expect(res.body.name).toBe("Agent Dennis");
    });

    it("rejects missing agentId", async () => {
      const res = await request(app)
        .post("/a2a/agents")
        .send({ name: "No ID", gateway_url: "http://x" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("agentId");
    });

    it("rejects missing name", async () => {
      const res = await request(app)
        .post("/a2a/agents")
        .send({ agentId: "x", gateway_url: "http://x" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("name");
    });

    it("rejects missing gateway_url", async () => {
      const res = await request(app)
        .post("/a2a/agents")
        .send({ agentId: "x", name: "X" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("gateway_url");
    });
  });

  describe("GET /a2a/agents", () => {
    it("lists registered agents", async () => {
      store.registerAgent({ agent_id: "a", name: "A", skills: [], gateway_url: "http://a", hook_path: "/" });
      store.registerAgent({ agent_id: "b", name: "B", skills: [], gateway_url: "http://b", hook_path: "/" });

      const res = await request(app).get("/a2a/agents");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe("GET /a2a/agents/:id", () => {
    it("returns agent by id", async () => {
      store.registerAgent({ agent_id: "dennis", name: "Dennis", skills: [], gateway_url: "http://d", hook_path: "/" });

      const res = await request(app).get("/a2a/agents/dennis");
      expect(res.status).toBe(200);
      expect(res.body.agent_id).toBe("dennis");
    });

    it("returns 404 for unknown agent", async () => {
      const res = await request(app).get("/a2a/agents/unknown");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /a2a/message/send", () => {
    beforeEach(() => {
      store.registerAgent({ agent_id: "dennis", name: "Dennis", skills: [], gateway_url: "http://127.0.0.1:18789", hook_path: "/hooks/ingest" });
      store.registerAgent({ agent_id: "drinkify", name: "Drinkify", skills: [], gateway_url: "http://127.0.0.1:18810", gateway_token: "tok", hook_path: "/hooks/ingest" });
    });

    it("sends a message and creates a task", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "ok",
      });

      const res = await request(app)
        .post("/a2a/message/send")
        .send({
          agentId: "drinkify",
          senderId: "dennis",
          message: "Check git status",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("working");
      expect(res.body.sender_id).toBe("dennis");
      expect(res.body.target_id).toBe("drinkify");

      // Verify fetch was called with correct URL and payload
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("http://127.0.0.1:18810/hooks/ingest");
      expect(opts.headers["Authorization"]).toBe("Bearer tok");
      const body = JSON.parse(opts.body);
      expect(body.message).toContain("[a2a:task:");
      expect(body.message).toContain("Check git status");
    });

    it("returns 502 when gateway is down", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      const res = await request(app)
        .post("/a2a/message/send")
        .send({
          agentId: "drinkify",
          senderId: "dennis",
          message: "Test",
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toContain("Failed to deliver");
    });

    it("returns 404 for unknown target agent", async () => {
      const res = await request(app)
        .post("/a2a/message/send")
        .send({ agentId: "unknown", senderId: "dennis", message: "Hi" });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Target agent");
    });

    it("returns 404 for unknown sender agent", async () => {
      const res = await request(app)
        .post("/a2a/message/send")
        .send({ agentId: "drinkify", senderId: "unknown", message: "Hi" });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Sender agent");
    });

    it("rejects missing fields", async () => {
      const res = await request(app).post("/a2a/message/send").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /a2a/tasks", () => {
    beforeEach(() => {
      store.registerAgent({ agent_id: "s", name: "S", skills: [], gateway_url: "http://s", hook_path: "/" });
      store.registerAgent({ agent_id: "t", name: "T", skills: [], gateway_url: "http://t", hook_path: "/" });
    });

    it("lists all tasks", async () => {
      store.createTask("s", "t", "task1");
      store.createTask("s", "t", "task2");

      const res = await request(app).get("/a2a/tasks");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("filters by agentId", async () => {
      store.registerAgent({ agent_id: "other", name: "Other", skills: [], gateway_url: "http://o", hook_path: "/" });
      store.createTask("s", "t", "task1");
      store.createTask("other", "t", "task2");

      const res = await request(app).get("/a2a/tasks?agentId=s");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("GET /a2a/tasks/:id", () => {
    it("returns task by id", async () => {
      store.registerAgent({ agent_id: "s", name: "S", skills: [], gateway_url: "http://s", hook_path: "/" });
      store.registerAgent({ agent_id: "t", name: "T", skills: [], gateway_url: "http://t", hook_path: "/" });
      const task = store.createTask("s", "t", "test");

      const res = await request(app).get(`/a2a/tasks/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
    });

    it("returns 404 for unknown task", async () => {
      const res = await request(app).get("/a2a/tasks/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /a2a/tasks/:id/complete", () => {
    let taskId: string;

    beforeEach(() => {
      store.registerAgent({ agent_id: "sender", name: "Sender", skills: [], gateway_url: "http://s", hook_path: "/hooks/ingest" });
      store.registerAgent({ agent_id: "target", name: "Target", skills: [], gateway_url: "http://t", hook_path: "/hooks/ingest" });
      const task = store.createTask("sender", "target", "do it");
      store.updateTaskStatus(task.id, "working");
      taskId = task.id;
    });

    it("completes a task successfully", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const res = await request(app)
        .post(`/a2a/tasks/${taskId}/complete`)
        .send({ agentId: "target", status: "completed", result: "All done" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("completed");
      expect(res.body.result).toBe("All done");
    });

    it("marks a task as failed", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" });

      const res = await request(app)
        .post(`/a2a/tasks/${taskId}/complete`)
        .send({ agentId: "target", status: "failed", result: "Access denied" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("failed");
      expect(res.body.result).toBe("Access denied");
    });

    it("rejects completion from wrong agent", async () => {
      const res = await request(app)
        .post(`/a2a/tasks/${taskId}/complete`)
        .send({ agentId: "sender", status: "completed", result: "Nope" });

      expect(res.status).toBe(403);
    });

    it("returns 404 for unknown task", async () => {
      const res = await request(app)
        .post("/a2a/tasks/fake/complete")
        .send({ agentId: "target", status: "completed", result: "x" });

      expect(res.status).toBe(404);
    });

    it("rejects invalid status", async () => {
      const res = await request(app)
        .post(`/a2a/tasks/${taskId}/complete`)
        .send({ agentId: "target", status: "invalid", result: "x" });

      expect(res.status).toBe(400);
    });

    it("rejects already completed task", async () => {
      store.updateTaskStatus(taskId, "completed", "done");

      const res = await request(app)
        .post(`/a2a/tasks/${taskId}/complete`)
        .send({ agentId: "target", status: "completed", result: "Again" });

      expect(res.status).toBe(409);
    });

    it("notifies sender on completion", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => "ok" });

      await request(app)
        .post(`/a2a/tasks/${taskId}/complete`)
        .send({ agentId: "target", status: "completed", result: "Done" });

      // Give the async notification a moment
      await new Promise((r) => setTimeout(r, 50));

      // fetch should have been called for the notification
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
