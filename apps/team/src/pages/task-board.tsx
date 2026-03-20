import { useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@openspawn/dashboard-ui";
import {
  useTransitionTask as useTransitionTaskFactory,
  useAssignTask as useAssignTaskFactory,
  useAddComment as useAddCommentFactory,
  useEscalateTask as useEscalateTaskFactory,
  useApproveApproval as useApproveApprovalFactory,
  useRejectApproval as useRejectApprovalFactory,
  useTaskComments,
  useTaskEscalations,
  useApprovals,
  TaskStatus,
  TaskPriority,
} from "@openspawn/dashboard-data";
import { useTasks, useAgents, useDashboardPanels } from "../hooks";
import { useSearch, useNavigate } from "@tanstack/react-router";

const COLUMNS: { id: string; label: string; color: string }[] = [
  { id: TaskStatus.TODO, label: "To Do", color: "border-white/10      bg-white/[0.02]" },
  { id: TaskStatus.IN_PROGRESS, label: "In Progress", color: "border-cyan-500/30   bg-cyan-500/[0.04]" },
  { id: TaskStatus.REVIEW, label: "In Review", color: "border-violet-500/30 bg-violet-500/[0.04]" },
  { id: TaskStatus.BLOCKED, label: "Blocked", color: "border-red-500/30    bg-red-500/[0.04]" },
  { id: TaskStatus.DONE, label: "Done", color: "border-emerald-500/30 bg-emerald-500/[0.04]" },
];

function priorityColor(p: string): string {
  const lp = p.toLowerCase();
  switch (lp) {
    case TaskPriority.URGENT:
    case TaskPriority.CRITICAL:
      return "bg-red-500/20 text-red-400";
    case TaskPriority.HIGH:
      return "bg-amber-500/20 text-amber-400";
    case TaskPriority.NORMAL:
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-white/10 text-white/40";
  }
}

export function TaskBoardPage() {
  const { tasks, loading } = useTasks();
  const { agents } = useAgents();
  const searchParams = useSearch({ strict: false });
  const navigate = useNavigate();

  const panelId = (searchParams as Record<string, unknown>).panel as string || "";

  const transition = useTransitionTaskFactory(panelId || "___");
  const assign = useAssignTaskFactory(panelId || "___");
  const comment = useAddCommentFactory(panelId || "___");
  const escalate = useEscalateTaskFactory(panelId || "___");
  const approveApproval = useApproveApprovalFactory(panelId || "___");
  const rejectApproval = useRejectApprovalFactory(panelId || "___");

  const commentsQuery = useTaskComments(panelId || "");
  const escalationsQuery = useTaskEscalations(panelId || "");
  const approvalsQuery = useApprovals("pending");

  const taskCallbacks = useMemo(
    () => ({
      onTransition: (_taskId: string, status: string) => {
        transition.mutate({
          status: status as "backlog" | "todo" | "pending" | "assigned" | "in_progress" | "review" | "done" | "blocked" | "cancelled" | "rejected",
        });
      },
      onAssign: (_taskId: string, assigneeId: string) => {
        assign.mutate({ assignee_id: assigneeId });
      },
      onAddComment: (_taskId: string, body: string) => {
        comment.mutate({ body });
      },
      onEscalate: (_taskId: string, reason: string, notes?: string) => {
        escalate.mutate({
          reason: reason as "BLOCKED_TIMEOUT" | "STALE_TASK" | "SLA_BREACH" | "ASSIGNEE_INACTIVE" | "QUALITY_ISSUES" | "MANUAL" | "CAPACITY_OVERFLOW",
          notes,
        });
      },
      onApproveApproval: (_approvalId: string) => {
        approveApproval.mutate(undefined);
      },
      onRejectApproval: (_approvalId: string, notes: string) => {
        rejectApproval.mutate(notes);
      },
    }),
    [transition, assign, comment, escalate, approveApproval, rejectApproval],
  );

  const taskExtras = useCallback(
    (_taskId: string) => ({
      agents: agents.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
      comments: Array.isArray(commentsQuery.data?.data) ? commentsQuery.data.data : [],
      escalations: Array.isArray(escalationsQuery.data?.data) ? escalationsQuery.data.data : [],
      approvals: Array.isArray(approvalsQuery.data?.data)
        ? (approvalsQuery.data.data as Array<Record<string, unknown>>).filter(
            (a: Record<string, unknown>) => a.entity_id === _taskId,
          )
        : [],
    }),
    [agents, commentsQuery.data, escalationsQuery.data, approvalsQuery.data],
  );

  const { openTaskPanel } = useDashboardPanels({
    agents,
    tasks,
    taskCallbacks,
    taskExtras,
  });

  const handleOpenTaskPanel = useCallback(
    (taskId: string) => {
      navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, panel: taskId }), replace: true });
      openTaskPanel(taskId);
    },
    [navigate, openTaskPanel],
  );

  useEffect(() => {
    if (panelId && tasks.length > 0) {
      openTaskPanel(panelId);
    }
  }, [panelId, tasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const byColumn = COLUMNS.reduce<Record<string, typeof tasks>>((acc, col) => {
    acc[col.id] = [];
    return acc;
  }, {});

  for (const task of tasks) {
    const s = task.status.toLowerCase();
    if (s in byColumn) {
      byColumn[s].push(task);
    } else {
      byColumn[TaskStatus.TODO].push(task);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Task Board" description="Sprint planning and tracking" />
      {loading ? (
        <div className="text-white/40 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.id} className={`rounded-xl border p-4 space-y-3 ${col.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  {byColumn[col.id].length}
                </span>
              </div>
              {byColumn[col.id].length === 0 ? (
                <p className="text-xs text-white/25 text-center py-4">No tasks</p>
              ) : (
                byColumn[col.id].map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleOpenTaskPanel(task.id)}
                    className="w-full rounded-lg border border-white/10 bg-[hsl(var(--card))] p-3 space-y-2 text-left hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <p className="text-sm font-medium text-white leading-snug group-hover:text-white">
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <span className="flex items-center gap-1 text-[10px] text-white/40">
                          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/80">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </span>
                          {task.assignee.name}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
