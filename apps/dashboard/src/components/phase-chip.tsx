import { cn } from '../lib/utils';
import type { PhaseInfo } from './phase-progress';

interface PhaseChipProps {
  phase: PhaseInfo;
  className?: string;
}

/**
 * Compact phase indicator for showing current project phase
 * in page headers without being intrusive
 */
export function PhaseChip({ phase, className }: PhaseChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        "transition-colors hover:bg-cyan-500/15",
        className
      )}
      title={`${phase.name}: ${phase.description}`}
    >
      <span>{phase.icon}</span>
      <span>{phase.name}</span>
      <span className="text-cyan-400/60">•</span>
      <span className="text-cyan-400/80">{phase.week}</span>
    </div>
  );
}

export default PhaseChip;
