import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PageHeader, Badge, EmptyState } from "@openspawn/dashboard-ui";
import { TaskStatus } from "@openspawn/dashboard-data";
import { useTasks } from "../hooks";

export function TasksPage() {
  const { tasks, loading } = useTasks();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return tasks;
    const q = search.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Track and manage agent tasks" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No tasks" description="No tasks match your criteria." />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              {/* Mobile: stacked layout; sm+: side-by-side */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{task.title}</div>
                  {task.assignee && (
                    <div className="text-xs text-white/40 truncate">
                      Assigned to {task.assignee.name}
                    </div>
                  )}
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <Badge variant={task.status === TaskStatus.Done ? "default" : "secondary"}>
                    {task.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
