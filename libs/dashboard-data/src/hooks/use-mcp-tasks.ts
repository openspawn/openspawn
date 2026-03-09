/**
 * useMcpTasks — polls MCP task_list every 5 seconds.
 * Falls back to demo data when MCP is unreachable.
 */

import { useState, useEffect, useCallback } from "react";
import { taskList, McpError } from "../services/mcp-client";

export enum TaskPriority {
  Low = "low",
  Normal = "normal",
  High = "high",
  Critical = "critical",
}

export enum TaskStatus {
  Open = "open",
  Claimed = "claimed",
  InProgress = "in_progress",
  Review = "review",
  Done = "done",
}

export interface KanbanTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  assigneeAvatar?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const DEMO_TASKS: KanbanTask[] = [
  {
    id: "t1",
    title: "Fix order queue overflow",
    status: TaskStatus.Open,
    priority: TaskPriority.Critical,
    createdAt: "2026-02-26T10:00:00Z",
    updatedAt: "2026-02-26T10:00:00Z",
    description: "The Krusty Krab order queue crashes when more than 50 orders are pending.",
  },
  {
    id: "t2",
    title: "Design new menu layout",
    status: TaskStatus.Open,
    priority: TaskPriority.Normal,
    createdAt: "2026-02-26T09:00:00Z",
    updatedAt: "2026-02-26T09:00:00Z",
  },
  {
    id: "t3",
    title: "Audit jellyfish net inventory",
    status: TaskStatus.Open,
    priority: TaskPriority.Low,
    createdAt: "2026-02-26T08:00:00Z",
    updatedAt: "2026-02-26T08:00:00Z",
  },
  {
    id: "t4",
    title: "Update health & safety docs",
    status: TaskStatus.Open,
    priority: TaskPriority.Normal,
    createdAt: "2026-02-26T07:30:00Z",
    updatedAt: "2026-02-26T07:30:00Z",
  },
  {
    id: "t5",
    title: "Implement secret formula vault",
    status: TaskStatus.Claimed,
    priority: TaskPriority.Critical,
    assignee: "Sandy",
    createdAt: "2026-02-25T14:00:00Z",
    updatedAt: "2026-02-26T08:00:00Z",
    description: "Build a secure vault system for the secret formula with biometric locks.",
  },
  {
    id: "t6",
    title: "Restock shared dependencies",
    status: TaskStatus.Claimed,
    priority: TaskPriority.Low,
    assignee: "Agent Alpha",
    createdAt: "2026-02-25T16:00:00Z",
    updatedAt: "2026-02-26T09:00:00Z",
  },
  {
    id: "t7",
    title: "Fix webhook endpoint",
    status: TaskStatus.Claimed,
    priority: TaskPriority.High,
    assignee: "Agent Bravo",
    createdAt: "2026-02-25T12:00:00Z",
    updatedAt: "2026-02-26T07:00:00Z",
  },
  {
    id: "t8",
    title: "Optimize task throughput",
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    assignee: "Agent Alpha",
    createdAt: "2026-02-25T10:00:00Z",
    updatedAt: "2026-02-26T11:00:00Z",
    description: "Fine-tune the grill to achieve optimal processing throughput.",
  },
  {
    id: "t9",
    title: "Build customer feedback kiosk",
    status: TaskStatus.InProgress,
    priority: TaskPriority.Normal,
    assignee: "Sandy",
    createdAt: "2026-02-24T15:00:00Z",
    updatedAt: "2026-02-26T10:30:00Z",
  },
  {
    id: "t10",
    title: "Train new intake agent",
    status: TaskStatus.InProgress,
    priority: TaskPriority.Normal,
    assignee: "Agent Charlie",
    createdAt: "2026-02-24T09:00:00Z",
    updatedAt: "2026-02-26T12:00:00Z",
  },
  {
    id: "t11",
    title: "Update dashboard UI",
    status: TaskStatus.InProgress,
    priority: TaskPriority.Low,
    assignee: "Agent Charlie",
    createdAt: "2026-02-23T14:00:00Z",
    updatedAt: "2026-02-26T09:00:00Z",
  },
  {
    id: "t12",
    title: "Review agent schedules",
    status: TaskStatus.Review,
    priority: TaskPriority.High,
    assignee: "Agent Lead",
    createdAt: "2026-02-24T08:00:00Z",
    updatedAt: "2026-02-26T13:00:00Z",
    description: "All agent schedules for next sprint need final sign-off.",
  },
  {
    id: "t13",
    title: "Test new deployment pipeline",
    status: TaskStatus.Review,
    priority: TaskPriority.Normal,
    assignee: "Agent Alpha",
    createdAt: "2026-02-23T11:00:00Z",
    updatedAt: "2026-02-26T11:30:00Z",
  },
  {
    id: "t14",
    title: "Security camera installation",
    status: TaskStatus.Review,
    priority: TaskPriority.High,
    assignee: "Sandy",
    createdAt: "2026-02-22T10:00:00Z",
    updatedAt: "2026-02-26T14:00:00Z",
  },
  {
    id: "t15",
    title: "Update POS system",
    status: TaskStatus.Done,
    priority: TaskPriority.Critical,
    assignee: "Sandy",
    createdAt: "2026-02-20T09:00:00Z",
    updatedAt: "2026-02-25T16:00:00Z",
  },
  {
    id: "t16",
    title: "Clean up stale branches",
    status: TaskStatus.Done,
    priority: TaskPriority.Normal,
    assignee: "Agent Alpha",
    createdAt: "2026-02-21T07:00:00Z",
    updatedAt: "2026-02-25T10:00:00Z",
  },
  {
    id: "t17",
    title: "Fix logging pipeline",
    status: TaskStatus.Done,
    priority: TaskPriority.High,
    assignee: "Agent Bravo",
    createdAt: "2026-02-19T13:00:00Z",
    updatedAt: "2026-02-24T15:00:00Z",
  },
  {
    id: "t18",
    title: "Order new API keys",
    status: TaskStatus.Done,
    priority: TaskPriority.Low,
    assignee: "Agent Alpha",
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-02-23T09:00:00Z",
  },
];

