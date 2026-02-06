import { KanbanBoard } from "../components";
import { useTasks } from "../hooks";

// TODO: Get from context/env
const ORG_ID = import.meta.env.VITE_ORG_ID || "default-org-id";

export function TasksPage() {
  const { tasks, loading, error } = useTasks(ORG_ID);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-700">Error loading tasks: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500">{tasks.length} total tasks</p>
      </div>
      <KanbanBoard tasks={tasks} onTaskClick={(task) => console.log("Task clicked:", task)} />
    </div>
  );
}
