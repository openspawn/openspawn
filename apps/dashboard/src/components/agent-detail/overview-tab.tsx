import type { AgentFieldsFragment } from "@openspawn/dashboard-data";
import { Activity, Award, Coins, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useAgents } from "../../hooks/use-agents";
import { Progress } from "../ui/progress";
import { Sparkline, generateSparklineData } from "../ui/sparkline";

type Agent = AgentFieldsFragment;

export function OverviewTab({ agent }: { agent: Agent }) {
  const { agents } = useAgents();
  const parentAgent = useMemo(
    () => agents.find((a) => a.id === agent.parentId),
    [agents, agent.parentId],
  );

  const trustScore = agent.trustScore ?? 50;
  const successRate =
    agent.tasksCompleted && agent.tasksCompleted > 0
      ? Math.round(((agent.tasksSuccessful ?? 0) / agent.tasksCompleted) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Status</span>
          </div>
          <p className="text-2xl font-bold">{agent.status}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coins className="h-4 w-4" />
            <span className="text-sm">Balance</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{agent.currentBalance.toLocaleString()}</p>
            <Sparkline
              data={generateSparklineData(7, "stable")}
              color="#f59e0b"
              width={48}
              height={18}
              showDot
            />
          </div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Award className="h-4 w-4" />
            <span className="text-sm">Trust Score</span>
          </div>
          <p className="text-2xl font-bold">{trustScore}/100</p>
          <Progress value={trustScore} className="mt-2 h-2" />
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Success Rate</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{successRate}%</p>
            <Sparkline
              data={generateSparklineData(7, successRate > 70 ? "up" : "down")}
              color={successRate > 70 ? "#10b981" : "#f43f5e"}
              width={48}
              height={18}
              showDot
              showTrend
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {agent.tasksSuccessful ?? 0}/{agent.tasksCompleted ?? 0} tasks
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Domain</span>
          <span className="text-sm font-medium">{agent.domain || "—"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Parent Agent</span>
          <span className="text-sm font-medium">{parentAgent?.name || "—"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Model</span>
          <span className="text-sm font-medium">{agent.model}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Mode</span>
          <span className="text-sm font-medium capitalize">{agent.mode || "worker"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Created</span>
          <span className="text-sm font-medium">
            {new Date(agent.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Last Activity</span>
          <span className="text-sm font-medium">
            {agent.lastActivityAt ? new Date(agent.lastActivityAt).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Lifetime Earnings</span>
          <span className="text-sm font-medium">{agent.lifetimeEarnings.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
