import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "../store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Store", () => {
  let store: Store;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "a2a-test-"));
    store = new Store(join(tempDir, "test.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("agents", () => {
    it("registers and retrieves an agent", () => {
      const agent = store.registerAgent({
        agent_id: "dennis",
        name: "Agent Dennis",
        skills: ["coding", "devops"],
        gateway_url: "http://127.0.0.1:18789",
        gateway_token: "secret123",
        hook_path: "/hooks/ingest",
      });

      expect(agent.agent_id).toBe("dennis");
      expect(agent.name).toBe("Agent Dennis");
      expect(agent.skills).toEqual(["coding", "devops"]);
      expect(agent.gateway_url).toBe("http://127.0.0.1:18789");
      expect(agent.gateway_token).toBe("secret123");
      expect(agent.hook_path).toBe("/hooks/ingest");
      expect(agent.registered_at).toBeTruthy();
    });

    it("upserts on conflict", () => {
      store.registerAgent({
        agent_id: "dennis",
        name: "Old Name",
        skills: [],
        gateway_url: "http://old",
        hook_path: "/hooks/ingest",
      });

      const updated = store.registerAgent({
        agent_id: "dennis",
        name: "New Name",
        skills: ["typescript"],
        gateway_url: "http://new",
        hook_path: "/hooks/ingest",
      });

      expect(updated.name).toBe("New Name");
      expect(updated.gateway_url).toBe("http://new");
      expect(updated.skills).toEqual(["typescript"]);
    });

    it("returns null for missing agent", () => {
      expect(store.getAgent("nonexistent")).toBeNull();
    });

    it("lists all agents", () => {
      store.registerAgent({ agent_id: "a", name: "A", skills: [], gateway_url: "http://a", hook_path: "/hooks/ingest" });
      store.registerAgent({ agent_id: "b", name: "B", skills: [], gateway_url: "http://b", hook_path: "/hooks/ingest" });

      const agents = store.listAgents();
      expect(agents).toHaveLength(2);
    });

    it("handles agent with no token", () => {
      const agent = store.registerAgent({
        agent_id: "notoken",
        name: "No Token",
        skills: [],
        gateway_url: "http://localhost",
        hook_path: "/hooks/ingest",
      });
      expect(agent.gateway_token).toBeUndefined();
    });
  });

  describe("tasks", () => {
    beforeEach(() => {
      store.registerAgent({ agent_id: "sender", name: "Sender", skills: [], gateway_url: "http://s", hook_path: "/" });
      store.registerAgent({ agent_id: "target", name: "Target", skills: [], gateway_url: "http://t", hook_path: "/" });
    });

    it("creates a task", () => {
      const task = store.createTask("sender", "target", "do something");

      expect(task.id).toBeTruthy();
      expect(task.sender_id).toBe("sender");
      expect(task.target_id).toBe("target");
      expect(task.message).toBe("do something");
      expect(task.status).toBe("submitted");
      expect(task.result).toBeNull();
    });

    it("gets a task by ID", () => {
      const task = store.createTask("sender", "target", "hello");
      const fetched = store.getTask(task.id);
      expect(fetched).toEqual(task);
    });

    it("returns null for missing task", () => {
      expect(store.getTask("nonexistent")).toBeNull();
    });

    it("lists all tasks", () => {
      store.createTask("sender", "target", "task1");
      store.createTask("sender", "target", "task2");

      const tasks = store.listTasks();
      expect(tasks).toHaveLength(2);
    });

    it("lists tasks filtered by agentId", () => {
      store.registerAgent({ agent_id: "other", name: "Other", skills: [], gateway_url: "http://o", hook_path: "/" });
      store.createTask("sender", "target", "task1");
      store.createTask("other", "target", "task2");

      const senderTasks = store.listTasks("sender");
      expect(senderTasks).toHaveLength(1);
      expect(senderTasks[0].sender_id).toBe("sender");
    });

    it("updates task status", () => {
      const task = store.createTask("sender", "target", "test");
      const updated = store.updateTaskStatus(task.id, "working");

      expect(updated?.status).toBe("working");
    });

    it("completes a task", () => {
      const task = store.createTask("sender", "target", "test");
      const completed = store.completeTask(task.id, {
        agentId: "target",
        status: "completed",
        result: "All done!",
      });

      expect(completed?.status).toBe("completed");
      expect(completed?.result).toBe("All done!");
    });

    it("rejects completion from wrong agent", () => {
      const task = store.createTask("sender", "target", "test");
      const result = store.completeTask(task.id, {
        agentId: "sender", // wrong — should be target
        status: "completed",
        result: "Nope",
      });

      expect(result).toBeNull();
    });

    it("returns null when completing nonexistent task", () => {
      const result = store.completeTask("fake-id", {
        agentId: "target",
        status: "completed",
        result: "Nope",
      });
      expect(result).toBeNull();
    });
  });
});
