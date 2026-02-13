import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap, Star, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { useAgents } from '../hooks/use-agents';
import { useTasks } from '../hooks/use-tasks';
import { useSidePanel } from '../contexts';
import { AgentAvatar } from './agent-avatar';
import { AgentDetailPanel } from './agent-detail-panel';

interface ComputedEfficiency {
  id: string;
  name: string;
  level: number;
  avatar: string;
  avatarColor: string;
  tasksCompleted: number;
  totalAssigned: number;
  creditsSpent: number;
  efficiency: number | null; // tasks per 100 credits, null if no credits spent
}

const rankIcons = [
  { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { icon: Medal, color: 'text-muted-foreground', bg: 'bg-muted' },
  { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/20' },
];

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export function AgentEfficiencyLeaderboard() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { openSidePanel, closeSidePanel } = useSidePanel();

  const efficiencyData = useMemo<ComputedEfficiency[]>(() => {
    if (!agents.length) return [];

    // Count tasks per agent
    const tasksByAgent = new Map<string, { completed: number; total: number }>();
    for (const task of tasks) {
      if (!task.assigneeId) continue;
      const entry = tasksByAgent.get(task.assigneeId) ?? { completed: 0, total: 0 };
      entry.total++;
      if (task.status === 'DONE') entry.completed++;
      tasksByAgent.set(task.assigneeId, entry);
    }

    const results: ComputedEfficiency[] = agents.map((agent) => {
      const agentTasks = tasksByAgent.get(agent.id) ?? { completed: 0, total: 0 };
      // Use agent's tasksCompleted from GraphQL if available, otherwise from task count
      const tasksCompleted = agent.tasksCompleted || agentTasks.completed;
      const totalAssigned = Math.max(agentTasks.total, tasksCompleted);
      const creditsSpent = agent.budgetPeriodSpent ?? 0;
      const efficiency = creditsSpent > 0 ? tasksCompleted / (creditsSpent / 100) : null;

      return {
        id: agent.id,
        name: agent.name,
        level: agent.level,
        avatar: (agent as any).avatar ?? '',
        avatarColor: (agent as any).avatarColor ?? '',
        tasksCompleted,
        totalAssigned,
        creditsSpent,
        efficiency,
      };
    });

    // Sort: agents with efficiency first (desc), then agents with null efficiency
    results.sort((a, b) => {
      if (a.efficiency !== null && b.efficiency !== null) return b.efficiency - a.efficiency;
      if (a.efficiency !== null) return -1;
      if (b.efficiency !== null) return 1;
      return b.tasksCompleted - a.tasksCompleted;
    });

    return results.slice(0, 8);
  }, [agents, tasks]);

  const maxEfficiency = useMemo(() => {
    const vals = efficiencyData.filter((a) => a.efficiency !== null).map((a) => a.efficiency!);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [efficiencyData]);

  const handleRowClick = (agentId: string) => {
    openSidePanel(
      <AgentDetailPanel agentId={agentId} onClose={closeSidePanel} />,
      { width: 520 }
    );
  };

  const loading = agentsLoading || tasksLoading;

  if (loading) {
    return (
      <Card className="bg-muted/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Efficiency Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            Loading…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!efficiencyData.length) {
    return (
      <Card className="bg-muted/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Efficiency Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No agents yet. Spawn some agents to see efficiency rankings.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Efficiency Leaderboard
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Tasks per 100 credits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {efficiencyData.map((agent, index) => {
          const rankConfig = rankIcons[index] || { icon: Star, color: 'text-muted-foreground/70', bg: 'bg-muted/50' };
          const RankIcon = rankConfig.icon;
          const efficiencyPercent = agent.efficiency !== null ? (agent.efficiency / maxEfficiency) * 100 : 0;
          const progressPercent = agent.totalAssigned > 0
            ? (agent.tasksCompleted / agent.totalAssigned) * 100
            : 0;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleRowClick(agent.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                index === 0 && 'bg-amber-500/10 border border-yellow-500/30',
                index === 1 && 'bg-muted border border-border',
                index === 2 && 'bg-amber-600/10 border border-amber-600/30',
                index > 2 && 'bg-muted/30'
              )}
            >
              {/* Rank */}
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', rankConfig.bg)}>
                {index < 3 ? (
                  <span className="text-base">{RANK_EMOJI[index]}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <AgentAvatar
                agentId={agent.id}
                name={agent.name}
                level={agent.level}
                size="sm"
                avatar={agent.avatar}
                avatarColor={agent.avatarColor}
                showRing={false}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{agent.name}</span>
                  <Badge variant="outline" className="text-[10px]">L{agent.level}</Badge>
                  {agent.tasksCompleted > 0 && (
                    <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30">
                      ✅ {agent.tasksCompleted} done
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progressPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-20">
                    {agent.tasksCompleted}/{agent.totalAssigned} tasks
                  </span>
                </div>
              </div>

              {/* Efficiency Score */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">
                    {agent.efficiency !== null ? agent.efficiency.toFixed(2) : 'N/A'}
                  </span>
                  {agent.efficiency !== null && (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  {agent.creditsSpent.toLocaleString()} credits
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Compact efficiency score for agent cards
export function AgentEfficiencyBadge({ efficiency, trend }: { efficiency: number; trend: 'up' | 'down' | 'stable' }) {
  return (
    <div className="flex items-center gap-1">
      <Zap className="w-3 h-3 text-amber-400" />
      <span className="text-xs font-medium">{efficiency.toFixed(2)}</span>
      {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
      {trend === 'down' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
    </div>
  );
}
