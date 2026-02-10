import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface PhaseInfo {
  id: string;
  name: string;
  description: string;
  week: string;
  color: string;
  icon: string;
}

interface PhaseProgressProps {
  phases: PhaseInfo[];
  currentPhase: string;
  onPhaseClick?: (phaseId: string) => void;
  className?: string;
}

export function PhaseProgress({ phases, currentPhase, onPhaseClick, className }: PhaseProgressProps) {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Horizontal timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress line - z-0 to stay behind nodes */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-border rounded-full z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / phases.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Phase nodes */}
          <div className="relative flex justify-between">
            {phases.map((phase, index) => {
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;

              return (
                <button
                  key={phase.id}
                  onClick={() => onPhaseClick?.(phase.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all",
                    onPhaseClick && "cursor-pointer hover:scale-105",
                    !onPhaseClick && "cursor-default"
                  )}
                >
                  {/* Node - solid bg to cover progress line */}
                  <motion.div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all relative z-10",
                      isComplete && "bg-background border-emerald-500 text-emerald-400",
                      isCurrent && "bg-background border-cyan-500 text-cyan-400 ring-4 ring-cyan-500/20",
                      isFuture && "bg-background border-muted-foreground/40 text-muted-foreground/60"
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {isComplete ? '✓' : phase.icon}
                  </motion.div>

                  {/* Label */}
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent && "text-cyan-400",
                      isComplete && "text-emerald-400",
                      isFuture && "text-muted-foreground/60"
                    )}>
                      {phase.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">{phase.week}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current phase details */}
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-card rounded-lg border border-border"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{phases[currentIndex]?.icon}</span>
            <div>
              <h3 className="font-semibold text-lg">{phases[currentIndex]?.name}</h3>
              <p className="text-muted-foreground text-sm">{phases[currentIndex]?.description}</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
              {phases[currentIndex]?.week}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Mobile: Vertical timeline */}
      <div className="md:hidden">
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <motion.button
                key={phase.id}
                onClick={() => onPhaseClick?.(phase.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  isCurrent && "bg-cyan-500/10 border-cyan-500/50",
                  isComplete && "bg-emerald-500/5 border-emerald-500/30",
                  isFuture && "bg-muted/30 border-border",
                  onPhaseClick && "active:scale-[0.98]"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0",
                  isComplete && "bg-emerald-500/20 text-emerald-400",
                  isCurrent && "bg-cyan-500/20 text-cyan-400",
                  isFuture && "bg-muted text-muted-foreground/60"
                )}>
                  {isComplete ? '✓' : phase.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium text-sm",
                      isCurrent && "text-cyan-400",
                      isComplete && "text-emerald-400",
                      isFuture && "text-muted-foreground/60"
                    )}>
                      {phase.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70">{phase.week}</span>
                  </div>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
                  )}
                </div>

                {/* Progress indicator */}
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PhaseProgress;
