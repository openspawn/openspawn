import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap, Target, Star, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { getAgentAvatarUrl } from '../lib/avatar';

interface AgentEfficiency {
  id: string;
  name: string;
  level: number;
  tasksCompleted: number;
  creditsSpent: number;
  efficiency: number; // tasks per 100 credits
  trend: 'up' | 'down' | 'stable';
  rank: number;
  streak: number;
}

// Demo efficiency data
const demoEfficiencyData: AgentEfficiency[] = [
  {
    id: 'code-wizard',
    name: 'Code Wizard',
    level: 8,
    tasksCompleted: 47,
    creditsSpent: 3200,
    efficiency: 1.47,
    trend: 'up',
    rank: 1,
    streak: 12,
  },
  {
    id: 'research-bot',
    name: 'Research Bot',
    level: 6,
    tasksCompleted: 38,
    creditsSpent: 2800,
    efficiency: 1.36,
    trend: 'up',
    rank: 2,
    streak: 5,
  },
  {
    id: 'content-crafter',
    name: 'Content Crafter',
    level: 5,
    tasksCompleted: 29,
    creditsSpent: 2400,
    efficiency: 1.21,
    trend: 'stable',
    rank: 3,
    streak: 3,
  },
  {
    id: 'talent-agent',
    name: 'Talent Agent',
    level: 10,
    tasksCompleted: 22,
    creditsSpent: 4500,
    efficiency: 0.49,
    trend: 'down',
    rank: 4,
    streak: 0,
  },
  {
    id: 'junior-helper',
    name: 'Junior Helper',
    level: 2,
    tasksCompleted: 8,
    creditsSpent: 250,
    efficiency: 3.2,
    trend: 'up',
    rank: 5,
    streak: 2,
  },
];

const rankIcons = [
  { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-500/20' },
  { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/20' },
];

export function AgentEfficiencyLeaderboard() {
  const sortedByEfficiency = [...demoEfficiencyData].sort((a, b) => b.efficiency - a.efficiency);
  const maxEfficiency = Math.max(...sortedByEfficiency.map((a) => a.efficiency));

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Efficiency Leaderboard
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Tasks per 100 credits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedByEfficiency.map((agent, index) => {
          const rankConfig = rankIcons[index] || { icon: Star, color: 'text-slate-500', bg: 'bg-slate-700/50' };
          const RankIcon = rankConfig.icon;
          const efficiencyPercent = (agent.efficiency / maxEfficiency) * 100;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                index === 0 && 'bg-yellow-500/10 border border-yellow-500/30',
                index === 1 && 'bg-slate-500/10 border border-slate-500/30',
                index === 2 && 'bg-amber-600/10 border border-amber-600/30',
                index > 2 && 'bg-slate-700/30'
              )}
            >
              {/* Rank */}
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', rankConfig.bg)}>
                {index < 3 ? (
                  <RankIcon className={cn('w-4 h-4', rankConfig.color)} />
                ) : (
                  <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <img
                src={getAgentAvatarUrl(agent.id, agent.level)}
                alt={agent.name}
                className="w-10 h-10 rounded-full ring-2 ring-white/10"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{agent.name}</span>
                  <Badge variant="outline" className="text-[10px]">L{agent.level}</Badge>
                  {agent.streak > 0 && (
                    <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30">
                      🔥 {agent.streak} day streak
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={efficiencyPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-slate-400 w-20">
                    {agent.tasksCompleted} tasks
                  </span>
                </div>
              </div>

              {/* Efficiency Score */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">{agent.efficiency.toFixed(2)}</span>
                  {agent.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                  {agent.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />}
                </div>
                <p className="text-[10px] text-slate-500">
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
      <Zap className="w-3 h-3 text-yellow-400" />
      <span className="text-xs font-medium">{efficiency.toFixed(2)}</span>
      {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
      {trend === 'down' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
    </div>
  );
}
