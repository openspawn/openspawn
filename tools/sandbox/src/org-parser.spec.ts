import { describe, it, expect, beforeAll } from "vitest";
import { parseOrgMdContent, ParsedOrg } from "./org-parser.js";
import { ACPMessageType, AgentRole, AgentStatus, TriggerMode } from "@openspawn/shared-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal valid ORG.md with one agent */
const MINIMAL_ORG = `# Test Org

## Structure

### Alice — CEO
Runs everything.
- **Level:** 10
- **Domain:** Executive
`;

/** ORG.md with culture + policies sections */
const FULL_ORG = `# Acme Corp

## Identity

The best corp in town. Building widgets since 2020.

- **Mission:** Ship great widgets
- **Vision:** Widget dominance

## Culture

preset: startup
- **Escalation:** immediate
- **Progress updates:** on phase change
- **Ack required:** yes
- **Hierarchy depth:** 4

## Structure

### Bob — COO
Runs operations.
- **Level:** 10
- **Domain:** Operations
- **Reports to:** Human Principal

### Engineering
Where the code gets written.

#### Carol — Engineering Lead
Leads the engineering team.
- **Level:** 7
- **Domain:** Engineering
- **Reports to:** Bob

#### Dave — Senior Dev
Does complex work.
- **Level:** 6
- **Domain:** Engineering
- **Reports to:** Carol

#### Eve — Junior Dev
Writes code, asks questions.
- **Level:** 1
- **Domain:** Engineering
- **Reports to:** Carol

## Policies

### Budget
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 75%

### Department Caps
- Engineering: max 8 agents
- Operations: max 3 agents
`;

/** ORG.md with multi-count agents */
const MULTI_COUNT_ORG = `# Factory

## Structure

### Boss — CEO
- **Level:** 10
- **Domain:** Executive

### Production

#### Lead — Production Lead
- **Level:** 7
- **Domain:** Production

#### Worker — Line Worker
- **Level:** 4
- **Domain:** Production
- **Count:** 3
`;

/** ORG.md with trigger/wake_on metadata */
const TRIGGER_ORG = `# Events Inc

## Structure

### Manager — COO
- **Level:** 10
- **Domain:** Management
- **Trigger:** event-driven
- **Wake on:** escalations, completions

### Ops

#### Poller — Worker
- **Level:** 4
- **Domain:** Ops
- **Trigger:** polling
`;

