import { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Clock,
  User,
  Coins,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  ShieldAlert,
  History,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Slider } from "../../components/ui/slider";
import { SandboxActivityFeed } from "../../components/sandbox-activity-feed";
import { TaskCascade } from "../../components/task-cascade";
import type { Task } from "../../hooks";
import { useUpdateTaskAutonomy } from "@openspawn/dashboard-data";
import { darkenForBackground } from "../../lib/avatar-utils";
import { resolveAvatarUrl } from "../../lib/resolve-avatar-url";
import {
  getPriorityVariant,
  formatDate,
  formatFullDate,
  type AgentAvatarMap,
} from "./task-helpers";

interface TaskDetailSidebarProps {
  task: Task;
  onClose: () => void;
  agentMap: AgentAvatarMap;
}

function TaskDetailSidebar({ task, onClose, agentMap }: TaskDetailSidebarProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const hasRejection = task.rejection && task.status === "REVIEW";

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{task.identifier}</span>
          <Badge variant={getPriorityVariant(task.priority)}>{task.priority?.toLowerCase()}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Rejection Banner */}
      {hasRejection && task.rejection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-b border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-500/20 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                  Completion Rejected
                </h3>
                <p className="text-xs text-muted-foreground">
                  by {task.rejection.rejectedBy} • {formatFullDate(task.rejection.rejectedAt)}
                </p>
              </div>
              {task.rejection.rejectionCount > 1 && (
                <Badge variant="outline" className="ml-auto text-amber-500 border-amber-500/50">
                  <History className="w-3 h-3 mr-1" />
                  {task.rejection.rejectionCount} rejections
                </Badge>
              )}
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Required Fixes
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {task.rejection.feedback}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Resume Work
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold">{task.title}</h2>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 flex-wrap">
            <Badge
              variant={task.status === "DONE" ? "success" : hasRejection ? "warning" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {hasRejection ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              {task.status?.replace("_", " ")}
            </Badge>
            {task.approvalRequired && !task.approvedAt && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Needs Approval
              </Badge>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                Description
              </div>
              <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User className="w-3 h-3" />
                Assignee
              </div>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const a = agentMap.get(task.assigneeId ?? "");
                    return (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
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
                  <span className="text-sm font-medium">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">Unassigned</span>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Due Date
              </div>
              <span className={`text-sm font-medium ${isOverdue ? "text-red-500" : ""}`}>
                {task.dueDate ? formatDate(task.dueDate) : "—"}
              </span>
            </div>

            {/* Created */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="w-3 h-3" />
                Created
              </div>
              <span className="text-sm">{formatFullDate(task.createdAt)}</span>
            </div>

            {/* Completed */}
            {task.completedAt && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </div>
                <span className="text-sm">{formatFullDate(task.completedAt)}</span>
              </div>
            )}
          </div>

          {/* Autonomy Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="w-4 h-4" />
                Autonomy Level
              </div>
              <span className="text-sm font-mono font-medium">
                {task.autonomyLevel ?? "inherited"}
              </span>
            </div>
            <AutonomySlider taskId={task.id} currentLevel={task.autonomyLevel ?? null} />
            <p className="text-xs text-muted-foreground">0 = full oversight · 10 = full autonomy</p>
          </div>

          {/* Live Activity Stream (sandbox mode) */}
          <SandboxActivityFeed taskId={task.identifier ?? task.id} />

          {/* ACP Message Cascade (sandbox mode) */}
          <TaskCascade taskId={task.identifier ?? task.id} />

          {/* Approval Info */}
          {task.approvalRequired && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                <Coins className="w-4 h-4" />
                Approval Required
              </div>
              <p className="text-xs text-muted-foreground">
                {task.approvedAt
                  ? `Approved on ${formatFullDate(task.approvedAt)}`
                  : "This task requires approval before completion."}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {hasRejection ? (
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-foreground">
              <RefreshCw className="w-4 h-4 mr-2" />
              Resume Work
            </Button>
          ) : (
            <Button className="flex-1">Edit Task</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AutonomySlider({ taskId, currentLevel }: { taskId: string; currentLevel: number | null }) {
  const [value, setValue] = useState(currentLevel ?? 5);
  const updateAutonomy = useUpdateTaskAutonomy(taskId);

  function handleValueChange(newValue: number) {
    setValue(newValue);
  }

  function handlePointerUp() {
    updateAutonomy.mutate(value);
  }

  return (
    <div onPointerUp={handlePointerUp}>
      <Slider value={value} onValueChange={handleValueChange} min={0} max={10} step={1} />
    </div>
  );
}

export { TaskDetailSidebar };
