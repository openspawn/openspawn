import { AgentRole, AgentStatus, EventSeverity, TaskStatus } from "@openspawn/shared-types";
import type { DemoEvent } from "../types";
import { AGENT_IDS } from "./agents";
import { TASK_IDS } from "./tasks";

// Helper to generate UUIDs
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Base timestamp
const BASE_TIME = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function daysAgo(days: number): string {
  return new Date(BASE_TIME.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export const events: DemoEvent[] = [
  // ========== AGENT LIFECYCLE ==========
  {
    id: uuid(),
    type: "agent.created",
    severity: EventSeverity.INFO,
    message: "Agent Dennis registered as COO",
    agentId: AGENT_IDS.agentDennis,
    createdAt: daysAgo(0),
    metadata: { level: 10, role: AgentRole.HR },
  },
  {
    id: uuid(),
    type: "agent.created",
    severity: EventSeverity.INFO,
    message: "Tech Talent Agent spawned by Agent Dennis",
    agentId: AGENT_IDS.techTalent,
    createdAt: daysAgo(2),
    metadata: { parentId: AGENT_IDS.agentDennis, domain: "Engineering" },
  },
  {
    id: uuid(),
    type: "agent.promoted",
    severity: EventSeverity.INFO,
    message: "Code Reviewer promoted to Level 6",
    agentId: AGENT_IDS.codeReviewer,
    createdAt: daysAgo(12),
    metadata: { previousLevel: 5, newLevel: 6 },
  },
  {
    id: uuid(),
    type: "agent.status_changed",
    severity: EventSeverity.WARNING,
    message: "Bookkeeper paused for maintenance",
    agentId: AGENT_IDS.bookkeeper,
    createdAt: daysAgo(5),
    metadata: { previousStatus: AgentStatus.ACTIVE, newStatus: AgentStatus.PAUSED },
  },
  {
    id: uuid(),
    type: "agent.created",
    severity: EventSeverity.INFO,
    message: "New Intern joined on probation",
    agentId: AGENT_IDS.newIntern,
    createdAt: daysAgo(25),
    metadata: { parentId: AGENT_IDS.codeReviewer, level: 1 },
  },

  // ========== TASK EVENTS ==========
  {
    id: uuid(),
    type: "task.created",
    severity: EventSeverity.INFO,
    message: "Task created: Implement OAuth2 authentication",
    taskId: TASK_IDS.implementAuth,
    agentId: AGENT_IDS.agentDennis,
    createdAt: daysAgo(5),
  },
  {
    id: uuid(),
    type: "task.assigned",
    severity: EventSeverity.INFO,
    message: "Bug Hunter assigned to fix memory leak",
    taskId: TASK_IDS.fixBug123,
    agentId: AGENT_IDS.bugHunter,
    createdAt: daysAgo(1),
  },
  {
    id: uuid(),
    type: "task.completed",
    severity: EventSeverity.INFO,
    message: "CI pipeline setup completed",
    taskId: TASK_IDS.setupCI,
    agentId: AGENT_IDS.codeReviewer,
    createdAt: daysAgo(7),
    metadata: { creditsEarned: 150 },
  },
  {
    id: uuid(),
    type: "task.completed",
    severity: EventSeverity.INFO,
    message: "Q4 financial report delivered",
    taskId: TASK_IDS.quarterlyReport,
    agentId: AGENT_IDS.analyst,
    createdAt: daysAgo(15),
    metadata: { creditsEarned: 200 },
  },

  // ========== CREDIT EVENTS ==========
  {
    id: uuid(),
    type: "credits.allocated",
    severity: EventSeverity.INFO,
    message: "Initial budget of 100,000 credits allocated to COO",
    agentId: AGENT_IDS.agentDennis,
    createdAt: daysAgo(0),
    metadata: { amount: 100000 },
  },
  {
    id: uuid(),
    type: "credits.transferred",
    severity: EventSeverity.INFO,
    message: "5,000 credits transferred to Tech Talent",
    agentId: AGENT_IDS.techTalent,
    createdAt: daysAgo(10),
    metadata: { amount: 5000, fromAgent: AGENT_IDS.agentDennis },
  },
  {
    id: uuid(),
    type: "credits.low_balance",
    severity: EventSeverity.WARNING,
    message: "New Intern balance below 200 credits",
    agentId: AGENT_IDS.newIntern,
    createdAt: hoursAgo(6),
    metadata: { balance: 100, threshold: 200 },
  },

  // ========== SYSTEM EVENTS ==========
  {
    id: uuid(),
    type: "system.startup",
    severity: EventSeverity.INFO,
    message: "OpenSpawn system initialized",
    createdAt: daysAgo(0),
    metadata: { version: "0.1.0" },
  },
  {
    id: uuid(),
    type: "system.daily_reset",
    severity: EventSeverity.DEBUG,
    message: "Daily budget reset job completed",
    createdAt: daysAgo(1),
    metadata: { agentsProcessed: 14 },
  },
  {
    id: uuid(),
    type: "system.health_check",
    severity: EventSeverity.DEBUG,
    message: "System health check passed",
    createdAt: hoursAgo(1),
    metadata: { apiLatency: 45, dbLatency: 12 },
  },

  // ========== RECENT ACTIVITY ==========
  {
    id: uuid(),
    type: "task.status_changed",
    severity: EventSeverity.INFO,
    message: "API refactor moved to in_progress",
    taskId: TASK_IDS.apiRefactor,
    agentId: AGENT_IDS.codeReviewer,
    createdAt: hoursAgo(2),
    metadata: { previousStatus: TaskStatus.ASSIGNED, newStatus: TaskStatus.IN_PROGRESS },
  },
  {
    id: uuid(),
    type: "credits.spent",
    severity: EventSeverity.DEBUG,
    message: "Model usage: 45 credits for claude-sonnet-4",
    agentId: AGENT_IDS.codeReviewer,
    createdAt: hoursAgo(2),
    metadata: { model: "claude-sonnet-4", tokens: 2300 },
  },
  {
    id: uuid(),
    type: "agent.activity",
    severity: EventSeverity.DEBUG,
    message: "SEO Bot analyzing marketing site",
    agentId: AGENT_IDS.seoBot,
    taskId: TASK_IDS.seoAudit,
    createdAt: minutesAgo(30),
  },
  {
    id: uuid(),
    type: "task.review_requested",
    severity: EventSeverity.INFO,
    message: "PR review requested for caching layer",
    taskId: TASK_IDS.prReview,
    agentId: AGENT_IDS.codeReviewer,
    createdAt: hoursAgo(4),
  },
];

// Export helper functions
export function getEventsByAgent(agentId: string): DemoEvent[] {
  return events.filter((e) => e.agentId === agentId);
}

export function getEventsByTask(taskId: string): DemoEvent[] {
  return events.filter((e) => e.taskId === taskId);
}

export function getEventsBySeverity(severity: EventSeverity): DemoEvent[] {
  return events.filter((e) => e.severity === severity);
}

export function getEventsByType(type: string): DemoEvent[] {
  return events.filter((e) => e.type === type);
}

export function getRecentEvents(count = 10): DemoEvent[] {
  return [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, count);
}

export function generateEvent(
  type: string,
  severity: EventSeverity,
  message: string,
  extra?: { agentId?: string; taskId?: string; metadata?: Record<string, unknown> },
): DemoEvent {
  return {
    id: uuid(),
    type,
    severity,
    message,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}
