import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useDashboardPanels } from "@openspawn/dashboard-data";
import { motion } from "motion/react";
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatusRing,
  Avatar,
  AvatarFallback,
  generateSparklineData,
} from "@openspawn/dashboard-ui";
import {
  Users,
  CheckSquare,
  Activity,
  ArrowRight,
  Clock,
  TrendingUp,
  Shield,
  CircleDot,
} from "lucide-react";
import { useAgents, useTasks, useEvents } from "../hooks";
import { AgentStatus, TaskStatus } from "@openspawn/dashboard-data";

/* ── Helpers ────────────────────────────────────────────────────── */

function timeAgo(date: string | null | undefined): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function levelLabel(level: number): string {
  if (level >= 10) return "CEO";
  if (level >= 9) return "VP";
  if (level >= 7) return "Lead";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Junior";
  return "Intern";
}

function priorityVariant(p: string) {
  switch (p) {
    case "URGENT": return "destructive" as const;
    case "HIGH": return "warning" as const;
    default: return "secondary" as const;
  }
}
function statusVariant(s: string) {
  switch (s) {
    case "DONE": return "success" as const;
    case "IN_PROGRESS": return "info" as const;
    case "CLAIMED": return "warning" as const;
    default: return "secondary" as const;
  }
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  FOUNDER: "bg-amber-500/20 text-amber-400",
  ADMIN:   "bg-cyan-500/20 text-cyan-400",
  WORKER:  "bg-violet-500/20 text-violet-400",
  HR:      "bg-emerald-500/20 text-emerald-400",
};

/* ── Agent Card ─────────────────────────────────────────────────── */

