/**
 * Shared Task Detail Panel — used inside SidePanelShell.
 *
 * Renders task details with:
 *   - Header (identifier, title, status badge, priority)
 *   - Description
 *   - Metadata (assignee, creator, dates)
 *   - Timeline / activity
 */
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  User,
  Calendar,
  ArrowRight,
  Flag,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../lib/utils";

/* ── Types ─────────────────────────────────────────────────────── */

export interface TaskPanelTask {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assigneeId?: string | null;
  creatorId?: string | null;
  approvalRequired?: boolean;
  approvedAt?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string } | null;
  rejection?: {
    feedback?: string | null;
    rejectedAt?: string | null;
    rejectionCount?: number | null;
  } | null;
}

interface TaskDetailPanelProps {
  task: TaskPanelTask;
  /** Callback when the assignee name is clicked */
  onAgentClick?: (agentId: string) => void;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function statusConfig(s: string): {
  icon: React.ReactNode;
  color: string;
  label: string;
  bg: string;
} {
  switch (s.toUpperCase()) {
    case "DONE":
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: "text-emerald-400",
        label: "Done",
        bg: "bg-emerald-500/20 border-emerald-500/30",
      };
    case "IN_PROGRESS":
      return {
        icon: <Activity className="w-4 h-4" />,
        color: "text-cyan-400",
        label: "In Progress",
        bg: "bg-cyan-500/20 border-cyan-500/30",
      };
    case "BLOCKED":
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "text-red-400",
        label: "Blocked",
        bg: "bg-red-500/20 border-red-500/30",
      };
    case "REVIEW":
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-violet-400",
        label: "In Review",
        bg: "bg-violet-500/20 border-violet-500/30",
      };
    case "TODO":
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-blue-400",
        label: "To Do",
        bg: "bg-blue-500/20 border-blue-500/30",
      };
    case "BACKLOG":
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-white/40",
        label: "Backlog",
        bg: "bg-white/10 border-white/10",
      };
    case "CANCELLED":
      return {
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-400/60",
        label: "Cancelled",
        bg: "bg-red-500/10 border-red-500/20",
      };
    default:
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-white/40",
        label: s,
        bg: "bg-white/10 border-white/10",
      };
  }
}

function priorityConfig(p: string): { color: string; icon: React.ReactNode } {
  switch (p.toUpperCase()) {
    case "URGENT":
      return {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: <Flag className="w-3 h-3" />,
      };
    case "HIGH":
      return {
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <Flag className="w-3 h-3" />,
      };
    case "NORMAL":
      return {
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: <Flag className="w-3 h-3" />,
      };
    default:
      return {
        color: "bg-white/10 text-white/40 border-white/10",
        icon: <Flag className="w-3 h-3" />,
      };
  }
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ── Component ─────────────────────────────────────────────────── */

export function TaskDetailPanel({ task, onAgentClick }: TaskDetailPanelProps) {
  const status = statusConfig(task.status);
  const priority = priorityConfig(task.priority);

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
              {task.identifier}
            </span>
            <Badge variant="outline" className={cn("text-[10px] gap-1", status.bg, status.color)}>
              {status.icon}
              {status.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] gap-1", priority.color)}>
              {priority.icon}
              {task.priority}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold text-white leading-snug">{task.title}</h2>
        </div>

        {/* Description */}
        {task.description && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Description
            </h4>
            <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-lg p-3 border border-white/5">
              {task.description}
            </div>
          </div>
        )}

        {/* Status Progress */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Status</h4>
          <StatusTimeline status={task.status} />
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Assignee</h4>
            <button
              onClick={() => task.assignee && onAgentClick?.(task.assignee.id)}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all w-full text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 group-hover:text-white transition-colors">
                  {task.assignee.name}
                </div>
                <div className="text-[10px] text-white/30">Click to view agent</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
            </button>
          </div>
        )}

        {/* Rejection info */}
        {task.rejection?.feedback && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-red-400/80 uppercase tracking-wider">
              Rejected
            </h4>
            <div className="text-sm text-red-300/70 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              {task.rejection.feedback}
              {task.rejection.rejectionCount && task.rejection.rejectionCount > 1 && (
                <span className="block mt-1 text-[10px] text-red-400/50">
                  Rejected {task.rejection.rejectionCount} times
                </span>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Details</h4>
          <div className="space-y-0">
            <MetaRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Created"
              value={formatDate(task.createdAt)}
            />
            <MetaRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Updated"
              value={formatDateTime(task.updatedAt)}
            />
            {task.dueDate && (
              <MetaRow
                icon={<Flag className="w-3.5 h-3.5 text-amber-400" />}
                label="Due"
                value={formatDate(task.dueDate)}
              />
            )}
            {task.completedAt && (
              <MetaRow
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                label="Completed"
                value={formatDateTime(task.completedAt)}
              />
            )}
            {task.approvedAt && (
              <MetaRow
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />}
                label="Approved"
                value={formatDateTime(task.approvedAt)}
              />
            )}
            {task.approvalRequired && !task.approvedAt && (
              <MetaRow
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                label="Approval"
                value="Required"
              />
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

const FLOW = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

function StatusTimeline({ status }: { status: string }) {
  const upper = status.toUpperCase();
  const currentIdx = FLOW.indexOf(upper as (typeof FLOW)[number]);
  const isBlocked = upper === "BLOCKED";
  const isCancelled = upper === "CANCELLED";

  return (
    <div className="flex items-center gap-1">
      {FLOW.map((step, i) => {
        const isActive = step === upper;
        const isPast = currentIdx >= 0 && i < currentIdx;
        const cfg = statusConfig(step);
        return (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                isActive ? "bg-current " + cfg.color : isPast ? "bg-emerald-500/40" : "bg-white/10",
              )}
            />
            {i < FLOW.length - 1 && <div className="w-0.5" />}
          </div>
        );
      })}
      {(isBlocked || isCancelled) && (
        <div
          className={cn(
            "ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded",
            isBlocked ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40",
          )}
        >
          {isBlocked ? "BLOCKED" : "CANCELLED"}
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-xs text-white/40">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-xs text-white/70 font-medium">{value}</span>
    </div>
  );
}
