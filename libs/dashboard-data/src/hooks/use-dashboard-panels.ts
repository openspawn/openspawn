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

interface PanelComponents {
  AgentDetailPanel: React.ComponentType<{
    agent: any;
    tasks?: any[];
    parentName?: string;
    onTaskClick?: (taskId: string) => void;
  }>;
  TaskDetailPanel: React.ComponentType<{
    task: any;
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
  agents: any[];
  tasks: any[];
}

export function useDashboardPanels({ agents, tasks }: DashboardPanelsOptions) {
  const { openSidePanel, closeSidePanel } = useSidePanel();

  const openAgentPanel = useCallback((agentId: string) => {
    if (!_panels) return;
    const agent = agents.find((a: any) => a.id === agentId);
    if (!agent) return;

    const agentTasks = tasks.filter((t: any) => t.assigneeId === agentId || t.assignee?.id === agentId);
    const parent = agent.parentId ? agents.find((a: any) => a.id === agent.parentId) : null;

    openSidePanel(
      createElement(_panels.AgentDetailPanel, {
        agent,
        tasks: agentTasks.map((t: any) => ({
          id: t.id,
          identifier: t.identifier,
          title: t.title,
          status: t.status,
          priority: t.priority,
        })),
        parentName: parent?.name,
        onTaskClick: (taskId: string) => openTaskPanel(taskId),
      }),
      { title: agent.name, width: 480 }
    );
  }, [agents, tasks, openSidePanel]);

  const openTaskPanel = useCallback((taskId: string) => {
    if (!_panels) return;
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task) return;

    openSidePanel(
      createElement(_panels.TaskDetailPanel, {
        task,
        onAgentClick: (agentId: string) => openAgentPanel(agentId),
      }),
      { title: task.identifier + ": " + task.title, width: 480 }
    );
  }, [agents, tasks, openSidePanel]);

  return { openAgentPanel, openTaskPanel, closeSidePanel };
}
