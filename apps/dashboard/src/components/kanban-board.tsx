import type { Task } from "../hooks";
import { TaskCard } from "./task-card";

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

export function KanbanBoard({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-700 mb-4">
            {column.title}
            <span className="ml-2 text-sm text-gray-400">
              ({getTasksByStatus(column.id).length})
            </span>
          </h2>
          <div className="space-y-3">
            {getTasksByStatus(column.id).map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
