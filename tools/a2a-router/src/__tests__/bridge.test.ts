import { describe, it, expect } from "vitest";
import { buildTaskPayload, buildResultPayload } from "../bridge.js";
import type { Task } from "../types.js";

const baseTask: Task = {
  id: "abc-123",
  sender_id: "dennis",
  target_id: "drinkify",
  message: "Check the git status of drinkify repo",
  status: "submitted",
  result: null,
  created_at: "2026-03-25T12:00:00",
  updated_at: "2026-03-25T12:00:00",
};

describe("bridge", () => {
  describe("buildTaskPayload", () => {
    it("constructs correct hook payload for a task", () => {
      const payload = buildTaskPayload(baseTask);

      expect(payload.agentId).toBe("main");
      expect(payload.message).toBe("[a2a:task:abc-123]\n\nCheck the git status of drinkify repo");
    });

    it("includes task ID in the message prefix", () => {
      const task = { ...baseTask, id: "xyz-789" };
      const payload = buildTaskPayload(task);

      expect(payload.message).toContain("[a2a:task:xyz-789]");
    });
  });

  describe("buildResultPayload", () => {
    it("constructs completed result payload", () => {
      const task: Task = { ...baseTask, status: "completed", result: "Repo is clean, all committed" };
      const payload = buildResultPayload(task, "Agent Drinkify");

      expect(payload.agentId).toBe("main");
      expect(payload.message).toContain("[a2a:result:abc-123]");
      expect(payload.message).toContain("Task completed by Agent Drinkify");
      expect(payload.message).toContain("Repo is clean, all committed");
    });

    it("constructs failed result payload", () => {
      const task: Task = { ...baseTask, status: "failed", result: "Could not access repo" };
      const payload = buildResultPayload(task, "Agent Drinkify");

      expect(payload.message).toContain("Task failed by Agent Drinkify");
      expect(payload.message).toContain("Could not access repo");
    });

    it("handles missing result", () => {
      const task: Task = { ...baseTask, status: "completed", result: null };
      const payload = buildResultPayload(task, "Agent Drinkify");

      expect(payload.message).toContain("Task completed by Agent Drinkify");
      expect(payload.message).not.toContain("null");
    });
  });
});
