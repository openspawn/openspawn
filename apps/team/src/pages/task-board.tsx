import { PageHeader } from "@openspawn/dashboard-ui";
import { useTasks } from "../hooks";
import { TaskStatus, TaskPriority } from "@openspawn/dashboard-data";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: TaskStatus.Todo,       label: "To Do",       color: "border-white/10      bg-white/[0.02]"      },
  { id: TaskStatus.InProgress, label: "In Progress", color: "border-cyan-500/30   bg-cyan-500/[0.04]"   },
  { id: TaskStatus.Review,     label: "In Review",   color: "border-violet-500/30 bg-violet-500/[0.04]" },
  { id: TaskStatus.Done,       label: "Done",        color: "border-emerald-500/30 bg-emerald-500/[0.04]" },
];

function priorityColor(p: TaskPriority): string {
  switch (p) {
    case TaskPriority.Urgent: return "bg-red-500/20 text-red-400";
    case TaskPriority.High:   return "bg-amber-500/20 text-amber-400";
    case TaskPriority.Normal: return "bg-blue-500/20 text-blue-400";
    default:                  return "bg-white/10 text-white/40";
  }
}

export function TaskBoardPage() {
  const { tasks, loading } = useTasks();

  const byColumn = COLUMNS.reduce<Record<string, typeof tasks>>(
    (acc, col) => { acc[col.id] = []; return acc; },
    {}
  );

  for (const task of tasks) {
    if (task.status in byColumn) {
      byColumn[task.status].push(task);
    } else {
      // Bucket other statuses (BACKLOG, BLOCKED, CANCELLED) into To Do
      byColumn[TaskStatus.Todo].push(task);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Task Board" description="Sprint planning and tracking" />

      {loading ? (
        <div className="text-white/40 text-sm">Loading…</div>
      ) : (
        /* Stack vertically on mobile, 4-column on lg+ */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`rounded-xl border p-4 space-y-3 ${col.color}`}
            >
              {/* Column header */}
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
                  <div
                    key={task.id}
                    className="rounded-lg border border-white/10 bg-[hsl(var(--card))] p-3 space-y-2"
                  >
                    <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <span className="text-[10px] text-white/40">{task.assignee.name}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
