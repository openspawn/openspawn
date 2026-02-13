import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useAgents } from '../hooks/use-agents';

interface ModelUsage {
  model: string;
  provider: string;
  calls: number;
  tokens: number;
  cost: number;
  avgLatency: number;
  color: string;
}

const MODEL_COLORS = [
  '#d97706', '#f59e0b', '#10b981', '#34d399', '#8b5cf6',
  '#6366f1', '#ec4899', '#f43f5e', '#14b8a6', '#0ea5e9',
];

function inferProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('claude') || m.includes('anthropic')) return 'Anthropic';
  if (m.includes('gpt') || m.includes('openai')) return 'OpenAI';
  if (m.includes('gemini')) return 'Google';
  if (m.includes('llama') || m.includes('mistral')) return 'Open Source';
  return 'Other';
}

export function ModelUsageBreakdown() {
  const { agents } = useAgents();

  const modelUsage: ModelUsage[] = useMemo(() => {
    if (!agents.length) return [];
    const counts = new Map<string, number>();
    for (const agent of agents) {
      counts.set(agent.model, (counts.get(agent.model) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([model, count], i) => ({
      model,
      provider: inferProvider(model),
      calls: count,
      tokens: 0,
      cost: 0,
      avgLatency: 0,
      color: MODEL_COLORS[i % MODEL_COLORS.length],
    }));
  }, [agents]);

  const totalCalls = modelUsage.reduce((sum, m) => sum + m.calls, 0);
  const totalCost = modelUsage.reduce((sum, m) => sum + m.cost, 0);
  const totalTokens = modelUsage.reduce((sum, m) => sum + m.tokens, 0);

  const sortedByUsage = [...modelUsage].sort((a, b) => b.calls - a.calls);

  let startAngle = 0;
  const pieSegments = sortedByUsage.map((model) => {
    const angle = totalCalls > 0 ? (model.calls / totalCalls) * 360 : 0;
    const segment = { ...model, startAngle, endAngle: startAngle + angle };
    startAngle += angle;
    return segment;
  });

  if (!modelUsage.length) {
    return (
      <Card className="bg-muted/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            Model Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No agent data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            Model Usage
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {agents.length} agents
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total Cost</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <Zap className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <p className="text-2xl font-bold">{totalCalls}</p>
            <p className="text-xs text-muted-foreground">Agents</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
            <p className="text-2xl font-bold">{sortedByUsage.length}</p>
            <p className="text-xs text-muted-foreground">Models</p>
          </div>
        </div>

        {/* Pie chart + legend */}
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {pieSegments.map((segment, index) => {
                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = circumference;
                const strokeDashoffset = circumference * (1 - (segment.endAngle - segment.startAngle) / 360);
                const rotation = segment.startAngle;

                return (
                  <motion.circle
                    key={segment.model}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold">{sortedByUsage.length}</p>
                <p className="text-[10px] text-muted-foreground">Models</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {sortedByUsage.map((model, index) => (
              <motion.div
                key={model.model}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
                <span className="text-sm truncate flex-1">{model.model}</span>
                <span className="text-xs text-muted-foreground">
                  {totalCalls > 0 ? ((model.calls / totalCalls) * 100).toFixed(0) : 0}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="space-y-2">
          {sortedByUsage.map((model, index) => (
            <motion.div
              key={model.model}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: model.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{model.model}</span>
                  <Badge variant="outline" className="text-[10px]">{model.provider}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{model.calls} {model.calls === 1 ? 'agent' : 'agents'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-semibold text-muted-foreground"
                )}>
                  {((model.calls / totalCalls) * 100).toFixed(0)}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
