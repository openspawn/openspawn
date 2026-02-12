/**
 * Mobile Status View — compact, fast-scanning agent fleet overview.
 *
 * Optimized for mobile with:
 * - Summary stat pills (agents, active, tasks, credits)
 * - Grouped agent rows sorted by status priority
 * - Expandable accordion detail on tap
 * - Pull-to-refresh button
 * - No charts/graphs — pure status data
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronDown, Coins, Zap, Clock, Activity, CheckCircle, AlertTriangle, Bot } from "lucide-react";
import { cn } from "../lib/utils";
import { useAgents, usePresence, useAgentHealth, useTasks } from "../hooks";
import type { PresenceStatus } from "../hooks";
import { AgentAvatar } from "../components/agent-avatar";
import { StatusDot } from "../components/presence";
import { Sparkline, generateSparklineData } from "../components/ui/sparkline";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { getLevelLabel, getLevelColor } from "../lib/status-colors";
import { AgentStatus } from "../graphql/generated/graphql";
import type { AgentFieldsFragment } from "../graphql/generated/graphql";

/* ------------------------------------------------------------------ */
/*  Status ordering & colors                                           */
/* ------------------------------------------------------------------ */

const STATUS_ORDER: Record<PresenceStatus, number> = {
  active: 0,
  busy: 1,
  idle: 2,
  error: 3,
};

const STATUS_LABELS: Record<PresenceStatus, string> = {
  active: "Active",
  busy: "Busy",
  idle: "Idle",
  error: "Error",
};

const STATUS_BG: Record<PresenceStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  busy: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  idle: "bg-muted text-muted-foreground border-border",
  error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

/* ------------------------------------------------------------------ */
/*  Stat Pill                                                          */
/* ------------------------------------------------------------------ */

interface StatPillProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

