/**
 * Scenario Context Banner — persistent top bar showing scenario progress + speed controls.
 * Only visible in sandbox mode when a scenario is active.
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Pause, Play } from 'lucide-react';
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

async function fetchScenarioStatus(): Promise<ScenarioStatus | null> {
  const res = await fetch(`${SANDBOX_URL}/api/scenario/status`);
  if (!res.ok) return null;
  return res.json();
}

export function useScenarioStatus() {
  const prevPhaseRef = useRef<number>(-1);
  const prevEventsRef = useRef<number>(0);
  const [phaseTransition, setPhaseTransition] = useState<{
    phaseName: string;
    phaseIndex: number;
    narrative: string;
    epics: string[];
  } | null>(null);
  const [newEventCount, setNewEventCount] = useState(0);

  const { data: status = null } = useQuery({
    queryKey: ['scenario-status'],
    queryFn: fetchScenarioStatus,
    enabled: isSandboxMode,
    // Refetch driven by SSE tick_complete (see use-sandbox-tick.ts)
  });

  // Detect phase transitions and new events from query data
  useEffect(() => {
    if (!status?.active || status.currentPhaseIndex === undefined) return;

    if (prevPhaseRef.current >= 0 && status.currentPhaseIndex > prevPhaseRef.current) {
      setPhaseTransition({
        phaseName: status.currentPhase ?? '',
        phaseIndex: status.currentPhaseIndex,
        narrative: '',
        epics: (status.epics ?? [])
          .filter(e => e.status !== 'locked')
          .map(e => e.title)
          .slice(0, 5),
      });
    }
    prevPhaseRef.current = status.currentPhaseIndex;

    const fired = status.eventsFired ?? 0;
    if (prevEventsRef.current > 0 && fired > prevEventsRef.current) {
      setNewEventCount(fired - prevEventsRef.current);
    }
    prevEventsRef.current = fired;
  }, [status]);

  return { status, phaseTransition, setPhaseTransition, newEventCount, setNewEventCount };
}

export function ScenarioContextBanner({ status }: { status: ScenarioStatus | null }) {
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const prePauseSpeed = useRef(1);

  // Fetch current speed on mount
  useEffect(() => {
    if (!isSandboxMode) return;
    fetch(`${SANDBOX_URL}/api/speed`)
      .then(r => r.json())
      .then(data => {
        const ms = data.tickIntervalMs ?? 800;
        const speed = Math.round(800 / ms) || 1;
        setCurrentSpeed(speed);
      })
      .catch(() => { /* ignore */ });
  }, []);

  if (!isSandboxMode || !status?.active) return null;

  const tick = status.tick ?? 0;
  const progressPct = Math.min((tick / TOTAL_TICKS) * 100, 100);
  const decisions = status.decisionCount ?? 0;

  const setSpeed = async (speed: number) => {
    try {
      await fetch(`${SANDBOX_URL}/api/speed`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed }),
      });
      setCurrentSpeed(speed);
      setPaused(false);
    } catch { /* ignore */ }
  };

  const togglePause = async () => {
    if (paused) {
      await setSpeed(prePauseSpeed.current);
    } else {
      prePauseSpeed.current = currentSpeed;
      try {
        await fetch(`${SANDBOX_URL}/api/speed`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickIntervalMs: 999999 }),
        });
        setPaused(true);
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        {/* Scenario name */}
        <span className="font-semibold text-cyan-400 shrink-0 hidden sm:inline">
          {status.scenarioName}
        </span>
        <span className="font-semibold text-cyan-400 shrink-0 sm:hidden">
          🏢
        </span>

        <span className="text-slate-600 hidden sm:inline">|</span>

        {/* Phase */}
        <span className="text-slate-300 shrink-0">
          <span className="text-slate-500 hidden sm:inline">Phase {(status.currentPhaseIndex ?? 0) + 1}:</span>{' '}
          {status.currentPhase}
        </span>

        {/* Progress bar */}
        <div className="flex-1 min-w-0">
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
        <span className="text-slate-500 shrink-0 tabular-nums hidden sm:inline">
          {tick}/{TOTAL_TICKS}
        </span>

        {/* Speed controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={togglePause}
            className={`p-1 rounded transition-colors ${paused ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          {[1, 2, 5].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                currentSpeed === s && !paused
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
