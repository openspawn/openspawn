import type { Task } from "../hooks";

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-800",
  todo: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  review: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
  cancelled: "bg-gray-300 text-gray-600",
};

const priorityIcons: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  normal: "🟢",
  low: "🔵",
};

export function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  return (
    <div
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-mono text-gray-500">{task.identifier}</span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status] || "bg-gray-100"}`}
        >
          {task.status.replace("_", " ")}
        </span>
      </div>
      <h3 className="mt-2 font-medium text-gray-900 line-clamp-2">{task.title}</h3>
      {task.description && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span title={`Priority: ${task.priority}`}>{priorityIcons[task.priority] || "⚪"}</span>
        {task.dueDate && (
          <span className="text-xs text-gray-400">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
