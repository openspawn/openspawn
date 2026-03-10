import { PageHeader } from "@openspawn/dashboard-ui";
import { useTasks, useAgents, useDashboardPanels } from "../hooks";
import { TaskStatus, TaskPriority } from "@openspawn/dashboard-data";

const COLUMNS: { id: string; label: string; color: string }[] = [
  { id: TaskStatus.TODO, label: "To Do", color: "border-white/10      bg-white/[0.02]" },
  {
    id: TaskStatus.IN_PROGRESS,
    label: "In Progress",
    color: "border-cyan-500/30   bg-cyan-500/[0.04]",
  },
  { id: TaskStatus.REVIEW, label: "In Review", color: "border-violet-500/30 bg-violet-500/[0.04]" },
  { id: TaskStatus.BLOCKED, label: "Blocked", color: "border-red-500/30    bg-red-500/[0.04]" },
  { id: TaskStatus.DONE, label: "Done", color: "border-emerald-500/30 bg-emerald-500/[0.04]" },
];

function priorityColor(p: string): string {
  const lp = p.toLowerCase();
  switch (lp) {
    case TaskPriority.URGENT:
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
  const { openTaskPanel } = useDashboardPanels({ agents, tasks });

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
                    onClick={() => openTaskPanel(task.id)}
                    className="w-full rounded-lg border border-white/10 bg-[hsl(var(--card))] p-3 space-y-2 text-left hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <p className="text-sm font-medium text-white leading-snug group-hover:text-white">
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <span className="text-[10px] text-white/40">{task.assignee.name}</span>
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