function AgentCard({ agent, taskCount, onClick }: { agent: any; taskCount: number; onClick?: () => void }) {
  const completion = agent.tasksCompleted > 0
    ? agent.tasksSuccessful / agent.tasksCompleted
    : 0;
  const credit = agent.budgetPeriodLimit
    ? agent.budgetPeriodSpent / agent.budgetPeriodLimit
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div onClick={onClick} className="block group cursor-pointer">
        <Card className="hover:border-cyan-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/5 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <StatusRing
                completionRate={completion}
                creditUsage={credit}
                status={agent.status === "ACTIVE" ? "active" : "idle"}
                size="sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={ROLE_COLORS[agent.role] ?? "bg-slate-500/20 text-slate-400"}>
                    {initials(agent.name)}
                  </AvatarFallback>
                </Avatar>
              </StatusRing>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{agent.name}</span>
                  <Badge
                    variant={agent.status === "ACTIVE" ? "success" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {agent.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>L{agent.level} {levelLabel(agent.level)}</span>
                  <span>·</span>
                  <span className="capitalize">{(agent.domain || "general").toLowerCase()}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-cyan-400">{taskCount}</div>
                <div className="text-[10px] text-muted-foreground">tasks</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> Trust {agent.trustScore}%
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(agent.lastActivityAt)}
              </span>
              {agent.tasksCompleted > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {agent.tasksSuccessful}/{agent.tasksCompleted}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

/* ── Task Row ───────────────────────────────────────────────────── */

function TaskRow({ task, index, onClick }: { task: any; index: number; onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
    >
      <div onClick={onClick} className="block group cursor-pointer">
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <CircleDot className={`h-3.5 w-3.5 shrink-0 ${
            task.status === "DONE"        ? "text-emerald-400" :
            task.status === "IN_PROGRESS" ? "text-cyan-400"    :
            "text-amber-400"
          }`} />

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block group-hover:text-cyan-400 transition-colors">
              {task.title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {task.identifier}
              {task.assignee && <> · {task.assignee.name}</>}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={priorityVariant(task.priority)} className="hidden sm:inline-flex text-[10px] px-1.5 py-0">
              {task.priority}
            </Badge>
            <Badge variant={statusVariant(task.status)} className="text-[10px] px-1.5 py-0">
              {task.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Dashboard Page ─────────────────────────────────────────────── */

export function DashboardPage() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { events } = useEvents();
  const { openAgentPanel, openTaskPanel } = useDashboardPanels({ agents, tasks });

  const stats = useMemo(() => {
    const active  = agents.filter(a => a.status === AgentStatus.Active);
    const done    = tasks.filter(t => t.status === TaskStatus.Done);
    const wip     = tasks.filter(t => t.status === TaskStatus.InProgress || t.status === TaskStatus.Review);
    const pending = tasks.filter(t => t.status === TaskStatus.Todo || t.status === TaskStatus.Backlog);
    const pct     = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    return { agents: agents.length, active: active.length, total: tasks.length,
             done: done.length, wip: wip.length, pending: pending.length,
             events: events.length, pct };
  }, [agents, tasks, events]);

  const tasksByAgent = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) if (t.assigneeId) m[t.assigneeId] = (m[t.assigneeId] || 0) + 1;
    return m;
  }, [tasks]);

  const sortedTasks = useMemo(() =>
    [...tasks].sort((a, b) => {
      const o: Record<string, number> = { IN_PROGRESS: 0, CLAIMED: 1, PENDING: 2, REVIEW: 3, DONE: 4 };
      return (o[a.status] ?? 5) - (o[b.status] ?? 5);
    }), [tasks]);

  const sparkA = useMemo(() => generateSparklineData(12, "up"), []);
  const sparkT = useMemo(() => generateSparklineData(12, "stable"), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Live overview of your agent organization" />

      {/* ── Stats Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/agents"><StatCard title="Agents" value={stats.agents} icon={Users}
          description={`${stats.active} active`} sparklineData={sparkA} sparklineColor="#06b6d4" /></Link>
        <Link to="/tasks"><StatCard title="Tasks" value={stats.total} icon={CheckSquare}
          description={`${stats.done} done · ${stats.wip} active`} sparklineData={sparkT} sparklineColor="#10b981" /></Link>
        <StatCard title="Completion" value={`${stats.pct}%`} icon={TrendingUp}
          description={`${stats.done} of ${stats.total} tasks`} />
        <Link to="/events"><StatCard title="Events" value={stats.events} icon={Activity}
          description="Activity log" /></Link>
      </div>

      {/* ── Progress Bar ──────────────────────────────────── */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Task Progress</span>
              <span className="text-xs text-muted-foreground">{stats.done}/{stats.total} complete</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
              {stats.done > 0 && <motion.div className="bg-emerald-500 rounded-l-full"
                initial={{ width: 0 }} animate={{ width: `${(stats.done / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }} />}
              {stats.wip > 0 && <motion.div className="bg-cyan-500"
                initial={{ width: 0 }} animate={{ width: `${(stats.wip / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }} />}
              {stats.pending > 0 && <motion.div className="bg-amber-500/40 rounded-r-full"
                initial={{ width: 0 }} animate={{ width: `${(stats.pending / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} />}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Done ({stats.done})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500 inline-block" /> In Progress ({stats.wip})</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500/40 inline-block" /> Pending ({stats.pending})</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Two-Column: Team + Tasks ──────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Team */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Team</CardTitle>
              <Link to="/agents" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {agentsLoading && <div className="text-sm text-muted-foreground animate-pulse">Loading agents…</div>}
            {agents.map(a => <AgentCard key={a.id} agent={a} taskCount={tasksByAgent[a.id] || 0} onClick={() => openAgentPanel(a.id)} />)}
            {!agentsLoading && agents.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">No agents registered yet</div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
              <Link to="/tasks" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tasksLoading && <div className="text-sm text-muted-foreground animate-pulse">Loading tasks…</div>}
            <div className="divide-y divide-white/5">
              {sortedTasks.slice(0, 8).map((t, i) => <TaskRow key={t.id} task={t} index={i} onClick={() => openTaskPanel(t.id)} />)}
            </div>
            {!tasksLoading && tasks.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No tasks yet — they will appear as agents start working
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
