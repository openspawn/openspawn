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

function getLevelColorRaw(level: number): string {
  if (level >= 9) return "rgb(251 191 36)";
  if (level >= 7) return "rgb(167 139 250)";
  if (level >= 5) return "rgb(34 211 238)";
  if (level >= 3) return "rgb(96 165 250)";
  return "rgb(255 255 255 / 0.6)";
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

function statusDot(s: string): string {
  switch (s.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-400";
    case "PENDING":
      return "bg-amber-400";
    case "SUSPENDED":
    case "REVOKED":
      return "bg-red-400";
    default:
      return "bg-white/40";
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
  const activeTasks = tasks.filter((t) => !["DONE", "CANCELLED"].includes(t.status.toUpperCase()));
  const completedTasks = tasks.filter((t) => t.status.toUpperCase() === "DONE");
  const levelColor = getLevelColorRaw(agent.level);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0">
        {/* ── Header ── */}
        <div
          className="px-6 pt-6 pb-5"
          style={{
            background: `linear-gradient(180deg, ${levelColor.replace("rgb(", "rgba(").replace(")", " / 0.08)")} 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg",
                  agent.avatarUrl ? "" : "border border-white/10",
                )}
                style={
                  agent.avatarUrl
                    ? undefined
                    : {
                        background: `linear-gradient(135deg, ${levelColor.replace("rgb(", "rgba(").replace(")", " / 0.25)")}, ${levelColor.replace("rgb(", "rgba(").replace(")", " / 0.08)")})`,
                      }
                }
              >
                {agent.avatarUrl ? (
                  <img
                    src={agent.avatarUrl}
                    alt={agent.name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-white/90">
                    {agent.avatar || agent.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[hsl(var(--background))]",
                  statusDot(agent.status),
                )}
              />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-xl font-bold text-white truncate leading-tight">{agent.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn("text-sm font-semibold", getLevelColor(agent.level))}>
                  L{agent.level}
                </span>
                <span className="text-white/20 text-xs">/</span>
                <span className="text-sm text-white/50 capitalize">
                  {getLevelLabel(agent.level)}
                </span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-sm text-white/40 capitalize">{agent.role.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-2 py-0", statusColor(agent.status))}
                >
                  {agent.status.toLowerCase()}
                </Badge>
                {agent.domain && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0 text-white/40 border-white/10"
                  >
                    {agent.domain}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <StatBox
              icon={<Shield className="w-3.5 h-3.5 text-cyan-400" />}
              label="Trust"
              value={`${agent.trustScore}%`}
              accent="cyan"
            />
            <StatBox
              icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
              label="Done"
              value={String(agent.tasksCompleted)}
              sub={successRate > 0 ? `${successRate}%` : undefined}
              accent="amber"
            />
            <StatBox
              icon={<Coins className="w-3.5 h-3.5 text-emerald-400" />}
              label="Balance"
              value={`${(agent.currentBalance ?? 0).toLocaleString()}c`}
              accent="emerald"
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-transparent h-auto p-0 border-b border-white/10 rounded-none">
              <div className="grid grid-cols-3 w-full">
                <TabsTrigger
                  value="overview"
                  className="text-xs pb-2.5 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none text-white/40 hover:text-white/60 transition-colors"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="text-xs pb-2.5 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none text-white/40 hover:text-white/60 transition-colors"
                >
                  Tasks
                  {tasks.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="text-xs pb-2.5 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none text-white/40 hover:text-white/60 transition-colors"
                >
                  Info
                </TabsTrigger>
              </div>
            </TabsList>

            {/* ── Overview tab ── */}
            <TabsContent value="overview" className="mt-5 space-y-5">
              {/* Progress bars */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/50">Trust Score</span>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        getLevelColor(Math.ceil(agent.trustScore / 10)),
                      )}
                    >
                      {agent.trustScore}%
                    </span>
                  </div>
                  <Progress value={agent.trustScore} className="h-1.5" />
                </div>
                {agent.tasksCompleted > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-white/50">Success Rate</span>
                      <span className="text-sm font-semibold tabular-nums text-emerald-400">
                        {successRate}%
                      </span>
                    </div>
                    <Progress value={successRate} className="h-1.5" />
                  </div>
                )}
              </div>

              {/* Active tasks */}
              {activeTasks.length > 0 && (
                <div className="space-y-2.5">
                  <SectionLabel>Active Tasks</SectionLabel>
                  <div className="space-y-1.5">
                    {activeTasks.slice(0, 5).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left group"
                      >
                        {taskStatusIcon(task.status)}
                        <span className="text-xs text-white/70 truncate flex-1 group-hover:text-white/90 transition-colors">
                          {task.title}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0",
                            taskPriorityColor(task.priority),
                          )}
                        >
                          {task.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Organization */}
              {(parentName || teamName) && (
                <div className="space-y-2.5">
                  <SectionLabel>Organization</SectionLabel>
                  <div className="space-y-2">
                    {parentName && (
                      <div className="flex items-center gap-2.5 text-xs text-white/50">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Reports to <span className="text-white/80 font-medium">{parentName}</span>
                        </span>
                      </div>
                    )}
                    {teamName && (
                      <div className="flex items-center gap-2.5 text-xs text-white/50">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Team <span className="text-white/80 font-medium">{teamName}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tasks tab ── */}
            <TabsContent value="tasks" className="mt-5 space-y-5">
              {tasks.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">No tasks assigned</p>
              ) : (
                <>
                  {activeTasks.length > 0 && (
                    <div className="space-y-2.5">
                      <SectionLabel>Active ({activeTasks.length})</SectionLabel>
                      <div className="space-y-1.5">
                        {activeTasks.map((t) => (
                          <TaskRow key={t.id} task={t} onClick={() => onTaskClick?.(t.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {completedTasks.length > 0 && (
                    <div className="space-y-2.5">
                      <SectionLabel>Completed ({completedTasks.length})</SectionLabel>
                      <div className="space-y-1.5">
                        {completedTasks.map((t) => (
                          <TaskRow key={t.id} task={t} onClick={() => onTaskClick?.(t.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Info tab ── */}
            <TabsContent value="info" className="mt-5">
              <div className="rounded-lg bg-white/[0.02] divide-y divide-white/5">
                <InfoRow label="Model" value={agent.model} />
                <InfoRow label="Mode" value={agent.mode} />
                <InfoRow label="Role" value={agent.role} />
                <InfoRow label="Level" value={`L${agent.level} — ${getLevelLabel(agent.level)}`} />
                <InfoRow
                  label="Lifetime Earnings"
                  value={`${(agent.lifetimeEarnings ?? 0).toLocaleString()}c`}
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
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom padding for scroll breathing room */}
        <div className="h-6" />
      </div>
    </ScrollArea>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{children}</h4>
  );
}

function StatBox({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "cyan" | "amber" | "emerald";
}) {
  const bgMap = {
    cyan: "bg-cyan-500/5",
    amber: "bg-amber-500/5",
    emerald: "bg-emerald-500/5",
  };
  return (
    <div className={cn("rounded-xl p-3 space-y-1.5", bgMap[accent])}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-white/35 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-white tabular-nums leading-none">{value}</span>
        {sub && <span className="text-[10px] text-white/30">{sub}</span>}
      </div>
    </div>
  );
}

function TaskRow({ task, onClick }: { task: AgentPanelTask; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all text-left group"
    >
      {taskStatusIcon(task.status)}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/70 truncate group-hover:text-white/90 transition-colors">
          {task.title}
        </div>
        <div className="text-[10px] text-white/25 mt-0.5">{task.identifier}</div>
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
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <span className="text-xs text-white/35">{label}</span>
      <span className="text-xs text-white/80 font-medium tabular-nums">{value}</span>
    </div>
  );
}
