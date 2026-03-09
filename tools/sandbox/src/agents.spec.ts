import { describe, it, expect } from "vitest";
import {
  createAgents,
  createCOO,
  getAgent,
  getChildren,
  getParent,
  makeAgentPublic,
} from "./agents.js";

describe("createAgents", () => {
  const agents = createAgents();

  it("creates 32 agents", () => {
    expect(agents).toHaveLength(32);
  });

  it("all agents have required fields", () => {
    for (const a of agents) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.role).toBeTruthy();
      expect(a.level).toBeGreaterThanOrEqual(1);
      expect(a.level).toBeLessThanOrEqual(10);
      expect(a.domain).toBeTruthy();
      expect(a.status).toBe("active");
      expect(a.systemPrompt).toBeTruthy();
      expect(a.taskIds).toEqual([]);
      expect(a.recentMessages).toEqual([]);
      expect(a.inbox).toEqual([]);
      expect(a.stats).toBeDefined();
    }
  });

  it("has exactly one COO at L10", () => {
    const coos = agents.filter((a) => a.role === "coo");
    expect(coos).toHaveLength(1);
    expect(coos[0].level).toBe(10);
    expect(coos[0].id).toBe("mr-krabs");
  });

  it("COO has no parent", () => {
    const coo = agents.find((a) => a.role === "coo");
    expect(coo).toBeDefined();
    expect(coo?.parentId).toBeUndefined();
  });

  it("all non-COO agents have a parentId", () => {
    const nonCoo = agents.filter((a) => a.role !== "coo");
    for (const a of nonCoo) {
      expect(a.parentId).toBeTruthy();
    }
  });

  it("L7+ agents are event-driven by default", () => {
    const highLevel = agents.filter((a) => a.level >= 7);
    for (const a of highLevel) {
      expect(a.trigger).toBe("event-driven");
      expect(a.triggerOn).toBeDefined();
    }
  });

  it("L1-6 agents are polling by default", () => {
    const lowLevel = agents.filter((a) => a.level < 7);
    for (const a of lowLevel) {
      expect(a.trigger).toBe("polling");
    }
  });

  it("agent IDs are unique", () => {
    const ids = agents.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("system prompts mention spawn for L7+", () => {
    const l7plus = agents.filter((a) => a.level >= 7);
    for (const a of l7plus) {
      expect(a.systemPrompt).toContain("spawn_agent");
    }
  });

  it("system prompts do NOT mention spawn for L<7", () => {
    const lowLevel = agents.filter((a) => a.level < 7);
    for (const a of lowLevel) {
      expect(a.systemPrompt).not.toContain("spawn_agent");
    }
  });

  it("has agents across multiple domains", () => {
    const domains = new Set(agents.map((a) => a.domain));
    expect(domains.size).toBeGreaterThanOrEqual(5);
  });

  it("has all role types", () => {
    const roles = new Set(agents.map((a) => a.role));
    expect(roles).toContain("coo");
    expect(roles).toContain("talent");
    expect(roles).toContain("lead");
    expect(roles).toContain("senior");
    expect(roles).toContain("worker");
    expect(roles).toContain("intern");
  });
});

describe("createCOO", () => {
  it("returns array with one agent", () => {
    const agents = createCOO();
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe("mr-krabs");
    expect(agents[0].level).toBe(10);
  });
});

describe("getAgent", () => {
  const agents = createAgents();

  it("finds agent by ID", () => {
    expect(getAgent(agents, "mr-krabs")?.name).toBe("Mr. Krabs");
  });

  it("returns undefined for unknown ID", () => {
    expect(getAgent(agents, "nobody")).toBeUndefined();
  });
});

describe("getChildren", () => {
  const agents = createAgents();

  it("returns direct reports of COO", () => {
    const children = getChildren(agents, "mr-krabs");
    expect(children.length).toBeGreaterThan(0);
    for (const c of children) {
      expect(c.parentId).toBe("mr-krabs");
    }
  });

  it("returns empty for agent with no reports", () => {
    expect(getChildren(agents, "intern-1")).toHaveLength(0);
  });
});

describe("getParent", () => {
  const agents = createAgents();

  it("returns parent agent", () => {
    const techTalent = getAgent(agents, "tech-talent");
    expect(techTalent).toBeDefined();
    if (!techTalent) return;
    const parent = getParent(agents, techTalent);
    expect(parent?.id).toBe("mr-krabs");
  });

  it("returns undefined for COO", () => {
    const coo = getAgent(agents, "mr-krabs");
    expect(coo).toBeDefined();
    if (!coo) return;
    expect(getParent(agents, coo)).toBeUndefined();
  });
});

describe("makeAgentPublic", () => {
  it("creates an agent with specified properties", () => {
    const agent = makeAgentPublic(
      "test-agent",
      "Test",
      "worker",
      4,
      "Engineering",
      "parent-1",
      "A test agent",
    );
    expect(agent.id).toBe("test-agent");
    expect(agent.name).toBe("Test");
    expect(agent.level).toBe(4);
    expect(agent.parentId).toBe("parent-1");
    expect(agent.systemPrompt).toContain("Test");
  });
});
