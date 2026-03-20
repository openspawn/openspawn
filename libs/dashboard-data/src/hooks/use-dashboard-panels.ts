/**
 * useDashboardPanels — typed helpers to open agent/task detail panels.
 */
import { createElement, useCallback } from "react";
import { useSidePanel } from "../contexts/side-panel-context";

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

interface TaskPanelCallbacks {
  onTransition?: (taskId: string, status: string) => void;
  onAssign?: (taskId: string, assigneeId: string) => void;
  onAddComment?: (taskId: string, body: string) => void;
  onEscalate?: (taskId: string, reason: string, notes?: string) => void;
  onApproveApproval?: (approvalId: string) => void;
  onRejectApproval?: (approvalId: string, notes: string) => void;
}

interface TaskPanelExtras {
  agents?: Array<{ id: string; name: string }>;
  comments?: Array<Record<string, unknown>>;
  escalations?: Array<Record<string, unknown>>;
  approvals?: Array<Record<string, unknown>>;
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
    agents?: Array<{ id: string; name: string }>;
    comments?: Array<Record<string, unknown>>;
    escalations?: Array<Record<string, unknown>>;
    approvals?: Array<Record<string, unknown>>;
    onAgentClick?: (agentId: string) => void;
    onTransition?: (status: string) => void;
    onAssign?: (assigneeId: string) => void;
    onAddComment?: (body: string) => void;
    onEscalate?: (reason: string, notes?: string) => void;
    onApproveApproval?: (approvalId: string) => void;
    onRejectApproval?: (approvalId: string, notes: string) => void;
  }>;
}

let _panels: PanelComponents | null = null;

/** Call once at app root to register the panel components */
export function registerPanelComponents(panels: PanelComponents) {
  _panels = panels;
}

interface DashboardPanelsOptions {
  agents: AgentPanelData[];
  tasks: TaskPanelData[];
  taskCallbacks?: TaskPanelCallbacks;
  taskExtras?: (taskId: string) => TaskPanelExtras;
}

export function useDashboardPanels({ agents, tasks, taskCallbacks, taskExtras }: DashboardPanelsOptions) {
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

      const extras = taskExtras?.(taskId) ?? {};

      openSidePanel(
        createElement(_panels.TaskDetailPanel, {
          task,
          agents: extras.agents,
          comments: extras.comments,
          escalations: extras.escalations,
          approvals: extras.approvals,
          onAgentClick: (agentId: string) => openAgentPanel(agentId),
          onTransition: taskCallbacks?.onTransition
            ? (status: string) => taskCallbacks.onTransition!(taskId, status)
            : undefined,
          onAssign: taskCallbacks?.onAssign
            ? (assigneeId: string) => taskCallbacks.onAssign!(taskId, assigneeId)
            : undefined,
          onAddComment: taskCallbacks?.onAddComment
            ? (body: string) => taskCallbacks.onAddComment!(taskId, body)
            : undefined,
          onEscalate: taskCallbacks?.onEscalate
            ? (reason: string, notes?: string) => taskCallbacks.onEscalate!(taskId, reason, notes)
            : undefined,
          onApproveApproval: taskCallbacks?.onApproveApproval,
          onRejectApproval: taskCallbacks?.onRejectApproval,
        }),
        { title: task.identifier + ": " + task.title, width: 480 },
      );
    },
    [agents, tasks, openSidePanel, taskCallbacks, taskExtras],
  );

  return { openAgentPanel, openTaskPanel, closeSidePanel };
}
