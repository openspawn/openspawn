import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface BudgetBurndownProps {
  budget: number;
  spent: number;
  periodDays: number;
  daysElapsed: number;
}

// Generate demo spending data
function generateSpendingData(budget: number, spent: number, periodDays: number, daysElapsed: number) {
  const data: { day: number; actual: number; projected: number; ideal: number }[] = [];
  const dailyIdeal = budget / periodDays;
  
  let cumulative = 0;
  for (let day = 1; day <= periodDays; day++) {
    const idealSpend = dailyIdeal * day;
    
    if (day <= daysElapsed) {
      // Actual spending with some variance
      const variance = Math.sin(day * 0.5) * 0.3 + 1;
      cumulative += (spent / daysElapsed) * variance;
      cumulative = Math.min(cumulative, spent); // Cap at actual spent
      
      data.push({
        day,
        actual: Math.round(cumulative),
        projected: Math.round(cumulative),
        ideal: Math.round(idealSpend),
      });
    } else {
      // Projected future spending based on current rate
      const dailyRate = spent / daysElapsed;
      const projected = spent + dailyRate * (day - daysElapsed);
      
      data.push({
        day,
        actual: -1, // No actual data yet
        projected: Math.round(projected),
        ideal: Math.round(idealSpend),
      });
    }
  }
  
  return data;
}

export function BudgetBurndown({ budget, spent, periodDays, daysElapsed }: BudgetBurndownProps) {
  const data = useMemo(
    () => generateSpendingData(budget, spent, periodDays, daysElapsed),
    [budget, spent, periodDays, daysElapsed]
  );

  const dailyRate = spent / daysElapsed;
  const projectedTotal = dailyRate * periodDays;
  const projectedOver = projectedTotal > budget;
  const percentUsed = (spent / budget) * 100;
  const daysRemaining = periodDays - daysElapsed;
  const budgetRemaining = budget - spent;
  const dailyBudgetRemaining = budgetRemaining / daysRemaining;
  
  // Calculate runway
  const runwayDays = budgetRemaining / dailyRate;

  const maxValue = Math.max(budget, projectedTotal) * 1.1;
  const chartHeight = 200;
  const chartWidth = 400;

  const toX = (day: number) => (day / periodDays) * chartWidth;
  const toY = (value: number) => chartHeight - (value / maxValue) * chartHeight;

  // Create path for actual spending
  const actualPath = data
    .filter((d) => d.actual >= 0)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.day)} ${toY(d.actual)}`)
    .join(' ');

  // Create path for projected spending
  const projectedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.day)} ${toY(d.projected)}`)
    .join(' ');

  // Create path for ideal spending
  const idealPath = `M 0 ${chartHeight} L ${chartWidth} ${toY(budget)}`;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Budget Burn-down
          </CardTitle>
          <Badge variant={projectedOver ? 'destructive' : 'default'} className="text-xs">
            {projectedOver ? (
              <>
                <TrendingUp className="w-3 h-3 mr-1" />
                Over Budget
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 mr-1" />
                On Track
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="relative">
          <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <g key={pct}>
                <line
                  x1={0}
                  y1={toY(budget * pct)}
                  x2={chartWidth}
                  y2={toY(budget * pct)}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="4"
                />
                <text
                  x={-8}
                  y={toY(budget * pct)}
                  className="text-[10px] fill-slate-500"
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {Math.round(budget * pct)}
                </text>
              </g>
            ))}

            {/* Budget line */}
            <line
              x1={0}
              y1={toY(budget)}
              x2={chartWidth}
              y2={toY(budget)}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.5}
            />

            {/* Ideal burn path */}
            <motion.path
              d={idealPath}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="4"
              opacity={0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />

            {/* Projected path */}
            <motion.path
              d={projectedPath}
              fill="none"
              stroke={projectedOver ? '#ef4444' : '#6366f1'}
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            />

            {/* Actual spending path */}
            <motion.path
              d={actualPath}
              fill="none"
              stroke="#6366f1"
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />

            {/* Current day marker */}
            <motion.circle
              cx={toX(daysElapsed)}
              cy={toY(spent)}
              r={6}
              fill="#6366f1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
            />

            {/* Today line */}
            <line
              x1={toX(daysElapsed)}
              y1={0}
              x2={toX(daysElapsed)}
              y2={chartHeight}
              stroke="#6366f1"
              strokeWidth={1}
              strokeDasharray="4"
              opacity={0.5}
            />
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-cyan-500 rounded" />
              <span className="text-slate-400">Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-cyan-500/60 rounded" style={{ borderStyle: 'dashed' }} />
              <span className="text-slate-400">Projected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-emerald-500/60 rounded" style={{ borderStyle: 'dashed' }} />
              <span className="text-slate-400">Ideal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500/60 rounded" style={{ borderStyle: 'dashed' }} />
              <span className="text-slate-400">Budget</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400">Spent</p>
            <p className="text-lg font-semibold">{spent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Remaining</p>
            <p className="text-lg font-semibold text-emerald-400">{budgetRemaining.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Daily Rate</p>
            <p className="text-lg font-semibold">{Math.round(dailyRate)}/day</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Runway</p>
            <p className={cn(
              "text-lg font-semibold",
              runwayDays < daysRemaining ? "text-red-400" : "text-emerald-400"
            )}>
              {Math.round(runwayDays)} days
            </p>
          </div>
        </div>

        {/* Warning */}
        {projectedOver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              At current rate, you'll exceed budget by{' '}
              <strong>{Math.round(projectedTotal - budget).toLocaleString()}</strong> credits
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
