/**
 * ReputationTab — agent trust score leaderboard and distribution chart.
 * Extracted from agents.tsx to reduce file size.
 */
import { useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { AgentAvatar } from "../components/agent-avatar";
import { TrustLeaderboard } from "../components/trust-leaderboard";
import { usePresence, useAgentHealth } from "../hooks";
import { AgentStatus } from "@openspawn/shared-types";
import type { AgentFieldsFragment } from "@openspawn/shared-types";

type Agent = AgentFieldsFragment;

// ─── Shared reputation constants ──────────────────────────────────────────────

export const REPUTATION_COLORS: Record<string, string> = {
  NEW: "bg-gray-500",
  PROBATION: "bg-orange-500",
  TRUSTED: "bg-cyan-500",
  VETERAN: "bg-violet-500",
  ELITE: "bg-amber-500",
};

export const REPUTATION_EMOJI: Record<string, string> = {
  NEW: "🆕",
  PROBATION: "⚠️",
  TRUSTED: "✅",
  VETERAN: "🏆",
  ELITE: "👑",
};

// ─── ReputationTab ────────────────────────────────────────────────────────────

interface ReputationTabProps {
  agents: Agent[];
  onAgentClick?: (id: string) => void;
}

export function ReputationTab({ agents, onAgentClick }: ReputationTabProps) {
  const { presenceMap } = usePresence();
  const healthMap = useAgentHealth();

  // Sort agents by trust score for leaderboard
  const leaderboardData = useMemo(() => {
    return [...agents]
      .filter((a) => a.status === AgentStatus.Active)
      .sort((a, b) => (b.trustScore ?? 50) - (a.trustScore ?? 50))
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        agentId: a.agentId,
        name: a.name,
        level: a.level,
        trustScore: a.trustScore ?? 50,
        reputationLevel: a.reputationLevel || "TRUSTED",
        tasksCompleted: a.tasksCompleted ?? 0,
      }));
  }, [agents]);

  // Reputation distribution by level
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {
      NEW: 0,
      PROBATION: 0,
      TRUSTED: 0,
      VETERAN: 0,
      ELITE: 0,
    };
    agents.forEach((a) => {
      const level = a.reputationLevel || "TRUSTED";
      if (counts[level] !== undefined) counts[level]++;
    });
    return counts;
  }, [agents]);

  const avgTrustScore = useMemo(() => {
    if (agents.length === 0) return 0;
    return Math.round(agents.reduce((acc, a) => acc + (a.trustScore ?? 50), 0) / agents.length);
  }, [agents]);

  const totalTasks = useMemo(
    () => agents.reduce((acc, a) => acc + (a.tasksCompleted ?? 0), 0),
    [agents],
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTrustScore}/100</div>
            <Progress value={avgTrustScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Elite Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">👑 {distribution.ELITE}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Veteran Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-500">🏆 {distribution.VETERAN}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution + Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reputation Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(distribution).map(([level, count]) => (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{REPUTATION_EMOJI[level]}</span>
                    <span>{level}</span>
                  </span>
                  <span className="font-medium">{count} agents</span>
                </div>
                <Progress
                  value={agents.length > 0 ? (count / agents.length) * 100 : 0}
                  className={`h-2 ${REPUTATION_COLORS[level]}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <TrustLeaderboard entries={leaderboardData} onAgentClick={onAgentClick} />
      </div>

      {/* All Agents Trust Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents Trust Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...agents]
              .sort((a, b) => (b.trustScore ?? 50) - (a.trustScore ?? 50))
              .map((agent) => {
                const trustScore = agent.trustScore ?? 50;
                const repLevel = agent.reputationLevel || "TRUSTED";
                const successRate =
                  agent.tasksCompleted && agent.tasksCompleted > 0
                    ? Math.round(((agent.tasksSuccessful ?? 0) / agent.tasksCompleted) * 100)
                    : 0;

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-testid="agent-card"
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onAgentClick?.(agent.id)}
                  >
                    <div className="flex items-center gap-3">
                      <AgentAvatar
                        agentId={agent.agentId}
                        name={agent.name}
                        level={agent.level}
                        size="md"
                        avatar={agent.avatar}
                        avatarUrl={agent.avatarUrl}
                        avatarColor={agent.avatarColor}
                        presenceStatus={presenceMap.get(agent.id)?.status}
                        completionRate={healthMap.get(agent.id)?.completionRate}
                        creditUsage={healthMap.get(agent.id)?.creditUsage}
                      />
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          L{agent.level} · {agent.tasksCompleted ?? 0} tasks · {successRate}%
                          success
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{trustScore}</div>
                        <div className="text-xs text-muted-foreground">trust</div>
                      </div>
                      <Badge className={REPUTATION_COLORS[repLevel]}>
                        {REPUTATION_EMOJI[repLevel]} {repLevel}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
