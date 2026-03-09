/**
 * useDashboardPanels — typed helpers to open agent/task detail panels.
 *
 * This is the DRY glue between the data layer (agents, tasks) and the
 * shared UI panels. Import this hook in any dashboard page and call
 * openAgentPanel(id) or openTaskPanel(id).
 */
import { createElement, useCallback } from "react";
import { useSidePanel } from "../contexts/side-panel-context";

/* ── Lazy panel imports ────────────────────────────────────────── */
// We use string-based type to avoid hard dependency on dashboard-ui at
// the data layer. Consumers must pass the panel components once at app root.

interface AgentPanelData {
  id: string;
  name: string;
  parentId?: string;
  [key: string]: unknown;
}

interface TaskPanelData {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assignee?: { id: string };
  [key: string]: unknown;
}

interface PanelComponents {
  AgentDetailPanel: React.ComponentType<{
    agent: AgentPanelData;
    tasks?: Array<{
      id: string;
      identifier: string;
      title: string;
      status: string;
      priority: string;
    }>;
    parentName?: string;
    onTaskClick?: (taskId: string) => void;
  }>;
  TaskDetailPanel: React.ComponentType<{
    task: TaskPanelData;
    onAgentClick?: (agentId: string) => void;
  }>;
}

let _panels: PanelComponents | null = null;

/** Call once at app root to register the panel components */
export function registerPanelComponents(panels: PanelComponents) {
  _panels = panels;
}

/* ── Hook ──────────────────────────────────────────────────────── */

interface DashboardPanelsOptions {
  agents: AgentPanelData[];
  tasks: TaskPanelData[];
}

export function useDashboardPanels({ agents, tasks }: DashboardPanelsOptions) {
  const { openSidePanel, closeSidePanel } = useSidePanel();

  const openAgentPanel = useCallback(
    (agentId: string) => {
      if (!_panels) return;
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const agentTasks = tasks.filter(
        (t) => t.assigneeId === agentId || t.assignee?.id === agentId,
      );
      const parent = agent.parentId ? agents.find((a) => a.id === agent.parentId) : null;

      openSidePanel(
        createElement(_panels.AgentDetailPanel, {
          agent,
          tasks: agentTasks.map((t) => ({
            id: t.id,
            identifier: t.identifier,
            title: t.title,
            status: t.status,
            priority: t.priority,
          })),
          parentName: parent?.name,
          onTaskClick: (taskId: string) => openTaskPanel(taskId),
        }),
        { title: agent.name, width: 480 },
      );
    },
    [agents, tasks, openSidePanel],
  );

  const openTaskPanel = useCallback(
    (taskId: string) => {
      if (!_panels) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      openSidePanel(
        createElement(_panels.TaskDetailPanel, {
          task,
          onAgentClick: (agentId: string) => openAgentPanel(agentId),
        }),
        { title: task.identifier + ": " + task.title, width: 480 },
      );
    },
    [agents, tasks, openSidePanel],
  );

  return { openAgentPanel, openTaskPanel, closeSidePanel };
}
