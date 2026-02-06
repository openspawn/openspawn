import { z } from "zod";

import type { ApiClient } from "../api-client";

export function registerTaskTools(
  server: {
    tool: (
      name: string,
      description: string,
      schema: z.ZodObject<z.ZodRawShape>,
      handler: (params: Record<string, unknown>) => Promise<unknown>,
    ) => void;
  },
  client: ApiClient,
) {
  server.tool(
    "task_list",
    "List tasks with optional filters",
    z.object({
      status: z.string().optional().describe("Filter by status"),
      assigneeId: z.string().optional().describe("Filter by assignee"),
    }),
    async (params) => {
      const result = await client.listTasks(params);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    "task_create",
    "Create a new task",
    z.object({
      title: z.string().describe("Task title"),
      description: z.string().optional().describe("Task description"),
      priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
      assigneeId: z.string().optional().describe("Assignee agent ID"),
    }),
    async (params) => {
      const result = await client.createTask(params);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    "task_get",
    "Get a task by ID",
    z.object({
      id: z.string().describe("Task ID"),
    }),
    async (params) => {
      const result = await client.getTask(params.id);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    "task_transition",
    "Transition a task to a new status",
    z.object({
      id: z.string().describe("Task ID"),
      status: z
        .enum(["backlog", "todo", "in_progress", "review", "done", "blocked", "cancelled"])
        .describe("New status"),
      reason: z.string().optional().describe("Reason for transition"),
    }),
    async (params) => {
      const result = await client.transitionTask(params.id, params.status, params.reason);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    "task_assign",
    "Assign a task to an agent",
    z.object({
      id: z.string().describe("Task ID"),
      assigneeId: z.string().describe("Agent ID to assign"),
    }),
    async (params) => {
      const result = await client.assignTask(params.id, params.assigneeId);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    "task_comment",
    "Add a comment to a task",
    z.object({
      taskId: z.string().describe("Task ID"),
      body: z.string().describe("Comment text"),
    }),
    async (params) => {
      const result = await client.addTaskComment(params.taskId, params.body);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );
}
