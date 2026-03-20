/**
 * Shared Agent Detail Panel — used inside SidePanelShell.
 *
 * Renders a rich agent profile with:
 *   - Header (avatar, name, level, role, status + online/offline indicator)
 *   - Quick stats row (trust score, tasks completed, balance)
 *   - Tabs: Overview | Tasks | Memories | Capabilities | Info
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
  Brain,
  Wrench,
  Wallet,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Sparkline } from "../ui/sparkline";

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
  defaultAutonomyLevel: number;
  managementFeePct: number;
  budgetPeriodLimit?: number | null;
  budgetPeriodSpent: number;
  parentId?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPanelTask {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
}

export interface AgentPanelMemory {
  id: string;
  content: string;
  type?: string;
  createdAt: string;
}

export interface AgentPanelCapability {
  id?: string;
  name: string;
  description?: string;
}

export interface AgentPanelBudget {
  budget_period_limit?: number | null;
  budget_period_spent: number;
  can_spend: boolean;
  remaining?: number | null;
}

export interface AgentPanelReputation {
  trust_score: number;
  tasks_completed: number;
  tasks_successful: number;
  success_rate: number;
  level: string;
}

interface AgentDetailPanelProps {
  agent: AgentPanelAgent;
  tasks?: AgentPanelTask[];
  memories?: AgentPanelMemory[];
  capabilities?: AgentPanelCapability[];
  budget?: AgentPanelBudget | null;
  reputationHistory?: number[];
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

function isOnline(lastActivityAt?: string | null): boolean {
  if (!lastActivityAt) return false;
  const diff = Date.now() - new Date(lastActivityAt).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

function lastSeenLabel(lastActivityAt?: string | null): string {
  if (!lastActivityAt) return "Offline";
  const diff = Date.now() - new Date(lastActivityAt).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Online now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${Math.floor(hrs / 24)}d ago`;
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

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Component ─────────────────────────────────────────────────── */

export function AgentDetailPanel({
  agent,
  tasks = [],
  memories = [],
  capabilities = [],
  budget,
  reputationHistory,
  parentName,
  teamName,
  onTaskClick,
}: AgentDetailPanelProps) {
  const successRate =
    agent.tasksCompleted > 0 ? Math.round((agent.tasksSuccessful / agent.tasksCompleted) * 100) : 0;
  const activeTasks = tasks.filter((t) => !["DONE", "CANCELLED"].includes(t.status.toUpperCase()));
  const completedTasks = tasks.filter((t) => t.status.toUpperCase() === "DONE");
  const online = isOnline(agent.lastActivityAt);

  // Compute tab count for dynamic tabs
  const tabItems: { value: string; label: string; count?: number }[] = [
    { value: "overview", label: "Overview" },
    { value: "tasks", label: "Tasks", count: tasks.length || undefined },
  ];
  if (memories.length > 0) {
    tabItems.push({ value: "memories", label: "Memories", count: memories.length });
  }
  if (capabilities.length > 0) {
    tabItems.push({ value: "capabilities", label: "Skills", count: capabilities.length });
  }
  tabItems.push({ value: "info", label: "Info" });

  // Budget progress
  const budgetLimit = budget?.budget_period_limit ?? agent.budgetPeriodLimit;
  const budgetSpent = budget?.budget_period_spent ?? agent.budgetPeriodSpent;
  const budgetPct = budgetLimit && budgetLimit > 0 ? Math.min(100, Math.round((budgetSpent / budgetLimit) * 100)) : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-5 space-y-6">
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
                online ? "bg-emerald-400" : "bg-gray-500",
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
              <span className={cn("text-[10px] flex items-center gap-1", online ? "text-emerald-400" : "text-white/30")}>
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full", online ? "bg-emerald-400" : "bg-gray-500")} />
                {lastSeenLabel(agent.lastActivityAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatBox
            icon={<Shield className="w-4 h-4 text-cyan-400" />}
            label="Trust"
            value={`${agent.trustScore}%`}
            sparkline={
              reputationHistory && reputationHistory.length >= 2 ? (
                <Sparkline data={reputationHistory} width={56} height={18} color="#06b6d4" showTrend />
              ) : undefined
            }
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
          <TabsList className={cn("w-full grid bg-white/5 rounded-lg h-9 md:h-8 overflow-x-auto", `grid-cols-${tabItems.length}`)}>
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-[11px] md:text-xs min-h-[36px] md:min-h-0 whitespace-nowrap">
                {tab.label}
                {tab.count != null && <span className="ml-1 text-white/40">({tab.count})</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Trust Score Progress */}
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

            {/* Reputation History Sparkline */}
            {reputationHistory && reputationHistory.length >= 2 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Trust Score Trend
                </h4>
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <Sparkline
                    data={reputationHistory}
                    width={280}
                    height={40}
                    color="#06b6d4"
                    showArea
                    showDot
                    showTrend
                  />
                </div>
              </div>
            )}

            {/* Success Rate */}
            {agent.tasksCompleted > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Success Rate</span>
                  <span className="font-medium text-emerald-400">{successRate}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
            )}

            {/* Budget Progress Bar */}
            {budgetPct !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Budget
                  </span>
                  <span className={cn("font-medium", budgetPct >= 90 ? "text-red-400" : budgetPct >= 70 ? "text-amber-400" : "text-emerald-400")}>
                    {budgetSpent.toLocaleString()}c / {budgetLimit!.toLocaleString()}c
                  </span>
                </div>
                <Progress value={budgetPct} className="h-2" />
                {budget && !budget.can_spend && (
                  <div className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Budget exhausted
                  </div>
                )}
              </div>
            )}

            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Active Tasks
                </h4>
                {activeTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    className="w-full flex items-center gap-2 p-3 md:p-2 min-h-[44px] rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
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

            {/* Organization */}
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

          {memories.length > 0 && (
            <TabsContent value="memories" className="mt-4 space-y-3">
              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Recent Memories
              </h4>
              {memories.slice(0, 20).map((mem) => (
                <div
                  key={mem.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1"
                >
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    {mem.type && (
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">
                        {mem.type}
                      </Badge>
                    )}
                    <span>{formatTimeAgo(mem.createdAt)}</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{mem.content}</p>
                </div>
              ))}
            </TabsContent>
          )}

          {capabilities.length > 0 && (
            <TabsContent value="capabilities" className="mt-4 space-y-3">
              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Capabilities
              </h4>
              <div className="grid gap-2">
                {capabilities.map((cap, i) => (
                  <div
                    key={cap.id ?? i}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="text-xs font-medium text-white/80">{cap.name}</div>
                    {cap.description && (
                      <div className="text-[10px] text-white/40 mt-0.5">{cap.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="info" className="mt-4 space-y-3">
            <InfoRow label="Model" value={agent.model} />
            <InfoRow label="Mode" value={agent.mode} />
            <InfoRow label="Role" value={agent.role} />
            <InfoRow label="Level" value={`L${agent.level} — ${getLevelLabel(agent.level)}`} />
            <InfoRow label="Autonomy" value={`Level ${agent.defaultAutonomyLevel}`} />
            <InfoRow label="Management Fee" value={`${agent.managementFeePct}%`} />
            <InfoRow
              label="Lifetime Earnings"
              value={`${agent.lifetimeEarnings.toLocaleString()}c`}
            />
            {budgetLimit != null && (
              <InfoRow
                label="Budget Limit"
                value={`${budgetLimit.toLocaleString()}c / period`}
              />
            )}
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
      className="w-full flex items-center gap-2.5 p-3 md:p-2.5 min-h-[44px] rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all text-left group"
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
