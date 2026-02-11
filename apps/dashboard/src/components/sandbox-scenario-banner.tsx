/**
 * Scenario Context Banner — persistent top bar showing scenario progress.
 * Only visible in sandbox mode when a scenario is active.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSandboxMode } from '../graphql/fetcher';
import { SANDBOX_URL } from '../lib/sandbox-url';

export interface ScenarioStatus {
  active: boolean;
  scenarioId?: string;
  scenarioName?: string;
  currentPhase?: string;
  currentPhaseIndex?: number;
  tick?: number;
  decisionCount?: number;
  epics?: { id: string; title: string; status: string; completionPct: number }[];
  eventsFired?: number;
  scores?: Record<string, number>;
  resources?: { id: string; name: string; current: number; initial: number; pct: number }[];
}

const TOTAL_TICKS = 400;

export function useScenarioStatus() {
  const [status, setStatus] = useState<ScenarioStatus | null>(null);
  const prevPhaseRef = useRef<number>(-1);
  const prevEventsRef = useRef<number>(0);
  const [phaseTransition, setPhaseTransition] = useState<{
    phaseName: string;
    phaseIndex: number;
    narrative: string;
    epics: string[];
  } | null>(null);
  const [newEventCount, setNewEventCount] = useState(0);

  useEffect(() => {
    if (!isSandboxMode) return;
    let disposed = false;

    const poll = async () => {
      try {
        const res = await fetch(`${SANDBOX_URL}/api/scenario/status`);
        if (!res.ok) return;
        const data: ScenarioStatus = await res.json();
        if (disposed) return;
        setStatus(data);

        if (data.active && data.currentPhaseIndex !== undefined) {
          // Detect phase change
          if (prevPhaseRef.current >= 0 && data.currentPhaseIndex > prevPhaseRef.current) {
            setPhaseTransition({
              phaseName: data.currentPhase ?? '',
              phaseIndex: data.currentPhaseIndex,
              narrative: '', // filled by phase data
              epics: (data.epics ?? [])
                .filter(e => e.status !== 'locked')
                .map(e => e.title)
                .slice(0, 5),
            });
          }
          prevPhaseRef.current = data.currentPhaseIndex;

          // Detect new events
          const fired = data.eventsFired ?? 0;
          if (prevEventsRef.current > 0 && fired > prevEventsRef.current) {
            setNewEventCount(fired - prevEventsRef.current);
          }
          prevEventsRef.current = fired;
        }
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => { disposed = true; clearInterval(interval); };
  }, []);

  return { status, phaseTransition, setPhaseTransition, newEventCount, setNewEventCount };
}

export function ScenarioContextBanner({ status }: { status: ScenarioStatus | null }) {
  if (!isSandboxMode || !status?.active) return null;

  const tick = status.tick ?? 0;
  const progressPct = Math.min((tick / TOTAL_TICKS) * 100, 100);
  const decisions = status.decisionCount ?? 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-3 text-xs sm:text-sm">
        {/* Scenario name */}
        <span className="font-semibold text-cyan-400 shrink-0 hidden sm:inline">
          {status.scenarioName}
        </span>
        <span className="font-semibold text-cyan-400 shrink-0 sm:hidden">
          🏢 Sprint
        </span>

        {/* Divider */}
        <span className="text-slate-600 hidden sm:inline">|</span>

        {/* Phase */}
        <span className="text-slate-300 shrink-0">
          <span className="text-slate-500">Phase {(status.currentPhaseIndex ?? 0) + 1}:</span>{' '}
          {status.currentPhase}
        </span>

        {/* Spacer */}
        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats */}
        <span className="text-slate-400 shrink-0 tabular-nums hidden md:inline">
          {decisions.toLocaleString()} decisions
        </span>
        <span className="text-slate-500 shrink-0 tabular-nums">
          Tick {tick}/{TOTAL_TICKS}
        </span>
      </div>
    </div>
  );
}
