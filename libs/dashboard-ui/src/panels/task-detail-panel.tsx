/**
 * Shared Task Detail Panel — used inside SidePanelShell.
 *
 * Renders task details with:
 *   - Header (identifier, title, status badge, priority)
 *   - Status transition buttons
 *   - Assignment dropdown
 *   - Description
 *   - Approval section
 *   - Escalation indicator
 *   - Comment thread
 *   - Metadata (dates)
 */
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Calendar,
  ArrowRight,
  Flag,
  Send,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskEscalation {
  id: string;
  task_id: string;
  from_agent_id: string;
  to_agent_id: string;
  reason: string;
  notes?: string | null;
  levels_escalated: number;
  is_automatic: boolean;
  resolved_at?: string | null;
  created_at: string;
}

export interface TaskApproval {
  id: string;
  entity_id: string;
  action_type: string;
  status: string;
  requested_by: string;
  notes?: string | null;
  created_at: string;
}

export interface TaskPanelAgent {
  id: string;
  name: string;
}

interface TaskDetailPanelProps {
  task: TaskPanelTask;
  agents?: TaskPanelAgent[];
  comments?: TaskComment[];
  escalations?: TaskEscalation[];
  approvals?: TaskApproval[];
  onAgentClick?: (agentId: string) => void;
  onTransition?: (status: string) => void;
  onAssign?: (assigneeId: string) => void;
  onAddComment?: (body: string) => void;
  onEscalate?: (reason: string, notes?: string) => void;
  onApproveApproval?: (approvalId: string) => void;
  onRejectApproval?: (approvalId: string, notes: string) => void;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function statusConfig(s: string) {
  switch (s.toUpperCase()) {
    case "DONE":
      return { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", label: "Done", bg: "bg-emerald-500/20 border-emerald-500/30" };
    case "IN_PROGRESS":
      return { icon: <Activity className="w-4 h-4" />, color: "text-cyan-400", label: "In Progress", bg: "bg-cyan-500/20 border-cyan-500/30" };
    case "BLOCKED":
      return { icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400", label: "Blocked", bg: "bg-red-500/20 border-red-500/30" };
    case "REVIEW":
      return { icon: <Clock className="w-4 h-4" />, color: "text-violet-400", label: "In Review", bg: "bg-violet-500/20 border-violet-500/30" };
    case "TODO":
      return { icon: <Clock className="w-4 h-4" />, color: "text-blue-400", label: "To Do", bg: "bg-blue-500/20 border-blue-500/30" };
    case "BACKLOG":
      return { icon: <Clock className="w-4 h-4" />, color: "text-white/40", label: "Backlog", bg: "bg-white/10 border-white/10" };
    case "CANCELLED":
      return { icon: <XCircle className="w-4 h-4" />, color: "text-red-400/60", label: "Cancelled", bg: "bg-red-500/10 border-red-500/20" };
    default:
      return { icon: <Clock className="w-4 h-4" />, color: "text-white/40", label: s, bg: "bg-white/10 border-white/10" };
  }
}

function priorityConfig(p: string) {
  switch (p.toUpperCase()) {
    case "CRITICAL":
    case "URGENT":
      return { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <Flag className="w-3 h-3" /> };
    case "HIGH":
      return { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Flag className="w-3 h-3" /> };
    case "NORMAL":
      return { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Flag className="w-3 h-3" /> };
    default:
      return { color: "bg-white/10 text-white/40 border-white/10", icon: <Flag className="w-3 h-3" /> };
  }
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const TRANSITIONS: Record<string, string[]> = {
  backlog: ["todo"],
  todo: ["in_progress", "cancelled"],
  pending: ["in_progress", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["review", "blocked", "cancelled"],
  review: ["done", "in_progress", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  done: [],
  cancelled: [],
  rejected: ["todo"],
};

const DESTRUCTIVE_STATUSES = new Set(["cancelled"]);

const ESCALATION_REASONS = ["MANUAL", "BLOCKED_TIMEOUT", "STALE_TASK", "SLA_BREACH", "ASSIGNEE_INACTIVE", "QUALITY_ISSUES", "CAPACITY_OVERFLOW"] as const;

/* ── Component ─────────────────────────────────────────────────── */

export function TaskDetailPanel({
  task, agents, comments, escalations, approvals,
  onAgentClick, onTransition, onAssign, onAddComment, onEscalate,
  onApproveApproval, onRejectApproval,
}: TaskDetailPanelProps) {
  const status = statusConfig(task.status);
  const priority = priorityConfig(task.priority);
  const [commentText, setCommentText] = useState("");
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateReason, setEscalateReason] = useState<string>("MANUAL");
  const [escalateNotes, setEscalateNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const normalizedStatus = task.status.toLowerCase();
  const validTransitions = TRANSITIONS[normalizedStatus] ?? [];
  const activeEscalations = escalations?.filter((e) => !e.resolved_at) ?? [];
  const pendingApprovals = approvals?.filter((a) => a.status === "pending") ?? [];

  const handleTransition = (nextStatus: string) => {
    if (DESTRUCTIVE_STATUSES.has(nextStatus)) {
      setConfirmTransition(nextStatus);
    } else {
      onTransition?.(nextStatus);
    }
  };

  const handleConfirmTransition = () => {
    if (confirmTransition) {
      onTransition?.(confirmTransition);
      setConfirmTransition(null);
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment?.(commentText.trim());
      setCommentText("");
    }
  };

  const handleEscalate = () => {
    onEscalate?.(escalateReason, escalateNotes || undefined);
    setShowEscalate(false);
    setEscalateNotes("");
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{task.identifier}</span>
            <Badge variant="outline" className={cn("text-[10px] gap-1", status.bg, status.color)}>{status.icon}{status.label}</Badge>
            <Badge variant="outline" className={cn("text-[10px] gap-1", priority.color)}>{priority.icon}{task.priority}</Badge>
          </div>
          <h2 className="text-lg font-semibold text-white leading-snug">{task.title}</h2>
        </div>

        {/* Escalation Banner */}
        {activeEscalations.length > 0 && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
              <ShieldAlert className="w-4 h-4" />
              Escalated
            </div>
            {activeEscalations.map((esc) => (
              <div key={esc.id} className="text-xs text-red-300/70">
                <span className="font-medium">{esc.reason.replace(/_/g, " ")}</span>
                {esc.notes && <span> — {esc.notes}</span>}
                <span className="text-red-400/50 ml-2">{formatDateTime(esc.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status Transitions */}
        {validTransitions.length > 0 && onTransition && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Transition</h4>
            <div className="flex flex-wrap gap-2">
              {validTransitions.map((nextStatus) => {
                const cfg = statusConfig(nextStatus);
                const isDestructive = DESTRUCTIVE_STATUSES.has(nextStatus);
                return (
                  <Button key={nextStatus} variant={isDestructive ? "destructive" : "outline"} size="sm"
                    className={cn("text-xs gap-1.5", !isDestructive && "hover:border-white/30")}
                    onClick={() => handleTransition(nextStatus)}>
                    <ChevronRight className="w-3 h-3" />{cfg.label}
                  </Button>
                );
              })}
            </div>
            {confirmTransition && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2">
                <p className="text-xs text-red-300">
                  Are you sure you want to transition to <strong>{statusConfig(confirmTransition).label}</strong>?
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleConfirmTransition}>Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmTransition(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Progress */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Status</h4>
          <StatusTimeline status={task.status} />
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Assignee</h4>
          {task.assignee ? (
            <button onClick={() => task.assignee && onAgentClick?.(task.assignee.id)}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all w-full text-left group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 group-hover:text-white transition-colors">{task.assignee.name}</div>
                <div className="text-[10px] text-white/30">Click to view agent</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
            </button>
          ) : (
            <p className="text-xs text-white/30">Unassigned</p>
          )}
          {agents && agents.length > 0 && onAssign && (
            <select className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-cyan-500/50"
              value={task.assigneeId ?? ""} onChange={(e) => { if (e.target.value) onAssign(e.target.value); }}>
              <option value="">Assign to agent…</option>
              {agents.map((agent) => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
            </select>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Description</h4>
            <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-lg p-3 border border-white/5">{task.description}</div>
          </div>
        )}

        {/* Approval Section */}
        {task.approvalRequired && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />Approval
            </h4>
            {task.approvedAt ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />Approved {formatDateTime(task.approvedAt)}
              </div>
            ) : pendingApprovals.length > 0 ? (
              <div className="space-y-2">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      <Clock className="w-3.5 h-3.5" />Pending approval — {approval.action_type.replace(/_/g, " ")}
                    </div>
                    {onApproveApproval && onRejectApproval && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => onApproveApproval(approval.id)}>
                            <ThumbsUp className="w-3 h-3" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-red-400 hover:bg-red-500/10"
                            onClick={() => { const notes = rejectNotes[approval.id]; if (notes?.trim()) onRejectApproval(approval.id, notes.trim()); }}>
                            <ThumbsDown className="w-3 h-3" />Reject
                          </Button>
                        </div>
                        <input type="text" placeholder="Rejection reason (required to reject)…"
                          className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white/70 focus:outline-none focus:border-red-500/50"
                          value={rejectNotes[approval.id] ?? ""}
                          onChange={(e) => setRejectNotes((prev) => ({ ...prev, [approval.id]: e.target.value }))} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />Approval required
              </div>
            )}
          </div>
        )}

        {/* Escalation Section */}
        {onEscalate && activeEscalations.length === 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Escalation</h4>
            {!showEscalate ? (
              <Button size="sm" variant="outline" className="text-xs gap-1.5 text-amber-400 hover:bg-amber-500/10"
                onClick={() => setShowEscalate(true)}>
                <ShieldAlert className="w-3 h-3" />Escalate Task
              </Button>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
                <select className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white/70 focus:outline-none"
                  value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)}>
                  {ESCALATION_REASONS.map((r) => (<option key={r} value={r}>{r.replace(/_/g, " ")}</option>))}
                </select>
                <input type="text" placeholder="Notes (optional)…"
                  className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white/70 focus:outline-none"
                  value={escalateNotes} onChange={(e) => setEscalateNotes(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={handleEscalate}>Escalate</Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowEscalate(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejection info */}
        {task.rejection?.feedback && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-red-400/80 uppercase tracking-wider">Rejected</h4>
            <div className="text-sm text-red-300/70 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              {task.rejection.feedback}
              {task.rejection.rejectionCount && task.rejection.rejectionCount > 1 && (
                <span className="block mt-1 text-[10px] text-red-400/50">Rejected {task.rejection.rejectionCount} times</span>
              )}
            </div>
          </div>
        )}

        {/* Comment Thread */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Comments {comments && comments.length > 0 && `(${comments.length})`}
          </h4>
          {comments && comments.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-white/40">{c.author_id.slice(0, 8)}</span>
                    <span className="text-[10px] text-white/30">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">No comments yet</p>
          )}
          {onAddComment && (
            <div className="flex gap-2">
              <input type="text" placeholder="Add a comment…"
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-cyan-500/50"
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} />
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleAddComment} disabled={!commentText.trim()}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Details</h4>
          <div className="space-y-0">
            <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Created" value={formatDate(task.createdAt)} />
            <MetaRow icon={<Clock className="w-3.5 h-3.5" />} label="Updated" value={formatDateTime(task.updatedAt)} />
            {task.dueDate && <MetaRow icon={<Flag className="w-3.5 h-3.5 text-amber-400" />} label="Due" value={formatDate(task.dueDate)} />}
            {task.completedAt && <MetaRow icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} label="Completed" value={formatDateTime(task.completedAt)} />}
            {task.approvedAt && <MetaRow icon={<CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />} label="Approved" value={formatDateTime(task.approvedAt)} />}
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
            <div className={cn("h-1.5 flex-1 rounded-full transition-colors",
              isActive ? "bg-current " + cfg.color : isPast ? "bg-emerald-500/40" : "bg-white/10")} />
            {i < FLOW.length - 1 && <div className="w-0.5" />}
          </div>
        );
      })}
      {(isBlocked || isCancelled) && (
        <div className={cn("ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded",
          isBlocked ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40")}>
          {isBlocked ? "BLOCKED" : "CANCELLED"}
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-xs text-white/40">{icon}<span>{label}</span></div>
      <span className="text-xs text-white/70 font-medium">{value}</span>
    </div>
  );
}
