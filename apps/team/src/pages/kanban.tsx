import { PageHeader } from "@openspawn/dashboard-ui";
import { useTasks } from "../hooks";
import { TaskStatus } from "@openspawn/dashboard-data";

const SWIM_LANES: { id: TaskStatus; label: string; accent: string }[] = [
  { id: TaskStatus.Todo,       label: "To Do",       accent: "border-white/10       bg-white/[0.02]"       },
  { id: TaskStatus.InProgress, label: "In Progress", accent: "border-cyan-500/30    bg-cyan-500/[0.04]"    },
  { id: TaskStatus.Blocked,    label: "Blocked",     accent: "border-red-500/30     bg-red-500/[0.04]"     },
  { id: TaskStatus.Done,       label: "Done",        accent: "border-emerald-500/30 bg-emerald-500/[0.04]" },
];

export function KanbanPage() {
  const { tasks, loading } = useTasks();

  const byLane = SWIM_LANES.reduce<Record<string, typeof tasks>>(
    (acc, l) => { acc[l.id] = []; return acc; },
    {}
  );

  for (const t of tasks) {
    if (t.status in byLane) {
      byLane[t.status].push(t);
    } else {
      // Backlog, Review, Cancelled all fall into To Do visually
      byLane[TaskStatus.Todo].push(t);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kanban" description="Visual task management board" />

      {loading ? (
        <div className="text-white/40 text-sm">Loading…</div>
      ) : (
        /* Columns stack vertically on mobile, 2-col on sm, 4-col on lg */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SWIM_LANES.map((lane) => (
            <div
              key={lane.id}
              className={`rounded-xl border p-4 space-y-3 ${lane.accent}`}
            >
              {/* Lane header */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                  {lane.label}
                </h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                  {byLane[lane.id].length}
                </span>
              </div>

              {byLane[lane.id].length === 0 ? (
                <p className="text-xs text-white/20 text-center py-6">Empty</p>
              ) : (
                byLane[lane.id].map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-white/10 bg-[hsl(var(--card))] p-3 space-y-1.5"
                  >
                    <p className="text-xs font-medium text-white leading-snug">{t.title}</p>
                    {t.assignee && (
                      <p className="text-[10px] text-white/40">{t.assignee.name}</p>
                    )}
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
