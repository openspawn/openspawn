import { motion, AnimatePresence } from "motion/react";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import type { Task } from "../../hooks";
import { darkenForBackground } from "../../lib/avatar-utils";
import { resolveAvatarUrl } from "../../lib/resolve-avatar-url";
import { getPriorityVariant, formatDate, type AgentAvatarMap } from "./task-helpers";

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
  agentMap: AgentAvatarMap;
}

function ListView({ tasks, onTaskClick, selectedTaskId, agentMap }: ListViewProps) {
  return (
    <Card>
      <div className="divide-y divide-border">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => {
            const dueDate = formatDate(task.dueDate);
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
            const isSelected = task.id === selectedTaskId;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => onTaskClick(task)}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer min-h-[44px] ${
                  isSelected ? "bg-accent/70 border-l-2 border-l-primary" : ""
                }`}
              >
                {/* Mobile: stacked layout */}
                <div className="flex items-center gap-2 sm:contents">
                  <span className="font-mono text-xs sm:text-sm text-muted-foreground sm:w-20 flex-shrink-0">
                    {task.identifier}
                  </span>
                  <Badge
                    variant={getPriorityVariant(task.priority)}
                    className="flex-shrink-0 sm:order-3"
                  >
                    {task.priority?.toLowerCase()}
                  </Badge>
                  <Badge
                    variant={task.status === "DONE" ? "success" : "secondary"}
                    className="sm:w-24 sm:justify-center flex-shrink-0 sm:order-4"
                  >
                    {task.status?.replace("_", " ").toLowerCase()}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0 sm:order-2">
                  <p className="font-medium truncate text-sm sm:text-base">{task.title}</p>
                </div>
                <div className="flex items-center gap-3 sm:contents text-xs sm:text-sm pl-0 sm:pl-0">
                  {task.assignee ? (
                    <div className="flex items-center gap-1 sm:w-28 flex-shrink-0 sm:order-5">
                      {(() => {
                        const a = agentMap.get(task.assigneeId ?? "");
                        return (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: darkenForBackground(a?.avatarColor || "#71717a"),
                            }}
                          >
                            {a?.avatarUrl ? (
                              <img
                                src={resolveAvatarUrl(a.avatarUrl)}
                                alt=""
                                className="w-full h-full rounded-full object-contain"
                              />
                            ) : (
                              a?.avatar || "🤖"
                            )}
                          </div>
                        );
                      })()}
                      <span className="text-muted-foreground truncate">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50 sm:w-28 flex-shrink-0 italic sm:order-5 hidden sm:inline">
                      Unassigned
                    </span>
                  )}
                  {dueDate && (
                    <span
                      className={`sm:w-16 flex-shrink-0 sm:order-6 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {dueDate}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export { ListView };
