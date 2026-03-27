import { PageHeader, Badge, TaskDetailPanel } from "@openspawn/dashboard-ui";
import { useSidePanel } from "@openspawn/dashboard-data";
import { useTasks } from "../hooks";
import { cn } from "../lib/utils";

function priorityColor(p: string): string {
  switch (p) {
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
  switch (s) {
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

export function TasksPage() {
  const { tasks, loading } = useTasks();
  const { openSidePanel } = useSidePanel();
  const openTaskPanel = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) openSidePanel(<TaskDetailPanel task={task} />, { width: 480, title: task.title });
  };

  // Sort: active first (in_progress, review, todo, blocked, backlog), then done/cancelled
  const sorted = [...tasks].sort((a, b) => {
    const order: Record<string, number> = {
      IN_PROGRESS: 0,
      REVIEW: 1,
      TODO: 2,
      BLOCKED: 3,
      BACKLOG: 4,
      DONE: 5,
      CANCELLED: 6,
    };
    const ao = order[a.status] ?? 4;
    const bo = order[b.status] ?? 4;
    if (ao !== bo) return ao - bo;
    const po: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
    return (po[a.priority] ?? 2) - (po[b.priority] ?? 2);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description={`${tasks.length} tasks across your organization`} />
      {loading ? (
        <div className="text-white/40 text-sm">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-white/30">No tasks yet</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => {
            const sb = statusBadge(task.status);
            return (
              <button
                key={task.id}
                onClick={() => openTaskPanel(task.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all text-left cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-white/30">{task.identifier}</span>
                    <Badge variant={sb.variant} className="text-[10px]">
                      {sb.label}
                    </Badge>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        priorityColor(task.priority),
                      )}
                    >
                      {task.priority}
                    </span>
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
