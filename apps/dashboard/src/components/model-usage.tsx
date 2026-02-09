import { motion } from 'framer-motion';
import { Cpu, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ModelUsage {
  model: string;
  provider: string;
  calls: number;
  tokens: number;
  cost: number;
  avgLatency: number;
  color: string;
}

const demoModelUsage: ModelUsage[] = [
  {
    model: 'claude-3-opus',
    provider: 'Anthropic',
    calls: 1247,
    tokens: 2450000,
    cost: 147.50,
    avgLatency: 2.3,
    color: '#d97706', // Amber for Claude
  },
  {
    model: 'claude-3-sonnet',
    provider: 'Anthropic',
    calls: 3892,
    tokens: 4200000,
    cost: 84.00,
    avgLatency: 1.1,
    color: '#f59e0b',
  },
  {
    model: 'gpt-4-turbo',
    provider: 'OpenAI',
    calls: 892,
    tokens: 1800000,
    cost: 72.00,
    avgLatency: 1.8,
    color: '#10b981', // Green for OpenAI
  },
  {
    model: 'gpt-3.5-turbo',
    provider: 'OpenAI',
    calls: 5421,
    tokens: 3200000,
    cost: 16.00,
    avgLatency: 0.5,
    color: '#34d399',
  },
  {
    model: 'llama-3-70b',
    provider: 'Local',
    calls: 2103,
    tokens: 1900000,
    cost: 0,
    avgLatency: 0.8,
    color: '#8b5cf6', // Purple for local
  },
];

export function ModelUsageBreakdown() {
  const totalCost = demoModelUsage.reduce((sum, m) => sum + m.cost, 0);
  const totalCalls = demoModelUsage.reduce((sum, m) => sum + m.calls, 0);
  const totalTokens = demoModelUsage.reduce((sum, m) => sum + m.tokens, 0);
  
  // Sort by cost for pie chart
  const sortedByUsage = [...demoModelUsage].sort((a, b) => b.calls - a.calls);
  
  // Calculate pie chart segments
  let startAngle = 0;
  const pieSegments = sortedByUsage.map((model) => {
    const angle = (model.calls / totalCalls) * 360;
    const segment = { ...model, startAngle, endAngle: startAngle + angle };
    startAngle += angle;
    return segment;
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Model Usage
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Last 30 days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-slate-700/30">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
            <p className="text-xs text-slate-400">Total Cost</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-700/30">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <p className="text-2xl font-bold">{(totalCalls / 1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-400">API Calls</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-700/30">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <p className="text-2xl font-bold">{(totalTokens / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-400">Tokens</p>
          </div>
        </div>

        {/* Pie chart + legend */}
        <div className="flex items-center gap-6">
          {/* Pie chart */}
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
                <p className="text-[10px] text-slate-400">Models</p>
              </div>
            </div>
          </div>

          {/* Legend */}
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
                <span className="text-xs text-slate-400">
                  {((model.calls / totalCalls) * 100).toFixed(0)}%
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
              className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/20 hover:bg-slate-700/40 transition-colors"
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
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{model.calls.toLocaleString()} calls</span>
                  <span>{(model.tokens / 1000000).toFixed(1)}M tokens</span>
                  <span>{model.avgLatency}s avg</span>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  model.cost === 0 ? "text-green-400" : "text-slate-200"
                )}>
                  {model.cost === 0 ? 'Free' : `$${model.cost.toFixed(2)}`}
                </p>
                <p className="text-[10px] text-slate-500">
                  {model.cost > 0 ? `$${(model.cost / model.calls * 1000).toFixed(2)}/1k` : 'Local'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