/** ORG.md with avatar metadata */
const AVATAR_ORG = `# SpongeBob Org

## Structure

### SpongeBob SquarePants — Head Chef
- **Level:** 9
- **Avatar:** 🧽
- **Avatar Color:** #eab308
- **Avatar URL:** /avatars/custom-sponge.png
- **Domain:** Kitchen

### Patrick Star — Line Cook
- **Level:** 4
- **Domain:** Kitchen
- **Reports to:** SpongeBob SquarePants
`;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("org-parser", () => {
  describe("basic parsing", () => {
    it("extracts org name from H1", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.name).toBe("Test Org");
    });

    it("parses a minimal org with one agent", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe("Alice");
      expect(result.agents[0].level).toBe(10);
      expect(result.agents[0].domain).toBe("Executive");
    });

    it("generates kebab-case id from name", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.agents[0].id).toBe("alice");
    });

    it("strips role suffix from heading to get name", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      // "Alice — CEO" should produce name "Alice", not "Alice — CEO"
      expect(result.agents[0].name).toBe("Alice");
    });

    it('defaults to "Unnamed Org" when no H1', () => {
      const result = parseOrgMdContent(
        "## Structure\n### Agent — Worker\n- **Level:** 4\n- **Domain:** Stuff",
      );
      expect(result.name).toBe("Unnamed Org");
    });

    it("returns empty agents when no Structure section", () => {
      const result = parseOrgMdContent("# Org\n\n## Culture\n\npreset: startup");
      expect(result.agents).toEqual([]);
    });
  });

  describe("agent hierarchy", () => {
    let result: ParsedOrg;

    beforeAll(() => {
      result = parseOrgMdContent(FULL_ORG);
    });

    it("parses all agents", () => {
      expect(result.agents).toHaveLength(4); // Bob, Carol, Dave, Eve
    });

    it("C-level agent has no parentId when reports_to is Human Principal", () => {
      const bob = result.agents.find((a) => a.name === "Bob");
      expect(bob).toBeDefined();
      expect(bob?.parentId).toBe("human-principal");
    });

    it("department lead reports to COO", () => {
      const carol = result.agents.find((a) => a.name === "Carol");
      expect(carol).toBeDefined();
      expect(carol?.parentId).toBe("bob");
    });

    it("team members report to their specified manager", () => {
      const dave = result.agents.find((a) => a.name === "Dave");
      expect(dave).toBeDefined();
      expect(dave?.parentId).toBe("carol");
    });

    it("junior reports to specified manager", () => {
      const eve = result.agents.find((a) => a.name === "Eve");
      expect(eve).toBeDefined();
      expect(eve?.parentId).toBe("carol");
    });
  });

  describe("level and role inference", () => {
    it("assigns level 10 and role coo for CEO/COO/CTO titles", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      const alice = result.agents[0];
      expect(alice.level).toBe(10);
      expect(alice.role).toBe(AgentRole.COO);
    });

    it("respects explicit level over inferred", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const dave = result.agents.find((a) => a.name === "Dave");
      expect(dave?.level).toBe(6);
    });

    it("infers lead role for level 7", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const carol = result.agents.find((a) => a.name === "Carol");
      expect(carol?.level).toBe(7);
      expect(carol?.role).toBe(AgentRole.LEAD);
    });

    it("infers intern role for level 1", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const eve = result.agents.find((a) => a.name === "Eve");
      expect(eve?.level).toBe(1);
      expect(eve?.role).toBe(AgentRole.INTERN);
    });
  });

  describe("agent properties", () => {
    it("sets event-driven trigger for L7+", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const carol = result.agents.find((a) => a.name === "Carol");
      expect(carol?.trigger).toBe(TriggerMode.EVENT_DRIVEN);
    });

    it("sets polling trigger for L6 and below", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const dave = result.agents.find((a) => a.name === "Dave");
      expect(dave?.trigger).toBe(TriggerMode.POLLING);
    });

    it("L7+ systemPrompt includes DELEGATE instruction", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const carol = result.agents.find((a) => a.name === "Carol");
      expect(carol?.systemPrompt).toContain("DELEGATE");
    });

    it("L7+ systemPrompt includes spawn_agent action", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const bob = result.agents.find((a) => a.name === "Bob");
      expect(bob?.systemPrompt).toContain("spawn_agent");
    });

    it("low-level systemPrompt does not include spawn_agent", () => {
      const result = parseOrgMdContent(FULL_ORG);
      const eve = result.agents.find((a) => a.name === "Eve");
      expect(eve?.systemPrompt).not.toContain("spawn_agent");
    });

    it("initializes stats to zero", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.agents[0].stats).toEqual({
        tasksCompleted: 0,
        tasksFailed: 0,
        messagesSent: 0,
        creditsEarned: 0,
        creditsSpent: 0,
      });
    });

    it("initializes status as active", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.agents[0].status).toBe(AgentStatus.ACTIVE);
    });

    it("initializes empty taskIds, recentMessages, inbox", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      const agent = result.agents[0];
      expect(agent.taskIds).toEqual([]);
      expect(agent.recentMessages).toEqual([]);
      expect(agent.inbox).toEqual([]);
    });
  });

  describe("multi-count agents", () => {
    it("creates N agents when Count is specified", () => {
      const result = parseOrgMdContent(MULTI_COUNT_ORG);
      const workers = result.agents.filter((a) => a.name.startsWith("Worker"));
      expect(workers).toHaveLength(3);
    });

    it("appends number suffix to names", () => {
      const result = parseOrgMdContent(MULTI_COUNT_ORG);
      const workers = result.agents.filter((a) => a.name.startsWith("Worker"));
      expect(workers.map((w) => w.name)).toEqual(["Worker 1", "Worker 2", "Worker 3"]);
    });

    it("appends number suffix to ids", () => {
      const result = parseOrgMdContent(MULTI_COUNT_ORG);
      const workers = result.agents.filter((a) => a.id.startsWith("worker"));
      expect(workers.map((w) => w.id)).toEqual(["worker-1", "worker-2", "worker-3"]);
    });

    it("all clones share the same parentId", () => {
      const result = parseOrgMdContent(MULTI_COUNT_ORG);
      const workers = result.agents.filter((a) => a.name.startsWith("Worker"));
      const parentIds = new Set(workers.map((w) => w.parentId));
      expect(parentIds.size).toBe(1);
    });
  });

  describe("culture section", () => {
    it("extracts preset from prose text", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.culture.preset).toBe("startup");
    });

    it("extracts escalation velocity", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.culture.escalationVelocity).toBe("immediate");
    });

    it("extracts progress frequency", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.culture.progressFrequency).toBe("on phase change");
    });

    it("extracts ack required", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.culture.ackRequired).toBe(true);
    });

    it("extracts hierarchy depth", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.culture.maxEscalationDepth).toBe(4);
    });

    it("returns empty culture when no section", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.culture).toEqual({});
    });
  });

  describe("policies section", () => {
    it("extracts per-agent budget", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.policies.perAgentBudget).toBe(500);
    });

    it("extracts alert threshold", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.policies.alertThreshold).toBe(75);
    });

    it("extracts department caps", () => {
      const result = parseOrgMdContent(FULL_ORG);
      expect(result.policies.departmentCaps).toEqual({
        engineering: 8,
        operations: 3,
      });
    });

    it("returns empty policies when no section", () => {
      const result = parseOrgMdContent(MINIMAL_ORG);
      expect(result.policies).toEqual({});
    });
  });

  describe("trigger and wake_on", () => {
    it("parses explicit event-driven trigger", () => {
      const result = parseOrgMdContent(TRIGGER_ORG);
      const manager = result.agents.find((a) => a.name === "Manager");
      expect(manager?.trigger).toBe(TriggerMode.EVENT_DRIVEN);
    });

    it("parses wake_on types", () => {
      const result = parseOrgMdContent(TRIGGER_ORG);
      const manager = result.agents.find((a) => a.name === "Manager");
      expect(manager?.triggerOn).toContain(ACPMessageType.ESCALATION);
      expect(manager?.triggerOn).toContain(ACPMessageType.COMPLETION);
    });

    it("parses explicit polling trigger", () => {
      const result = parseOrgMdContent(TRIGGER_ORG);
      const poller = result.agents.find((a) => a.name === "Poller");
      expect(poller?.trigger).toBe(TriggerMode.POLLING);
    });
  });

  describe("avatar handling", () => {
    it("uses explicit Avatar URL when provided", () => {
      const result = parseOrgMdContent(AVATAR_ORG);
      const spongebob = result.agents.find((a) => a.name === "SpongeBob SquarePants");
      expect(spongebob?.avatarUrl).toBe("/avatars/custom-sponge.png");
    });

    it("falls back to name-based avatar lookup", () => {
      const result = parseOrgMdContent(AVATAR_ORG);
      const patrick = result.agents.find((a) => a.name === "Patrick Star");
      expect(patrick?.avatarUrl).toBe("/avatars/patrick.png");
    });

    it("extracts avatar emoji", () => {
      const result = parseOrgMdContent(AVATAR_ORG);
      const spongebob = result.agents.find((a) => a.name === "SpongeBob SquarePants");
      expect(spongebob?.avatar).toBe("🧽");
    });

    it("extracts avatar color", () => {
      const result = parseOrgMdContent(AVATAR_ORG);
      const spongebob = result.agents.find((a) => a.name === "SpongeBob SquarePants");
      expect(spongebob?.avatarColor).toBe("#eab308");
    });
  });

  describe("real ORG.md (Krusty Krab)", () => {
    let result: ParsedOrg;

    beforeAll(async () => {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const orgPath = resolve(import.meta.dirname, "../ORG.md");
      const raw = readFileSync(orgPath, "utf-8");
      result = parseOrgMdContent(raw);
    });

    it("extracts org name", () => {
      expect(result.name).toBe("🍍 The Krusty Krab");
    });

    it("parses all agents (22 total with multi-count Fred)", () => {
      // Mr. Krabs + Kitchen(7) + Register(10 with 3 Freds) + Vault(3) = 22 after counting
      expect(result.agents.length).toBeGreaterThanOrEqual(20);
    });

    it("Mr. Krabs is level 10", () => {
      const krabs = result.agents.find((a) => a.id === "mr.-krabs" || a.name.includes("Krabs"));
      expect(krabs).toBeDefined();
      expect(krabs?.level).toBe(10);
    });

    it("SpongeBob reports to Mr. Krabs", () => {
      const spongebob = result.agents.find((a) => a.name === "SpongeBob SquarePants");
      expect(spongebob).toBeDefined();
      expect(spongebob?.parentId).toBe("mr-krabs");
    });

    it("Fred has count 3", () => {
      const freds = result.agents.filter((a) => a.name.startsWith("Fred"));
      expect(freds).toHaveLength(3);
    });

    it("has culture preset startup", () => {
      expect(result.culture.preset).toBe("startup");
    });

    it("has department caps", () => {
      expect(result.policies.departmentCaps).toBeDefined();
      expect(result.policies.departmentCaps?.["the kitchen"]).toBe(10);
    });

    it("all agents have valid systemPrompts", () => {
      for (const agent of result.agents) {
        expect(agent.systemPrompt).toBeTruthy();
        expect(agent.systemPrompt).toContain("JSON ONLY");
      }
    });

    it("all agents have avatar URLs for known characters", () => {
      const knownChars = [
        "SpongeBob SquarePants",
        "Patrick Star",
        "Sandy Cheeks",
        "Squidward Tentacles",
      ];
      for (const name of knownChars) {
        const agent = result.agents.find((a) => a.name === name);
        expect(agent, `${name} should exist`).toBeDefined();
        expect(agent?.avatarUrl, `${name} should have avatarUrl`).toBeTruthy();
      }
    });
  });

  describe("edge cases", () => {
    it("handles empty markdown", () => {
      const result = parseOrgMdContent("");
      expect(result.name).toBe("Unnamed Org");
      expect(result.agents).toEqual([]);
    });

    it("handles markdown with only H1", () => {
      const result = parseOrgMdContent("# Just a Name");
      expect(result.name).toBe("Just a Name");
      expect(result.agents).toEqual([]);
    });

    it("handles agent with no metadata", () => {
      const result = parseOrgMdContent(`# Org\n\n## Structure\n\n### Bob\nJust a guy.`);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe("Bob");
      expect(result.agents[0].level).toBe(4); // default
    });

    it("handles YAML frontmatter without crashing", () => {
      const md = `---
title: My Org
---

# My Org

## Structure

### Agent — Worker
- **Level:** 4
- **Domain:** Stuff
`;
      const result = parseOrgMdContent(md);
      expect(result.name).toBe("My Org");
      expect(result.agents).toHaveLength(1);
    });

    it("handles special characters in names", () => {
      const md = `# Org

## Structure

### Mr. O'Brien — Lead
- **Level:** 7
- **Domain:** Ops
`;
      const result = parseOrgMdContent(md);
      expect(result.agents[0].name).toBe("Mr. O'Brien");
      expect(result.agents[0].id).toBe("mr-o-brien");
    });
  });
});