function normalizeStatus(s: string): TaskStatus {
  const lower = s.toLowerCase().replace(/[\s-]/g, "_");
  if (lower === "open" || lower === "pending" || lower === "todo") return TaskStatus.Open;
  if (lower === "claimed" || lower === "assigned") return TaskStatus.Claimed;
  if (lower === "in_progress" || lower === "active" || lower === "working")
    return TaskStatus.InProgress;
  if (lower === "review" || lower === "reviewing" || lower === "completed")
    return TaskStatus.Review;
  if (lower === "done" || lower === "verified" || lower === "closed") return TaskStatus.Done;
  return TaskStatus.Open;
}

function normalizePriority(p: string | undefined): TaskPriority {
  if (!p) return TaskPriority.Normal;
  const lower = p.toLowerCase();
  if (lower === "critical" || lower === "urgent") return TaskPriority.Critical;
  if (lower === "high") return TaskPriority.High;
  if (lower === "low") return TaskPriority.Low;
  return TaskPriority.Normal;
}

export function useMcpTasks(intervalMs = 5000) {
  const [tasks, setTasks] = useState<KanbanTask[]>(DEMO_TASKS);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = (await taskList()) as Record<string, unknown>;
      const rawResult = Array.isArray(result) ? result : ((result?.tasks as unknown[]) ?? []);
      const raw = rawResult as Array<Record<string, unknown>>;
      if (raw.length > 0) {
        const mapped: KanbanTask[] = raw.map((t) => ({
          id: String(t.id || t.task_id || Math.random()),
          title: String(t.title || t.name || "Untitled"),
          status: normalizeStatus(String(t.status || "open")),
          priority: normalizePriority(t.priority as string | undefined),
          assignee: (t.assignee || t.agent_id || t.assigned_to || undefined) as string | undefined,
          description: (t.description || undefined) as string | undefined,
          createdAt: String(t.created_at || t.createdAt || new Date().toISOString()),
          updatedAt: String(t.updated_at || t.updatedAt || new Date().toISOString()),
        }));
        setTasks(mapped);
      }
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err instanceof McpError ? err.message : "MCP not connected — showing demo data");
      // Keep demo data
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { tasks, connected, error, refresh };
}
