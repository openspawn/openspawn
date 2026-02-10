import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

interface ActivityData {
  date: string;
  count: number;
}

interface AgentActivityHeatmapProps {
  agentId: string;
  agentName: string;
  weeks?: number;
}

// Generate demo activity data
function generateDemoActivity(agentId: string, weeks: number): ActivityData[] {
  const data: ActivityData[] = [];
  const now = new Date();
  const seed = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Use seed to generate consistent but varied data
    const dayOfWeek = date.getDay();
    const weekOfYear = Math.floor(i / 7);
    const random = Math.sin(seed + i * 0.1) * 0.5 + 0.5;
    
    // Lower activity on weekends
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1;
    // Recent weeks are more active
    const recencyFactor = 1 - (weekOfYear / weeks) * 0.5;
    
    const count = Math.floor(random * 15 * weekendFactor * recencyFactor);
    
    data.push({
      date: date.toISOString().split('T')[0],
      count,
    });
  }
  
  return data;
}

const intensityColors = [
  'bg-slate-800', // 0
  'bg-cyan-900/50', // 1-3
  'bg-cyan-700/60', // 4-6
  'bg-cyan-500/70', // 7-9
  'bg-cyan-400', // 10+
];

function getIntensityColor(count: number): string {
  if (count === 0) return intensityColors[0];
  if (count <= 3) return intensityColors[1];
  if (count <= 6) return intensityColors[2];
  if (count <= 9) return intensityColors[3];
  return intensityColors[4];
}

export function AgentActivityHeatmap({ agentId, agentName, weeks = 12 }: AgentActivityHeatmapProps) {
  const activityData = useMemo(() => generateDemoActivity(agentId, weeks), [agentId, weeks]);
  
  // Group by weeks
  const weekGroups: ActivityData[][] = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weekGroups.push(activityData.slice(i, i + 7));
  }

  const totalActivity = activityData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = activityData.filter((d) => d.count > 0).length;
  const avgPerDay = (totalActivity / activityData.length).toFixed(1);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">{agentName}'s Activity</h4>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{totalActivity} tasks</span>
          <span>{activeDays} active days</span>
          <span>{avgPerDay}/day avg</span>
        </div>
      </div>
      
      <TooltipProvider>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            {dayLabels.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'text-[10px] text-slate-500 h-3 flex items-center',
                  i % 2 === 0 ? 'opacity-100' : 'opacity-0'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-1">
            {weekGroups.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                        className={cn(
                          'w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-white/30',
                          getIntensityColor(day.count)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{day.count} tasks</p>
                      <p className="text-slate-400">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', color)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// Compact version for cards
export function AgentActivityMini({ agentId, days = 30 }: { agentId: string; days?: number }) {
  const activityData = useMemo(() => generateDemoActivity(agentId, Math.ceil(days / 7)), [agentId, days]).slice(-days);
  
  return (
    <TooltipProvider>
      <div className="flex gap-0.5">
        {activityData.slice(-14).map((day) => (
          <Tooltip key={day.date}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'w-2 h-2 rounded-sm',
                  getIntensityColor(day.count)
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {day.count} tasks on {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
