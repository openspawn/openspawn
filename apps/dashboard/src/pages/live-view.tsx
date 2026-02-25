import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { IntroCard } from '../components/live/intro-card';
import { OrgChartLive, type AgentNodeState, type EdgeAnimation } from '../components/live/org-chart-live';
import { LiveFeed, type FeedMessage } from '../components/live/live-feed';
import { StatsBar } from '../components/live/stats-bar';
import { TIMELINE, ACTS, type Stats, type ReplayEvent, type SpawnedAgent } from '../components/live/replay-data';

// ── Replay Hook ──────────────────────────────────────────────────────────────

interface ReplayState {
  tick: number;
  running: boolean;
  finished: boolean;
  act: typeof ACTS[0];
  stats: Stats;
  nodeStates: Record<string, AgentNodeState>;
  edgeAnimations: EdgeAnimation[];
  reassignedEdges: Array<{ from: string; to: string }>;
  messages: FeedMessage[];
  pattiesDelivered: number;
}

const INITIAL_STATS: Stats = {
  kitchenRate: 0, queueSize: 0, deliveryRate: 0,
  revenue: 0, margin: 0, budgetUsed: 0,
  pattiesProduced: 0, pattiesDelivered: 0,
};

// ── Variable tick timing ─────────────────────────────────────────────────────

/** Base tick duration by act/phase */
function getTickDuration(tick: number): number {
  // Spawn burst: slow enough that each agent pop registers
  if (tick >= 19 && tick <= 26) return 300;
  // Act I: setup — brisk
  if (tick <= 10) return 400;
  // Act II: cooking — steady
  if (tick <= 40) return 500;
  // Act III: bottleneck — frantic
  if (tick <= 90) return 300;
  // Act IV + V: resolution — breathing room
  return 600;
}

/** Extra pre-event pause (ms) added BEFORE tick fires — for dramatic moments */
const DRAMATIC_PAUSES: Record<number, number> = {
  1: 1000,   // Plankton's mega-order
  13: 800,   // First escalation (SpongeBob → Mr. Krabs)
  56: 900,   // Squidward overwhelmed
  92: 1000,  // Mr. Krabs's decision
  138: 1200, // Final completion 🎉
};