function StatPill({ label, value, color, icon }: StatPillProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 flex-1 min-w-0", color)}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-lg font-bold tabular-nums leading-none">{value}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70 leading-none">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent Row (expandable)                                             */
/* ------------------------------------------------------------------ */

interface AgentRowProps {
  agent: AgentFieldsFragment;
  presence: PresenceStatus;
  currentTask?: string;
  health?: { completionRate: number; creditUsage: number };
  expanded: boolean;
  onToggle: () => void;
}

function AgentRow({ agent, presence, currentTask, health, expanded, onToggle }: AgentRowProps) {
  // Deterministic sparkline data based on agent status
  const sparkData = useMemo(
    () => generateSparklineData(8, presence === "active" ? "up" : presence === "error" ? "down" : "stable"),
    [agent.id, presence]
  );

  const levelColor = getLevelColor(agent.level);
  const successRate = agent.tasksCompleted > 0
    ? Math.round((agent.tasksSuccessful / agent.tasksCompleted) * 100)
    : 0;

  return (
    <div className="border-b border-border/50 last:border-b-0">
      {/* Tappable row */}
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-3 py-3 text-left active:bg-muted/50 transition-colors min-h-[56px]"
      >
        {/* Avatar with status ring */}
        <AgentAvatar
          agentId={agent.agentId}
          name={agent.name}
          level={agent.level}
          size="sm"
          avatar={(agent as any).avatar}
          avatarColor={(agent as any).avatarColor}
          presenceStatus={presence}
          completionRate={health?.completionRate}
          creditUsage={health?.creditUsage}
        />

        {/* Name + task */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{agent.name}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 h-4 border", STATUS_BG[presence])}
            >
              {STATUS_LABELS[presence]}
            </Badge>
          </div>
          {currentTask ? (
            <p className="text-[11px] text-emerald-400/80 truncate mt-0.5">{currentTask}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {getLevelLabel(agent.level)} · L{agent.level}
            </p>
          )}
        </div>

        {/* Sparkline (tiny) */}
        <Sparkline
          data={sparkData}
          width={40}
          height={16}
          color={levelColor}
          showDot={false}
          className="hidden xs:inline-flex shrink-0"
        />

        {/* Credits */}
        <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0 w-14 text-right">
          {agent.currentBalance >= 1000
            ? `${(agent.currentBalance / 1000).toFixed(1)}k`
            : agent.currentBalance.toLocaleString()}
        </span>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 ml-11 space-y-3">
              {/* Quick stats grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-sm font-bold">{agent.tasksCompleted}</div>
                  <div className="text-[10px] text-muted-foreground">Tasks</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-sm font-bold">{successRate}%</div>
                  <div className="text-[10px] text-muted-foreground">Success</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-sm font-bold">{agent.trustScore ?? 50}</div>
                  <div className="text-[10px] text-muted-foreground">Trust</div>
                </div>
              </div>

              {/* Health metrics */}
              {health && (
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-muted-foreground">Completion:</span>
                    <span className="font-medium">{Math.round(health.completionRate * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3 w-3 text-amber-500" />
                    <span className="text-muted-foreground">Credit usage:</span>
                    <span className="font-medium">{Math.round(health.creditUsage * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Agent details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Model: <span className="text-foreground">{agent.model}</span></span>
                <span>Balance: <span className="text-foreground">{agent.currentBalance.toLocaleString()}</span></span>
                <span>Lifetime: <span className="text-foreground">{agent.lifetimeEarnings.toLocaleString()}</span></span>
              </div>

              {/* Current task (if expanded and has task) */}
              {currentTask && (
                <div className="flex items-start gap-2 text-xs">
                  <Activity className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-emerald-400/80">{currentTask}</span>
                </div>
              )}

              {/* Last activity */}
              {agent.lastActivityAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last active: {new Date(agent.lastActivityAt).toLocaleString()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Group Header                                                */
/* ------------------------------------------------------------------ */

function StatusGroupHeader({ status, count }: { status: PresenceStatus; count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 sticky top-0 z-10">
      <StatusDot status={status} size="sm" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {STATUS_LABELS[status]}
      </span>
      <span className="text-xs text-muted-foreground/60">({count})</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function MobileStatusPage() {
  const { agents, loading, refetch } = useAgents();
  const { presenceMap, activeCount } = usePresence();
  const healthMap = useAgentHealth();
  const { tasks } = useTasks();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } finally {
      // Brief minimum animation time
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [refetch]);

  // Toggle accordion
  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Group agents by presence status
  const groupedAgents = useMemo(() => {
    if (!agents.length) return [];

    type Group = { status: PresenceStatus; agents: AgentFieldsFragment[] };
    const groups: Map<PresenceStatus, AgentFieldsFragment[]> = new Map();

    for (const agent of agents) {
      const presence = presenceMap.get(agent.id)?.status ?? "idle";
      if (!groups.has(presence)) groups.set(presence, []);
      groups.get(presence)!.push(agent);
    }

    // Sort groups by STATUS_ORDER, then agents within each by balance descending
    const sorted: Group[] = Array.from(groups.entries())
      .sort(([a], [b]) => STATUS_ORDER[a] - STATUS_ORDER[b])
      .map(([status, agents]) => ({
        status,
        agents: agents.sort((a, b) => b.currentBalance - a.currentBalance),
      }));

    return sorted;
  }, [agents, presenceMap]);

  // Compute summary stats
  const inProgressTasks = useMemo(
    () => (tasks ?? []).filter((t: any) => t.status === "in_progress" || t.status === "assigned").length,
    [tasks]
  );

  const totalCredits = useMemo(
    () => agents.reduce((sum, a) => sum + a.currentBalance, 0),
    [agents]
  );

  const formatCredits = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  // Loading state
  if (loading && !agents.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Bot className="h-10 w-10 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading fleet status…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 -mx-3 sm:mx-auto -mt-3 sm:mt-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-3 sm:px-0 sm:pt-0">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Fleet Status
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-10 w-10"
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
          />
        </Button>
      </div>

      {/* Summary stat pills */}
      <div className="flex gap-2 px-3 sm:px-0">
        <StatPill
          label="Agents"
          value={agents.length}
          color="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
          icon={<Bot className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="Active"
          value={activeCount}
          color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          icon={<Zap className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="Tasks"
          value={inProgressTasks}
          color="bg-amber-500/10 text-amber-400 border-amber-500/20"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="Credits"
          value={formatCredits(totalCredits)}
          color="bg-violet-500/10 text-violet-400 border-violet-500/20"
          icon={<Coins className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Agent list grouped by status */}
      <div className="rounded-xl border border-border overflow-hidden bg-card/50 mx-3 sm:mx-0">
        {groupedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bot className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No agents found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Register agents to see their status here
            </p>
          </div>
        ) : (
          groupedAgents.map(({ status, agents: groupAgents }) => (
            <div key={status}>
              <StatusGroupHeader status={status} count={groupAgents.length} />
              {groupAgents.map((agent) => {
                const presence = presenceMap.get(agent.id);
                const health = healthMap.get(agent.id);
                return (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    presence={presence?.status ?? "idle"}
                    currentTask={presence?.currentTask}
                    health={health}
                    expanded={expandedId === agent.id}
                    onToggle={() => handleToggle(agent.id)}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-4" />
    </div>
  );
}
