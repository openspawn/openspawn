/**
 * Shared Agent Detail Panel — used inside SidePanelShell.
 *
 * Renders a rich agent profile with:
 *   - Header (avatar, name, level, role, status)
 *   - Quick stats row (trust score, tasks completed, balance)
 *   - Tabs: Overview | Tasks | Info
 *
 * No data-fetching — consumers pass agent + related data as props.
 */

import {
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Coins,
  User,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";

import { cn } from "../lib/utils";

/* ── Types ─────────────────────────────────────────────────────── */

export interface AgentPanelAgent {
  id: string;
  name: string;
  level: number;
  role: string;
  status: string;
  trustScore: number;
  tasksCompleted: number;
  tasksSuccessful: number;
  currentBalance: number;
  lifetimeEarnings: number;
  avatar?: string | null;
  avatarUrl?: string | null;
  avatarColor?: string | null;
  domain?: string | null;
  model: string;
  mode: string;
  teamId?: string | null;
  parentId?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface AgentPanelTask {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
}

interface AgentDetailPanelProps {
  agent: AgentPanelAgent;
  tasks?: AgentPanelTask[];
  parentName?: string;
  teamName?: string;
  onTaskClick?: (taskId: string) => void;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function getLevelLabel(level: number): string {
  if (level >= 10) return "CEO";
  if (level >= 9) return "Executive";
  if (level >= 7) return "Director";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Mid";
  return "Junior";
}

function getLevelColor(level: number): string {
  if (level >= 9) return "text-amber-400";
  if (level >= 7) return "text-violet-400";
  if (level >= 5) return "text-cyan-400";
  if (level >= 3) return "text-blue-400";
  return "text-white/60";
}

function statusColor(s: string): string {
  switch (s.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "PENDING":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "SUSPENDED":
    case "REVOKED":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-white/10 text-white/60 border-white/10";
  }
}

function taskStatusIcon(s: string) {
  switch (s.toUpperCase()) {
    case "DONE":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case "IN_PROGRESS":
      return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
    case "BLOCKED":
      return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    case "REVIEW":
      return <Clock className="w-3.5 h-3.5 text-violet-400" />;
    case "CANCELLED":
      return <XCircle className="w-3.5 h-3.5 text-red-400/60" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-white/40" />;
  }
}

function taskPriorityColor(p: string): string {
  switch (p.toUpperCase()) {
    case "URGENT":
      return "bg-red-500/20 text-red-400";
    case "HIGH":
      return "bg-amber-500/20 text-amber-400";
    case "NORMAL":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-white/10 text-white/40";
  }
}

/* ── Component ─────────────────────────────────────────────────── */

export function AgentDetailPanel({
  agent,
  tasks = [],
  parentName,
  teamName,
  onTaskClick,
}: AgentDetailPanelProps) {
  const successRate =
    agent.tasksCompleted > 0 ? Math.round((agent.tasksSuccessful / agent.tasksCompleted) * 100) : 0;
  // No fake sparklines — only show real time-series data when available
  const activeTasks = tasks.filter((t) => !["DONE", "CANCELLED"].includes(t.status.toUpperCase()));
  const completedTasks = tasks.filter((t) => t.status.toUpperCase() === "DONE");

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold",
                agent.avatarUrl
                  ? ""
                  : "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/10",
              )}
            >
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                agent.avatar || agent.name.charAt(0).toUpperCase()
              )}
            </div>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[hsl(var(--background))]",
                agent.status.toUpperCase() === "ACTIVE" ? "bg-emerald-400" : "bg-amber-400",
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{agent.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn("text-sm font-medium", getLevelColor(agent.level))}>
                L{agent.level} {getLevelLabel(agent.level)}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-sm text-white/50 capitalize">{agent.role.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={cn("text-[10px]", statusColor(agent.status))}>
                {agent.status}
              </Badge>
              {agent.domain && (
                <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">
                  {agent.domain}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox
            icon={<Shield className="w-4 h-4 text-cyan-400" />}
            label="Trust"
            value={`${agent.trustScore}%`}
            
          />
          <StatBox
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            label="Done"
            value={String(agent.tasksCompleted)}
            sub={successRate > 0 ? `${successRate}% success` : undefined}
          />
          <StatBox
            icon={<Coins className="w-4 h-4 text-emerald-400" />}
            label="Balance"
            value={`${agent.currentBalance.toLocaleString()}c`}
            
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-white/5 rounded-lg h-8">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              Tasks{" "}
              {tasks.length > 0 && <span className="ml-1 text-white/40">({tasks.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs">
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Trust Score</span>
                <span
                  className={cn("font-medium", getLevelColor(Math.ceil(agent.trustScore / 10)))}
                >
                  {agent.trustScore}%
                </span>
              </div>
              <Progress value={agent.trustScore} className="h-2" />
            </div>
            {agent.tasksCompleted > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Success Rate</span>
                  <span className="font-medium text-emerald-400">{successRate}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
            )}
            {activeTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Active Tasks
                </h4>
                {activeTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
                  >
                    {taskStatusIcon(task.status)}
                    <span className="text-xs text-white/80 truncate flex-1">{task.title}</span>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-medium",
                        taskPriorityColor(task.priority),
                      )}
                    >
                      {task.priority}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {(parentName || teamName) && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Organization
                </h4>
                {parentName && (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      Reports to <span className="text-white/80">{parentName}</span>
                    </span>
                  </div>
                )}
                {teamName && (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>
                      Team: <span className="text-white/80">{teamName}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-6">No tasks assigned</p>
            ) : (
              <>
                {activeTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                      Active ({activeTasks.length})
                    </h4>
                    {activeTasks.map((t) => (
                      <TaskRow key={t.id} task={t} onClick={() => onTaskClick?.(t.id)} />
                    ))}
                  </div>
                )}
                {completedTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                      Completed ({completedTasks.length})
                    </h4>
                    {completedTasks.map((t) => (
                      <TaskRow key={t.id} task={t} onClick={() => onTaskClick?.(t.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-4 space-y-3">
            <InfoRow label="Model" value={agent.model} />
            <InfoRow label="Mode" value={agent.mode} />
            <InfoRow label="Role" value={agent.role} />
            <InfoRow label="Level" value={`L${agent.level} — ${getLevelLabel(agent.level)}`} />
            <InfoRow
              label="Lifetime Earnings"
              value={`${agent.lifetimeEarnings.toLocaleString()}c`}
            />
            <InfoRow
              label="Created"
              value={new Date(agent.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            {agent.lastActivityAt && (
              <InfoRow
                label="Last Active"
                value={new Date(agent.lastActivityAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

function StatBox({
  icon,
  label,
  value,
  sub,
  sparkline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  sparkline?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {sub && <div className="text-[10px] text-white/40">{sub}</div>}
      {sparkline && <div className="mt-1">{sparkline}</div>}
    </div>
  );
}

function TaskRow({ task, onClick }: { task: AgentPanelTask; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all text-left group"
    >
      {taskStatusIcon(task.status)}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/80 truncate group-hover:text-white transition-colors">
          {task.title}
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">{task.identifier}</div>
      </div>
      <span
        className={cn(
          "text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0",
          taskPriorityColor(task.priority),
        )}
      >
        {task.priority}
      </span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs text-white/80 font-medium">{value}</span>
    </div>
  );
}