function useReplay() {
  const [tick, setTick] = useState(-1);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const statsRef = useRef<Stats>({ ...INITIAL_STATS });
  const nodeStatesRef = useRef<Record<string, AgentNodeState>>({});
  const messagesRef = useRef<FeedMessage[]>([]);
  const edgeAnimsRef = useRef<EdgeAnimation[]>([]);
  const reassignedRef = useRef<Array<{ from: string; to: string }>>([]);
  const actRef = useRef(0);
  const spawnedRef = useRef<SpawnedAgent[]>([]);
  const [actBanner, setActBanner] = useState<{ num: number; name: string; narrative: string } | null>(null);
  const actBannerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [, forceUpdate] = useState(0);

  // Refs for the variable-speed tick scheduler
  const tickRef = useRef(-1);
  const runningRef = useRef(false);
  const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNextTick = useCallback(() => {
    const nextTick = tickRef.current + 1;
    if (nextTick > 150) {
      runningRef.current = false;
      setRunning(false);
      setFinished(true);
      return;
    }
    const duration = getTickDuration(nextTick) + (DRAMATIC_PAUSES[nextTick] ?? 0);
    tickTimerRef.current = setTimeout(() => {
      tickRef.current = nextTick;
      setTick(nextTick);
      if (runningRef.current) scheduleNextTick();
    }, duration);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    };
  }, []);

  const start = useCallback(() => {
    // Clear any running timer
    if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    statsRef.current = { ...INITIAL_STATS };
    nodeStatesRef.current = {};
    messagesRef.current = [];
    edgeAnimsRef.current = [];
    reassignedRef.current = [];
    spawnedRef.current = [];
    actRef.current = 0;
    setActBanner(null);
    if (actBannerTimeoutRef.current) clearTimeout(actBannerTimeoutRef.current);
    // Fire tick 0 immediately (act_change only — not dramatic)
    tickRef.current = 0;
    runningRef.current = true;
    setTick(0);
    setRunning(true);
    setFinished(false);
    // Then schedule tick 1 onwards with variable timing
    scheduleNextTick();
  }, [scheduleNextTick]);

  // Process events for a given tick
  const processEvents = useCallback((currentTick: number) => {
    const events = TIMELINE.filter(e => e.tick === currentTick);
    let changed = false;

    for (const event of events) {
      changed = true;
      const d = event.data;

      switch (event.type) {
        case 'act_change':
          if (d.act != null) {
            actRef.current = d.act;
            const actInfo = ACTS[d.act];
            if (actInfo) {
              setActBanner({ num: actInfo.num, name: actInfo.name, narrative: actInfo.narrative });
              if (actBannerTimeoutRef.current) clearTimeout(actBannerTimeoutRef.current);
              actBannerTimeoutRef.current = setTimeout(() => setActBanner(null), 2500);
            }
          }
          break;

        case 'stat_update':
          if (d.stats) {
            statsRef.current = { ...statsRef.current, ...d.stats };
          }
          break;

        case 'node_status':
          if (d.agent) {
            nodeStatesRef.current = {
              ...nodeStatesRef.current,
              [d.agent]: {
                ...(nodeStatesRef.current[d.agent] || { status: 'idle' }),
                status: d.status || 'idle',
              },
            };
          }
          break;

        case 'spawn':
          if (d.spawnAgent) {
            spawnedRef.current = [...spawnedRef.current, d.spawnAgent];
            nodeStatesRef.current = {
              ...nodeStatesRef.current,
              [d.spawnAgent.id]: { status: 'working' },
            };
            edgeAnimsRef.current = [
              ...edgeAnimsRef.current,
              { id: `ea-spawn-${currentTick}-${d.spawnAgent.id}`, from: d.spawnAgent.parentId, to: d.spawnAgent.id, color: '#F4C542', timestamp: Date.now() },
            ];
          }
          if (d.text) {
            const fromId = d.from || 'spongebob-squarepants';
            messagesRef.current = [
              ...messagesRef.current,
              {
                id: `${currentTick}-${event.type}-${fromId}-${messagesRef.current.length}`,
                tick: currentTick,
                agentId: fromId,
                text: d.text,
                type: 'message',
              },
            ];
          }
          break;

        case 'message':
        case 'delegation':
        case 'escalation':
        case 'completion':
        case 'reassign': {
          const fromId = d.from || 'mr-krabs';
          messagesRef.current = [
            ...messagesRef.current,
            {
              id: `${currentTick}-${event.type}-${fromId}-${messagesRef.current.length}`,
              tick: currentTick,
              agentId: fromId,
              text: d.text || '',
              type: event.type,
            },
          ];

          // Edge animations for delegation/escalation/reassign
          if ((event.type === 'delegation' || event.type === 'reassign') && d.from && d.to) {
            edgeAnimsRef.current = [
              ...edgeAnimsRef.current,
              { id: `ea-${currentTick}-${d.from}-${d.to}`, from: d.from, to: d.to, color: '#F4C542', timestamp: Date.now() },
            ];
          }
          if (event.type === 'escalation' && d.from && d.to) {
            edgeAnimsRef.current = [
              ...edgeAnimsRef.current,
              { id: `ea-${currentTick}-${d.from}-${d.to}`, from: d.from, to: d.to, color: '#ef4444', timestamp: Date.now() },
            ];
          }
          if (event.type === 'reassign' && d.from && d.to) {
            reassignedRef.current = [
              ...reassignedRef.current,
              { from: 'squidward-tentacles', to: d.to }, // reassigned agents join Squidward's delivery
            ];
          }
          break;
        }
      }

      // Update Squidward's queue badge
      if (statsRef.current.queueSize > 0) {
        nodeStatesRef.current = {
          ...nodeStatesRef.current,
          'squidward-tentacles': {
            ...(nodeStatesRef.current['squidward-tentacles'] || { status: 'working' }),
            queueBadge: statsRef.current.queueSize,
          },
        };
      }
    }

    // Clean up old edge animations (>2s old)
    const now = Date.now();
    const before = edgeAnimsRef.current.length;
    edgeAnimsRef.current = edgeAnimsRef.current.filter(a => now - a.timestamp < 2000);
    if (edgeAnimsRef.current.length !== before) changed = true;

    if (changed) forceUpdate(n => n + 1);
  }, []);

  // Process events when tick changes
  useEffect(() => {
    if (tick >= 0) processEvents(tick);
  }, [tick, processEvents]);

  return {
    tick,
    running,
    finished,
    start,
    act: ACTS[actRef.current] || ACTS[0],
    stats: statsRef.current,
    nodeStates: nodeStatesRef.current,
    edgeAnimations: edgeAnimsRef.current,
    reassignedEdges: reassignedRef.current,
    spawnedAgents: spawnedRef.current,
    messages: messagesRef.current,
    pattiesDelivered: statsRef.current.pattiesDelivered,
    actBanner,
  };
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressHeader({ act, tick, pattiesDelivered }: { act: typeof ACTS[0]; tick: number; pattiesDelivered: number }) {
  const pct = Math.min(100, (pattiesDelivered / 10000) * 100);

  return (
    <div className="shrink-0 space-y-2 px-4 py-3 border-b" style={{ background: 'rgba(6,42,69,0.9)', borderColor: 'rgba(74,174,217,0.2)', backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#F4C542', fontFamily: '"Baloo 2", cursive' }}>{act.name}</h2>
          <p className="text-[#B8E4F7]/50 text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>{act.narrative}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: '#F4C542', fontFamily: '"Baloo 2", cursive' }}>{pattiesDelivered.toLocaleString()}</div>
          <div className="text-[10px] text-[#B8E4F7]/30" style={{ fontFamily: 'Nunito, sans-serif' }}>/ 10,000 patties 🍔</div>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(74,174,217,0.1)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, #F4C542 0%, #4AE88A 100%)', boxShadow: '0 0 12px rgba(244,197,66,0.4)' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function LiveViewPage() {
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem('live-intro-seen');
  });

  const replay = useReplay();

  const handleStart = useCallback(() => {
    localStorage.setItem('live-intro-seen', '1');
    setShowIntro(false);
    replay.start();
  }, [replay.start]);

  const handleReplay = useCallback(() => {
    replay.start();
  }, [replay.start]);

  // Auto-start if intro already seen
  useEffect(() => {
    if (!showIntro && !replay.running && !replay.finished && replay.tick < 0) {
      replay.start();
    }
  }, [showIntro, replay.running, replay.finished, replay.tick, replay.start]);

  return (
    <div className="relative h-screen w-full text-white flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #062A45 0%, #030E1A 100%)' }}>
      {/* BikiniBottom ocean background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 80%, rgba(11,94,138,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(26,125,181,0.2) 0%, transparent 50%)' }} />

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && <IntroCard onStart={handleStart} />}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top: Progress header */}
        <ProgressHeader act={replay.act} tick={replay.tick} pattiesDelivered={replay.pattiesDelivered} />

        {/* Middle: Org Chart + Feed */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Org Chart - 60% */}
          <div className="flex-[3] min-h-0 relative">
            <OrgChartLive
              nodeStates={replay.nodeStates}
              edgeAnimations={replay.edgeAnimations}
              reassignedEdges={replay.reassignedEdges}
              spawnedAgents={replay.spawnedAgents}
            />
            {/* Act banner overlay */}
            <AnimatePresence>
              {replay.actBanner && (
                <motion.div
                  key={replay.actBanner.num}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none"
                  style={{ background: 'rgba(3,14,26,0.7)' }}
                >
                  <div className="text-sm uppercase tracking-[0.3em] font-medium mb-1" style={{ color: 'rgba(244,197,66,0.8)', fontFamily: 'Nunito, sans-serif' }}>
                    Act {replay.actBanner.num}
                  </div>
                  <div className="text-2xl md:text-3xl font-black tracking-tight mb-2" style={{ color: '#F4C542', fontFamily: '"Baloo 2", cursive' }}>
                    {replay.actBanner.name.replace(/^Act \w+: /, '')}
                  </div>
                  <div className="text-sm max-w-md text-center" style={{ color: 'rgba(184,228,247,0.5)', fontFamily: 'Nunito, sans-serif' }}>
                    {replay.actBanner.narrative}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Live Feed - 40% */}
          <div className="flex-[2] min-h-0" style={{ borderLeft: '1px solid rgba(74,174,217,0.1)' }}>
            <LiveFeed messages={replay.messages} />
          </div>
        </div>

        {/* Bottom: Stats bar */}
        <StatsBar stats={replay.stats} />

        {/* Finished overlay */}
        <AnimatePresence>
          {replay.finished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm"
              style={{ background: 'rgba(3,14,26,0.92)' }}
            >
              <div className="text-center max-w-lg px-8">
                <div className="text-6xl md:text-7xl font-black mb-2" style={{ fontFamily: '"Baloo 2", cursive', color: '#F4C542' }}>
                  🍔 10,000
                </div>
                <div className="text-lg font-semibold mb-6" style={{ color: '#4AE88A', fontFamily: '"Baloo 2", cursive' }}>
                  🎉 PATTIES DELIVERED! 🎉
                </div>
                <p className="text-lg mb-8" style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}>
                  22 agents. 5 departments. One{' '}
                  <code
                    className="px-1.5 py-0.5 rounded text-sm"
                    style={{ color: '#F4C542', background: 'rgba(244,197,66,0.1)' }}
                  >
                    ORG.md
                  </code>
                  .
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
                    style={{
                      background: 'rgba(244,197,66,0.15)',
                      border: '1px solid rgba(244,197,66,0.4)',
                      color: '#F4C542',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    Explore the Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="/org-md"
                    target="_blank"
                    rel="noopener"
                    className="px-6 py-3 rounded-xl font-medium transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(184,228,247,0.6)',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    See the ORG.md →
                  </a>
                  <button
                    onClick={handleReplay}
                    className="px-6 py-3 font-medium transition-all cursor-pointer"
                    style={{ color: 'rgba(184,228,247,0.3)', fontFamily: 'Nunito, sans-serif' }}
                  >
                    Replay ↻
                  </button>
                </div>
                <p className="text-xs mt-8" style={{ color: 'rgba(184,228,247,0.2)', fontFamily: 'Nunito, sans-serif' }}>
                  Powered by OpenSpawn. Open source.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
