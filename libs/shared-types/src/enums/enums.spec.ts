import { describe, expect, it } from "vitest";

import {
  AgentRole,
  AgentStatus,
  AmountMode,
  ChannelType,
  CreditType,
  EventSeverity,
  IdleReason,
  MessageType,
  Proficiency,
  TaskPriority,
  TaskStatus,
} from "./index";

describe("Enums", () => {
  describe("AgentRole", () => {
    it("should have correct values", () => {
      expect(AgentRole.WORKER).toBe("worker");
      expect(AgentRole.HR).toBe("hr");
      expect(AgentRole.FOUNDER).toBe("founder");
      expect(AgentRole.ADMIN).toBe("admin");
    });
  });

  describe("AgentStatus", () => {
    it("should have correct values", () => {
      expect(AgentStatus.ACTIVE).toBe("active");
      expect(AgentStatus.SUSPENDED).toBe("suspended");
      expect(AgentStatus.REVOKED).toBe("revoked");
    });
  });

  describe("TaskStatus", () => {
    it("should have correct values", () => {
      expect(TaskStatus.BACKLOG).toBe("backlog");
      expect(TaskStatus.TODO).toBe("todo");
      expect(TaskStatus.IN_PROGRESS).toBe("in_progress");
      expect(TaskStatus.REVIEW).toBe("review");
      expect(TaskStatus.DONE).toBe("done");
      expect(TaskStatus.BLOCKED).toBe("blocked");
      expect(TaskStatus.CANCELLED).toBe("cancelled");
    });
  });

  describe("TaskPriority", () => {
    it("should have correct values", () => {
      expect(TaskPriority.URGENT).toBe("urgent");
      expect(TaskPriority.HIGH).toBe("high");
      expect(TaskPriority.NORMAL).toBe("normal");
      expect(TaskPriority.LOW).toBe("low");
    });
  });

  describe("CreditType", () => {
    it("should have correct values", () => {
      expect(CreditType.CREDIT).toBe("credit");
      expect(CreditType.DEBIT).toBe("debit");
    });
  });

  describe("MessageType", () => {
    it("should have correct values", () => {
      expect(MessageType.TEXT).toBe("text");
      expect(MessageType.HANDOFF).toBe("handoff");
      expect(MessageType.STATUS_UPDATE).toBe("status_update");
      expect(MessageType.REQUEST).toBe("request");
    });
  });

  describe("ChannelType", () => {
    it("should have correct values", () => {
      expect(ChannelType.TASK).toBe("task");
      expect(ChannelType.AGENT).toBe("agent");
      expect(ChannelType.BROADCAST).toBe("broadcast");
      expect(ChannelType.GENERAL).toBe("general");
    });
  });

  describe("EventSeverity", () => {
    it("should have correct values", () => {
      expect(EventSeverity.INFO).toBe("info");
      expect(EventSeverity.WARNING).toBe("warning");
      expect(EventSeverity.ERROR).toBe("error");
    });
  });

  describe("AmountMode", () => {
    it("should have correct values", () => {
      expect(AmountMode.FIXED).toBe("fixed");
      expect(AmountMode.DYNAMIC).toBe("dynamic");
    });
  });

  describe("Proficiency", () => {
    it("should have correct values", () => {
      expect(Proficiency.BASIC).toBe("basic");
      expect(Proficiency.STANDARD).toBe("standard");
      expect(Proficiency.EXPERT).toBe("expert");
    });
  });

  describe("IdleReason", () => {
    it("should have correct values", () => {
      expect(IdleReason.TASK_COMPLETE).toBe("task_complete");
      expect(IdleReason.BLOCKED).toBe("blocked");
      expect(IdleReason.AWAITING_INPUT).toBe("awaiting_input");
      expect(IdleReason.UNASSIGNED).toBe("unassigned");
      expect(IdleReason.NEWLY_ACTIVATED).toBe("newly_activated");
    });

    it("should have exactly 5 idle reasons", () => {
      const values = Object.values(IdleReason);
      expect(values).toHaveLength(5);
    });

    it("should be usable as event metadata", () => {
      const eventData = {
        agentId: "agent-123",
        reason: IdleReason.TASK_COMPLETE,
        previousTaskId: "task-456",
      };

      expect(eventData.reason).toBe("task_complete");
      expect(typeof eventData.reason).toBe("string");
    });
  });
});
