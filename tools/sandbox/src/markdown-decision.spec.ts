import { describe, it, expect } from "vitest";
import { parseDecision, resolveAgentId, type DecisionAction } from "./markdown-decision.js";
import type { SandboxAgent } from "./types.js";
import { AgentRole, AgentStatus, TriggerMode } from "@openspawn/shared-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAgent(id: string, name: string): SandboxAgent {
  return {
    id,
    name,
    role: AgentRole.WORKER,
    level: 4,
    domain: "Engineering",
    status: AgentStatus.ACTIVE,
    systemPrompt: "",
    taskIds: [],
    recentMessages: [],
    trigger: TriggerMode.POLLING,
    inbox: [],
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      messagesSent: 0,
      creditsEarned: 0,
      creditsSpent: 0,
    },
  };
}

// ── parseDecision ────────────────────────────────────────────────────────────

describe("parseDecision", () => {
  it("parses a well-formed decision", () => {
    const input = `- Action: delegate
- Target: tech-talent
- Task: TASK-0001
- Message: Assigning Safari crash fix to engineering`;
    const d = parseDecision(input);
    expect(d).not.toBeNull();
    expect(d?.action).toBe("delegate");
    expect(d?.target).toBe("tech-talent");
    expect(d?.task).toBe("TASK-0001");
    expect(d?.message).toBe("Assigning Safari crash fix to engineering");
  });

  it("returns null when no action found", () => {
    expect(parseDecision("no action here")).toBeNull();
  });

  it("returns null for invalid action", () => {
    expect(parseDecision("Action: fly\nTarget: none")).toBeNull();
  });

  it("handles all valid actions", () => {
    const actions: DecisionAction[] = [
      "delegate",
      "escalate",
      "complete",
      "work",
      "message",
      "hire",
      "idle",
    ];
    for (const action of actions) {
      const d = parseDecision(`Action: ${action}\nTarget: none\nTask: T1\nMessage: test`);
      expect(d).not.toBeNull();
      expect(d?.action).toBe(action);
    }
  });

  it("is case-insensitive for action keyword", () => {
    const d = parseDecision("ACTION: Work\nTarget: none");
    expect(d).not.toBeNull();
    expect(d?.action).toBe("work");
  });

  it("defaults target to none when missing", () => {
    const d = parseDecision("Action: idle");
    expect(d?.target).toBe("none");
  });

  it("defaults task to empty string when missing", () => {
    const d = parseDecision("Action: idle\nTarget: none");
    expect(d?.task).toBe("");
  });

  it("defaults message to empty string when missing", () => {
    const d = parseDecision("Action: idle\nTarget: none");
    expect(d?.message).toBe("");
  });

  it("preserves raw response", () => {
    const raw = "Action: work\nTarget: none\nTask: T1\nMessage: did stuff";
    const d = parseDecision(raw);
    expect(d?.raw).toBe(raw);
  });

  it("handles extra whitespace in values", () => {
    const d = parseDecision("Action:   delegate  \nTarget:   tech-talent  ");
    expect(d?.action).toBe("delegate");
    expect(d?.target).toBe("tech-talent");
  });

  it("handles markdown bullet prefix", () => {
    const d = parseDecision(
      "- Action: work\n- Target: none\n- Task: TASK-0042\n- Message: fixing bugs",
    );
    expect(d?.action).toBe("work");
    expect(d?.task).toBe("TASK-0042");
  });

  it("parses new task format", () => {
    const d = parseDecision("Action: delegate\nTarget: bob\nTask: new: Build login page");
    expect(d?.task).toBe("new: Build login page");
  });
});

// ── resolveAgentId ───────────────────────────────────────────────────────────

describe("resolveAgentId", () => {
  const agents = [
    makeAgent("tech-talent", "Tech Talent Agent"),
    makeAgent("mr-krabs", "Mr. Krabs"),
    makeAgent("frontend-dev", "Frontend Dev"),
    makeAgent("bug-hunter", "Bug Hunter"),
  ];

  it("matches exact ID", () => {
    expect(resolveAgentId("tech-talent", agents)).toBe("tech-talent");
  });

  it("matches exact name case-insensitively", () => {
    expect(resolveAgentId("Mr. Krabs", agents)).toBe("mr-krabs");
    expect(resolveAgentId("mr. krabs", agents)).toBe("mr-krabs");
  });

  it("matches partial name (contains)", () => {
    expect(resolveAgentId("Frontend", agents)).toBe("frontend-dev");
  });

  it("matches first name", () => {
    expect(resolveAgentId("Bug", agents)).toBe("bug-hunter");
  });

  it("matches partial ID", () => {
    expect(resolveAgentId("krabs", agents)).toBe("mr-krabs");
  });

  it("returns undefined for none", () => {
    expect(resolveAgentId("none", agents)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(resolveAgentId("", agents)).toBeUndefined();
  });

  it("returns undefined for no match", () => {
    expect(resolveAgentId("nonexistent-agent", agents)).toBeUndefined();
  });

  it("prefers exact ID over partial name match", () => {
    const testAgents = [
      makeAgent("tech", "Technology Lead"),
      makeAgent("tech-talent", "Tech Talent"),
    ];
    expect(resolveAgentId("tech", testAgents)).toBe("tech");
  });
});
