import { useEffect, useCallback, useMemo } from "react";
import { PageHeader, Badge } from "@openspawn/dashboard-ui";
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
import { useDashboardPanels, useAgents, useTasks } from "../hooks";
import { cn } from "../lib/utils";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";

function priorityColor(p: string): string {
  switch (p.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-500/20 text-red-400";
    case "URGENT":
      return "bg-red-500/20 text-red-400";
    case "HIGH":
      return "bg-amber-500/20 text-amber-400";
    case "NORMAL":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-white/10 text-white/40";
  }
}

function statusBadge(s: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  switch (s.toUpperCase()) {
    case "DONE":
      return { variant: "default", label: "Done" };
    case "IN_PROGRESS":
      return { variant: "secondary", label: "In Progress" };
    case "BLOCKED":
      return { variant: "destructive", label: "Blocked" };
    case "REVIEW":
      return { variant: "outline", label: "Review" };
    case "TODO":
      return { variant: "outline", label: "To Do" };
    default:
      return { variant: "outline", label: s };
  }
}

const ALL_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
];

const ALL_PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

export function TasksPage() {
  const { tasks, loading } = useTasks();
  const { agents } = useAgents();
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const navigate = useNavigate();

  const panelId = searchParams.panel || "";
  const filterStatus = searchParams.status || "";
  const filterPriority = searchParams.priority || "";
  const filterAssignee = searchParams.assignee || "";

  // Mutations for the currently open panel task
  const transition = useTransitionTaskFactory(panelId || "___");
  const assign = useAssignTaskFactory(panelId || "___");
  const comment = useAddCommentFactory(panelId || "___");
  const escalate = useEscalateTaskFactory(panelId || "___");
  const approveApproval = useApproveApprovalFactory(panelId || "___");
  const rejectApproval = useRejectApprovalFactory(panelId || "___");

  // Fetch comments/escalations/approvals for the panel task
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
      navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, panel: taskId }),
        replace: true,
      });
      openTaskPanel(taskId);
    },
    [navigate, openTaskPanel],
  );

  // Auto-open panel from URL on mount
  useEffect(() => {
    if (panelId && tasks.length > 0) {
      openTaskPanel(panelId);
    }
  }, [panelId, tasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter tasks
  const filtered = useMemo(() => {
    let result = [...tasks];
    if (filterStatus) {
      result = result.filter((t) => t.status.toLowerCase() === filterStatus.toLowerCase());
    }
    if (filterPriority) {
      result = result.filter((t) => t.priority.toLowerCase() === filterPriority.toLowerCase());
    }
    if (filterAssignee) {
      result = result.filter((t) => t.assigneeId === filterAssignee);
    }
    return result;
  }, [tasks, filterStatus, filterPriority, filterAssignee]);

  // Sort: active first
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const order: Record<string, number> = {
          IN_PROGRESS: 0, REVIEW: 1, TODO: 2, BLOCKED: 3, BACKLOG: 4, DONE: 5, CANCELLED: 6,
        };
        const ao = order[a.status.toUpperCase()] ?? 4;
        const bo = order[b.status.toUpperCase()] ?? 4;
        if (ao !== bo) return ao - bo;
        const po: Record<string, number> = { CRITICAL: 0, URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4 };
        return (po[a.priority.toUpperCase()] ?? 3) - (po[b.priority.toUpperCase()] ?? 3);
      }),
    [filtered],
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, [key]: value || undefined }),
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description={`${filtered.length} tasks across your organization`} />

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        <select
          className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-cyan-500/50"
          value={filterStatus}
          onChange={(e) => setFilter("status", e.target.value)}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-cyan-500/50"
          value={filterPriority}
          onChange={(e) => setFilter("priority", e.target.value)}
        >
          {ALL_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-cyan-500/50"
          value={filterAssignee}
          onChange={(e) => setFilter("assignee", e.target.value)}
        >
          <option value="">All Agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          {filtered.length === 0 && tasks.length > 0
            ? "No tasks match the current filters"
            : "No tasks yet"}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => {
            const sb = statusBadge(task.status);
            return (
              <button
                key={task.id}
                onClick={() => handleOpenTaskPanel(task.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all text-left cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-white/30">{task.identifier}</span>
                    <Badge variant={sb.variant} className="text-[10px]">{sb.label}</Badge>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityColor(task.priority))}>
                      {task.priority}
                    </span>
                    {task.approvalRequired && !task.approvedAt && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-400 flex items-center gap-0.5">
                        <UserCheck className="w-3 h-3" />
                        Approval
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/80 group-hover:text-white transition-colors truncate">
                    {task.title}
                  </p>
                </div>
                {task.assignee && (
                  <span className="text-xs text-white/40 shrink-0">{task.assignee.name}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
