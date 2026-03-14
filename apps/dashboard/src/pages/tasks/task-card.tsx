import { motion } from "motion/react";
import {
  GripVertical,
  Clock,
  Webhook,
  Link2,
  Plug,
  AlertTriangle,
  ShieldAlert,
  History,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { TaskActions } from "../../components/task-actions";
import type { Task } from "../../hooks";
import { darkenForBackground } from "../../lib/avatar-utils";
import { resolveAvatarUrl } from "../../lib/resolve-avatar-url";
import { getPriorityVariant, formatDate, type AgentAvatarMap } from "./task-helpers";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  compact?: boolean;
  agentMap: AgentAvatarMap;
}

function TaskCard({ task, onClick, compact, agentMap }: TaskCardProps) {
  const dueDate = formatDate(task.dueDate);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const hasRejection = task.rejection && task.status === "REVIEW";
  const createdViaWebhook = false; // TODO: Add metadata field to GraphQL schema when needed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
    >
      <Card
        className={`cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md hover:border-primary/20 min-h-[44px] ${
          hasRejection ? "border-amber-500/50 bg-amber-500/5" : ""
        }`}
      >
        <CardContent className={compact ? "p-2 sm:p-3" : "p-3"}>
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header: ID + Priority + Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground">{task.identifier}</span>
                  <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                    {task.priority?.toLowerCase()}
                  </Badge>
                  {task.approvalRequired && (
                    <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                      approval
                    </Badge>
                  )}
                  {createdViaWebhook && (
                    <Badge variant="outline" className="text-xs text-cyan-500 border-cyan-500/30">
                      <Webhook className="w-3 h-3 mr-1" />
                      webhook
                    </Badge>
                  )}
                  {task.source === "a2a" && (
                    <Badge
                      variant="outline"
                      className="text-xs text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      A2A
                    </Badge>
                  )}
                  {task.source === "mcp" && (
                    <Badge
                      variant="outline"
                      className="text-xs text-violet-400 border-violet-500/30 bg-violet-500/10"
                    >
                      <Plug className="w-3 h-3 mr-1" />
                      MCP
                    </Badge>
                  )}
                  {hasRejection && (
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-600 border-amber-500/50 bg-amber-500/10 animate-pulse"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      needs fixes
                    </Badge>
                  )}
                </div>
                <TaskActions
                  taskId={task.id}
                  taskStatus={task.status}
                  taskTitle={task.title}
                  approvalRequired={Boolean(task.approvalRequired)}
                />
              </div>

              {/* Title */}
              <p className="text-sm font-medium leading-tight">{task.title}</p>

              {/* Rejection feedback preview */}
              {hasRejection && task.rejection && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
                    <ShieldAlert className="w-3 h-3 inline mr-1" />
                    {task.rejection.feedback}
                  </p>
                </div>
              )}

              {/* Meta row: Assignee, Due date */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {task.assignee ? (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const a = agentMap.get(task.assigneeId ?? "");
                      return (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
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
                    <span className="truncate max-w-[100px]">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50 italic">Unassigned</span>
                )}

                {dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
                    <Clock className="w-3 h-3" />
                    <span>{dueDate}</span>
                  </div>
                )}

                {task.rejection?.rejectionCount && task.rejection.rejectionCount > 1 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <History className="w-3 h-3" />
                    <span>{task.rejection.rejectionCount}x</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { TaskCard };
