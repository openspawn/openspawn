// ── MCP Tool Definitions ─────────────────────────────────────────────────────

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseOrgMd, parseOrgMdContent, generateOrgMd } from "../core/org-parser.js";
import { createTask, listTasks, claimTask, updateTask } from "../core/task-store.js";
import { getBudget, spend, getAllBudgets, setBudgetLimit } from "../core/budget.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Agent, ParsedOrg } from "../core/types.js";

function resolveOrgFile(dir: string, orgFile?: string): string {
  return orgFile ?? dir + "/ORG.md";
}

export function registerTools(server: McpServer, dir: string, orgFile?: string): void {
  const orgPath = () => resolveOrgFile(dir, orgFile);

  // ── org_read ───────────────────────────────────────────────────────────
  server.tool("org_read", "Parse ORG.md and return the structured organization", {}, async () => {
    const path = orgPath();
    if (!existsSync(path))
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "ORG.md not found at " + path }) }],
      };
    const org = parseOrgMd(path);
    return { content: [{ type: "text", text: JSON.stringify(org, null, 2) }] };
  });

  // ── org_update ─────────────────────────────────────────────────────────
  server.tool(
    "org_update",
    "Update ORG.md (add/remove agents, update policies)",
    {
      action: z.enum(["add_agent", "remove_agent", "set_policy"]).describe("What to update"),
      agentName: z.string().optional().describe("Agent name (for add/remove)"),
      agentLevel: z.number().optional().describe("Agent level (for add)"),
      agentDomain: z.string().optional().describe("Agent domain (for add)"),
      agentParent: z.string().optional().describe("Parent agent id (for add)"),
      agentModel: z.string().optional().describe("Model (for add)"),
      policyKey: z.string().optional().describe("Policy key (for set_policy)"),
      policyValue: z.string().optional().describe("Policy value (for set_policy)"),
    },
    async (params) => {
      const path = orgPath();
      let org: ParsedOrg;
      if (existsSync(path)) {
        org = parseOrgMd(path);
      } else {
        org = { name: "Unnamed Org", agents: [], culture: {}, policies: {} };
      }

      if (params.action === "add_agent" && params.agentName) {
        const id = params.agentName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        org.agents.push({
          id,
          name: params.agentName,
          role: "worker",
          level: params.agentLevel ?? 4,
          domain: params.agentDomain ?? "general",
          parentId: params.agentParent,
          model: params.agentModel,
          status: "active",
        });
      } else if (params.action === "remove_agent" && params.agentName) {
        const id = params.agentName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        org.agents = org.agents.filter(
          (a) => a.id !== id && a.name.toLowerCase() !== params.agentName!.toLowerCase(),
        );
      } else if (params.action === "set_policy" && params.policyKey && params.policyValue) {
        const key = params.policyKey;
        if (key === "perAgentBudget") {
          org.policies.perAgentBudget = Number(params.policyValue);
        } else if (key === "alertThreshold") {
          org.policies.alertThreshold = Number(params.policyValue);
        }
      }

      writeFileSync(path, generateOrgMd(org));
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, agents: org.agents.length }) }],
      };
    },
  );

  // ── task_list ──────────────────────────────────────────────────────────
  server.tool(
    "task_list",
    "List tasks, optionally filtered",
    {
      assignee: z.string().optional(),
      status: z.enum(["open", "claimed", "in-progress", "done", "blocked"]).optional(),
    },
    async (params) => {
      const tasks = listTasks(dir, params);
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
    },
  );

  // ── task_create ────────────────────────────────────────────────────────
  server.tool(
    "task_create",
    "Create a new task",
    {
      description: z.string().describe("Task description"),
      assignee: z.string().optional(),
      delegatedBy: z.string().optional(),
    },
    async (params) => {
      const task = createTask(dir, params.description, params);
      return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
    },
  );

  // ── task_claim ─────────────────────────────────────────────────────────
  server.tool(
    "task_claim",
    "Claim the next available task (or a specific one)",
    {
      agentId: z.string().describe("Agent claiming the task"),
      taskId: z.string().optional().describe("Specific task id to claim"),
    },
    async (params) => {
      const task = claimTask(dir, params.agentId, params.taskId);
      if (!task)
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "No open task found" }) }],
        };
      return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
    },
  );

  // ── task_update ────────────────────────────────────────────────────────
  server.tool(
    "task_update",
    "Update task status/progress",
    {
      taskId: z.string(),
      status: z.enum(["open", "claimed", "in-progress", "done", "blocked"]).optional(),
      pr: z.number().optional(),
    },
    async (params) => {
      const task = updateTask(dir, params.taskId, params);
      if (!task)
        return { content: [{ type: "text", text: JSON.stringify({ error: "Task not found" }) }] };
      return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
    },
  );

  // ── delegate ───────────────────────────────────────────────────────────
  server.tool(
    "delegate",
    "Delegate a task down the hierarchy",
    {
      description: z.string().describe("Task description"),
      from: z.string().describe("Delegating agent id"),
      to: z.string().describe("Target agent id"),
    },
    async (params) => {
      // Verify hierarchy if org exists
      const path = orgPath();
      if (existsSync(path)) {
        const org = parseOrgMd(path);
        const fromAgent = org.agents.find((a) => a.id === params.from);
        const toAgent = org.agents.find((a) => a.id === params.to);
        if (fromAgent && toAgent && toAgent.level >= fromAgent.level) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Cannot delegate to agent of equal or higher level",
                }),
              },
            ],
          };
        }
      }
      const task = createTask(dir, params.description, {
        assignee: params.to,
        delegatedBy: params.from,
      });
      return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
    },
  );

  // ── escalate ───────────────────────────────────────────────────────────
  server.tool(
    "escalate",
    "Escalate a task up the hierarchy",
    {
      taskId: z.string(),
      reason: z.string(),
      agentId: z.string().describe("Agent escalating"),
    },
    async (params) => {
      const path = orgPath();
      let parentId: string | undefined;
      if (existsSync(path)) {
        const org = parseOrgMd(path);
        const agent = org.agents.find((a) => a.id === params.agentId);
        parentId = agent?.parentId;
      }
      const task = updateTask(dir, params.taskId, { status: "blocked", assignee: parentId });
      if (!task)
        return { content: [{ type: "text", text: JSON.stringify({ error: "Task not found" }) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...task,
              escalationReason: params.reason,
              escalatedTo: parentId,
            }),
          },
        ],
      };
    },
  );

  // ── hire ───────────────────────────────────────────────────────────────
  server.tool(
    "hire",
    "Add an agent to the organization",
    {
      name: z.string(),
      level: z.number().optional(),
      domain: z.string().optional(),
      parent: z.string().optional(),
      model: z.string().optional(),
    },
    async (params) => {
      const path = orgPath();
      let org: ParsedOrg;
      if (existsSync(path)) {
        org = parseOrgMd(path);
      } else {
        org = { name: "Unnamed Org", agents: [], culture: {}, policies: {} };
      }
      const id = params.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const agent: Agent = {
        id,
        name: params.name,
        role: "worker",
        level: params.level ?? 4,
        domain: params.domain ?? "general",
        parentId: params.parent,
        model: params.model,
        status: "active",
      };
      org.agents.push(agent);
      writeFileSync(path, generateOrgMd(org));
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, agent }) }] };
    },
  );

  // ── fire ───────────────────────────────────────────────────────────────
  server.tool(
    "fire",
    "Remove an agent from the organization",
    {
      name: z.string(),
    },
    async (params) => {
      const path = orgPath();
      if (!existsSync(path))
        return { content: [{ type: "text", text: JSON.stringify({ error: "No ORG.md" }) }] };
      const org = parseOrgMd(path);
      const before = org.agents.length;
      const id = params.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      org.agents = org.agents.filter(
        (a) => a.id !== id && a.name.toLowerCase() !== params.name.toLowerCase(),
      );
      writeFileSync(path, generateOrgMd(org));
      return {
        content: [
          { type: "text", text: JSON.stringify({ ok: true, removed: before - org.agents.length }) },
        ],
      };
    },
  );

  // ── budget_check ───────────────────────────────────────────────────────
  server.tool(
    "budget_check",
    "Check an agent's remaining budget",
    {
      agentId: z.string(),
    },
    async (params) => {
      const budget = getBudget(dir, params.agentId);
      if (!budget)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: "No budget set", agentId: params.agentId }),
            },
          ],
        };
      const remaining = Math.round((budget.limit - budget.spent) * 100) / 100;
      return { content: [{ type: "text", text: JSON.stringify({ ...budget, remaining }) }] };
    },
  );

  // ── budget_spend ───────────────────────────────────────────────────────
  server.tool(
    "budget_spend",
    "Record a spend against an agent's budget",
    {
      agentId: z.string(),
      amount: z.number(),
      currency: z.string().optional(),
    },
    async (params) => {
      const result = spend(dir, params.agentId, params.amount, params.currency);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  );

  // ── report ─────────────────────────────────────────────────────────────
  server.tool(
    "report",
    "Agent reports status or completion",
    {
      agentId: z.string(),
      taskId: z.string().optional(),
      status: z.string().describe("Status message"),
      pr: z.number().optional(),
    },
    async (params) => {
      if (params.taskId) {
        const task = updateTask(dir, params.taskId, {
          status: params.pr ? "done" : "in-progress",
          pr: params.pr,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ agentId: params.agentId, status: params.status, task }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ agentId: params.agentId, status: params.status }),
          },
        ],
      };
    },
  );
}
