import { describe, expect, it } from "vitest";

import {
  ACPMessageType,
  AgentRole,
  AgentStatus,
  AmountMode,
  ChannelType,
  CreditType,
  DemoMessageCategory,
  EventSeverity,
  IdleReason,
  MemorySource,
  MemoryType,
  MemoryVisibility,
  MessageType,
  Proficiency,
  SandboxEscalationReason,
  SimulationEventType,
  TaskPriority,
  TaskStatus,
  TriggerMode,
  WebhookHookType,
} from "./index";

describe("Enums", () => {
  describe("AgentRole", () => {
    it("should have correct values", () => {
      expect(AgentRole.WORKER).toBe("worker");
      expect(AgentRole.HR).toBe("hr");
      expect(AgentRole.FOUNDER).toBe("founder");
      expect(AgentRole.ADMIN).toBe("admin");
      expect(AgentRole.COO).toBe("coo");
      expect(AgentRole.TALENT).toBe("talent");
      expect(AgentRole.LEAD).toBe("lead");
      expect(AgentRole.SENIOR).toBe("senior");
      expect(AgentRole.MANAGER).toBe("manager");
      expect(AgentRole.INTERN).toBe("intern");
    });
  });

  describe("AgentStatus", () => {
    it("should have correct values", () => {
      expect(AgentStatus.PENDING).toBe("pending");
      expect(AgentStatus.ACTIVE).toBe("active");
      expect(AgentStatus.IDLE).toBe("idle");
      expect(AgentStatus.BUSY).toBe("busy");
      expect(AgentStatus.PAUSED).toBe("paused");
      expect(AgentStatus.SUSPENDED).toBe("suspended");
      expect(AgentStatus.REVOKED).toBe("revoked");
    });
  });

  describe("TaskStatus", () => {
    it("should have correct values", () => {
      expect(TaskStatus.BACKLOG).toBe("backlog");
      expect(TaskStatus.TODO).toBe("todo");
      expect(TaskStatus.PENDING).toBe("pending");
      expect(TaskStatus.ASSIGNED).toBe("assigned");
      expect(TaskStatus.IN_PROGRESS).toBe("in_progress");
      expect(TaskStatus.REVIEW).toBe("review");
      expect(TaskStatus.DONE).toBe("done");
      expect(TaskStatus.BLOCKED).toBe("blocked");
      expect(TaskStatus.CANCELLED).toBe("cancelled");
      expect(TaskStatus.REJECTED).toBe("rejected");
    });
  });

  describe("TaskPriority", () => {
    it("should have correct values", () => {
      expect(TaskPriority.CRITICAL).toBe("critical");
      expect(TaskPriority.URGENT).toBe("urgent");
      expect(TaskPriority.HIGH).toBe("high");
      expect(TaskPriority.NORMAL).toBe("normal");
      expect(TaskPriority.LOW).toBe("low");
    });
  });

  describe("CreditType", () => {
    it("should have correct values", () => {
      expect(CreditType.CREDIT).toBe("CREDIT");
      expect(CreditType.DEBIT).toBe("DEBIT");
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
      expect(EventSeverity.DEBUG).toBe("debug");
      expect(EventSeverity.INFO).toBe("info");
      expect(EventSeverity.SUCCESS).toBe("success");
      expect(EventSeverity.WARNING).toBe("warning");
      expect(EventSeverity.ERROR).toBe("error");
      expect(EventSeverity.CRITICAL).toBe("critical");
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
  });

  describe("SimulationEventType", () => {
    it("should have correct values", () => {
      expect(SimulationEventType.AGENT_CREATED).toBe("agent_created");
      expect(SimulationEventType.TASK_COMPLETED).toBe("task_completed");
      expect(SimulationEventType.SYSTEM_EVENT).toBe("system_event");
    });

    it("should have 16 event types", () => {
      expect(Object.values(SimulationEventType)).toHaveLength(16);
    });
  });

  describe("DemoMessageCategory", () => {
    it("should have correct values", () => {
      expect(DemoMessageCategory.TASK).toBe("task");
      expect(DemoMessageCategory.STATUS).toBe("status");
      expect(DemoMessageCategory.GENERAL).toBe("general");
    });
  });

  describe("MemoryType", () => {
    it("should have correct values", () => {
      expect(MemoryType.EPISODIC).toBe("episodic");
      expect(MemoryType.SEMANTIC).toBe("semantic");
      expect(MemoryType.GRAPH).toBe("graph");
    });
  });

  describe("MemoryVisibility", () => {
    it("should have correct values", () => {
      expect(MemoryVisibility.SHARED).toBe("shared");
      expect(MemoryVisibility.PRIVATE).toBe("private");
      expect(MemoryVisibility.TARGETED).toBe("targeted");
    });
  });

  describe("MemorySource", () => {
    it("should have correct values", () => {
      expect(MemorySource.TASK_COMPLETION).toBe("task_completion");
      expect(MemorySource.CODE_CHANGE).toBe("code_change");
      expect(MemorySource.UNKNOWN).toBe("unknown");
    });
  });

  describe("ACPMessageType", () => {
    it("should have correct values", () => {
      expect(ACPMessageType.ACK).toBe("ack");
      expect(ACPMessageType.ESCALATION).toBe("escalation");
      expect(ACPMessageType.COMPLETION).toBe("completion");
    });
  });

  describe("SandboxEscalationReason", () => {
    it("should have correct values", () => {
      expect(SandboxEscalationReason.BLOCKED).toBe("BLOCKED");
      expect(SandboxEscalationReason.TIMEOUT).toBe("TIMEOUT");
    });
  });

  describe("TriggerMode", () => {
    it("should have correct values", () => {
      expect(TriggerMode.POLLING).toBe("polling");
      expect(TriggerMode.EVENT_DRIVEN).toBe("event-driven");
    });
  });

  describe("WebhookHookType", () => {
    it("should have correct values", () => {
      expect(WebhookHookType.PRE).toBe("pre");
      expect(WebhookHookType.POST).toBe("post");
    });
  });
});
