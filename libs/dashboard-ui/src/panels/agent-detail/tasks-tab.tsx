import { TaskStatus } from "@openspawn/shared-types";
import { Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Badge } from "../../ui/badge";
import type { AgentDetailAgent, AgentDetailTask } from "./types";

function getTaskStatusBadge(status: string): {
  variant: "success" | "warning" | "destructive" | "secondary";
  label: string;
} {
  switch (status) {
    case TaskStatus.DONE:
      return { variant: "success", label: "Completed" };
    case TaskStatus.IN_PROGRESS:
      return { variant: "warning", label: "In Progress" };
    case TaskStatus.BLOCKED:
    case TaskStatus.CANCELLED:
      return { variant: "destructive", label: status };
    case TaskStatus.BACKLOG:
    case TaskStatus.TODO:
      return { variant: "secondary", label: "Pending" };
    default:
      return { variant: "secondary", label: status };
  }
}

interface TasksTabProps {
  agent: AgentDetailAgent;
  tasks: AgentDetailTask[];
  tasksLoading?: boolean;
  onTaskClick?: (taskId: string) => void;
}

export function TasksTab({ tasks, tasksLoading, onTaskClick }: TasksTabProps) {
  const tasksByStatus = useMemo(
    () => ({
      completed: tasks.filter((t) => t.status === TaskStatus.DONE),
      inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
      pending: tasks.filter((t) => t.status === TaskStatus.BACKLOG || t.status === TaskStatus.TODO),
      failed: tasks.filter(
        (t) => t.status === TaskStatus.CANCELLED || t.status === TaskStatus.BLOCKED,
      ),
    }),
    [tasks],
  );

  if (tasksLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading tasks...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Task Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-500">
            {tasksByStatus.completed.length}
          </div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-500">{tasksByStatus.inProgress.length}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="text-2xl font-bold text-blue-500">{tasksByStatus.pending.length}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-2xl font-bold text-red-500">{tasksByStatus.failed.length}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
            No tasks assigned to this agent yet
          </div>
        ) : (
          tasks.map((task, index) => {
            const statusInfo = getTaskStatusBadge(task.status);
            return (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                onClick={() => onTaskClick?.(task.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.identifier && <span className="font-mono">#{task.identifier}</span>}
                      {task.priority && (
                        <span className="capitalize">{task.priority} priority</span>
                      )}
                      {task.completedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
