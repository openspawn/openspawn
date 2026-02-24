import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, FlaskConical, PlayCircle, Clapperboard } from 'lucide-react';
import { useTourSafe } from '../components/tour';
import { IntroCard } from '../components/live/intro-card';
import { OrgChartLive, type AgentNodeState, type EdgeAnimation, type ZoomTarget } from '../components/live/org-chart-live';
import { LiveFeed, type FeedMessage } from '../components/live/live-feed';
import { StatsBar } from '../components/live/stats-bar';
import { NarrativeAnnotations } from '../components/live/narrative-annotations';
import { TIMELINE, ACTS, type Stats, type ReplayEvent, type SpawnedAgent } from '../components/live/replay-data';
import { LLM_TIMELINE, LLM_ACTS, LLM_MAX_TICK, LLM_TARGET, LLM_DELIVERED, LLM_METADATA } from '../components/live/replay-data-llm';

// ── Scenario definitions ─────────────────────────────────────────────────────

export type ScenarioId = 'demo' | 'llm-recording';

interface ScenarioDef {
  id: ScenarioId;
  label: string;
  timeline: ReplayEvent[];
  acts: readonly { num: number; name: string; narrative: string }[];
  maxTick: number;
  target: number;
  targetLabel: string;
  badge?: string;
}

const SCENARIOS: ScenarioDef[] = [
  { id: 'demo', label: 'Choreographed Demo', timeline: TIMELINE, acts: ACTS, maxTick: 150, target: 10000, targetLabel: 'patties' },
  { id: 'llm-recording', label: 'Groq LLM Recording', timeline: LLM_TIMELINE, acts: LLM_ACTS, maxTick: LLM_MAX_TICK, target: LLM_TARGET, targetLabel: 'tasks', badge: 'LLM' },
];

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
  zoomTarget: ZoomTarget | null;
}

// ── Zoom choreography schedule ───────────────────────────────────────────────
const CHART_CX = 600;
const CHART_LY = [0, 160, 330, 500];

const ZOOM_SCHEDULE: Array<[number, number, ZoomTarget]> = [
  [1, 5, { x: CHART_CX, y: CHART_LY[0] + 80, zoom: 1.6 }],
  [4, 8, { x: CHART_CX - 200, y: CHART_LY[0] + 80, zoom: 1.2 }],
  [17, 28, { x: CHART_CX - 400, y: CHART_LY[2] + 80, zoom: 1.3, duration: 1200 }],
  [28, 40, { x: CHART_CX, y: CHART_LY[1] + 80, zoom: 0.85, duration: 1000 }],
  [42, 55, { x: CHART_CX, y: CHART_LY[1] + 80, zoom: 1.3 }],
  [68, 78, { x: CHART_CX - 100, y: CHART_LY[0] + 120, zoom: 1.2 }],
  [91, 100, { x: CHART_CX - 50, y: CHART_LY[1] + 60, zoom: 1.1, duration: 1000 }],
  [105, 120, { x: CHART_CX, y: CHART_LY[1] + 80, zoom: 0.85, duration: 1200 }],
  [135, 150, { x: CHART_CX, y: CHART_LY[1] + 60, zoom: 0.8, duration: 1500 }],
];

const INITIAL_STATS: Stats = {
  kitchenRate: 0, queueSize: 0, deliveryRate: 0,
  revenue: 0, margin: 0, budgetUsed: 0,
  pattiesProduced: 0, pattiesDelivered: 0,
};

function useReplay(scenario: ScenarioDef) {
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

  const start = useCallback(() => {
    statsRef.current = { ...INITIAL_STATS };
    nodeStatesRef.current = {};
    messagesRef.current = [];
    edgeAnimsRef.current = [];
    reassignedRef.current = [];
    spawnedRef.current = [];
    actRef.current = 0;
    setActBanner(null);
    if (actBannerTimeoutRef.current) clearTimeout(actBannerTimeoutRef.current);
    setTick(0);
    setRunning(true);
    setFinished(false);
  }, []);

  // Process events for a given tick
  const processEvents = useCallback((currentTick: number) => {
    const events = scenario.timeline.filter(e => e.tick === currentTick);
    let changed = false;

    for (const event of events) {
      changed = true;
      const d = event.data;

      switch (event.type) {
        case 'act_change':
          if (d.act != null) {
            actRef.current = d.act;
            const actInfo = scenario.acts[d.act];
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
              { id: `ea-spawn-${currentTick}-${d.spawnAgent.id}`, from: d.spawnAgent.parentId, to: d.spawnAgent.id, color: '#22d3ee', timestamp: Date.now() },
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
              { id: `ea-${currentTick}-${d.from}-${d.to}`, from: d.from, to: d.to, color: '#22d3ee', timestamp: Date.now() },
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

  // Tick interval
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTick(prev => {
        const next = prev + 1;
        if (next > scenario.maxTick) {
          setRunning(false);
          setFinished(true);
          return prev;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [running]);

  // Process events when tick changes
  useEffect(() => {
    if (tick >= 0) processEvents(tick);
  }, [tick, processEvents]);

  // Zoom choreography
  const zoomTarget = useMemo(() => {
    for (const [start, end, zt] of ZOOM_SCHEDULE) {
      if (tick >= start && tick < end) return zt;
    }
    return null;
  }, [tick]);

  return {
    tick,
    running,
    finished,
    start,
    act: scenario.acts[actRef.current] || scenario.acts[0],
    stats: statsRef.current,
    nodeStates: nodeStatesRef.current,
    edgeAnimations: edgeAnimsRef.current,
    reassignedEdges: reassignedRef.current,
    spawnedAgents: spawnedRef.current,
    messages: messagesRef.current,
    pattiesDelivered: statsRef.current.pattiesDelivered,
    actBanner,
    zoomTarget,
  };
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressHeader({ act, pattiesDelivered, target, targetLabel, badge }: { act: { num: number; name: string; narrative: string }; pattiesDelivered: number; target: number; targetLabel: string; badge?: string }) {
  const pct = Math.min(100, (pattiesDelivered / target) * 100);

  return (
    <div className="shrink-0 space-y-2 px-4 py-3 bg-white/[0.02] border-b border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">{act.name}</h2>
            {badge && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full uppercase">{badge}</span>}
          </div>
          <p className="text-white/40 text-xs">{act.narrative}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{pattiesDelivered.toLocaleString()}</div>
          <div className="text-[10px] text-white/30">/ {target.toLocaleString()} {targetLabel}</div>
        </div>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Scenario Picker ──────────────────────────────────────────────────────────

function ScenarioPicker({ current, onChange }: { current: ScenarioId; onChange: (id: ScenarioId) => void }) {
  return (
    <div className="flex items-center gap-2">
      {SCENARIOS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            current === s.id
              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10'
          }`}
        >
          {s.badge ? <FlaskConical className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ── Tour Button ──────────────────────────────────────────────────────────────

function TourButton({ onStartReplay }: { onStartReplay: () => void }) {
  const tour = useTourSafe();
  if (!tour) return null;

  const handleClick = () => {
    onStartReplay();
    tour.start();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all cursor-pointer"
    >
      <Clapperboard className="w-3 h-3" />
      🎬 Guided Tour
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function LiveViewPage() {
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem('live-intro-seen');
  });
  const [scenarioId, setScenarioId] = useState<ScenarioId>(() => {
    return (localStorage.getItem('live-scenario') as ScenarioId) || 'demo';
  });
  const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
  const replay = useReplay(scenario);

  const handleScenarioChange = useCallback((id: ScenarioId) => {
    localStorage.setItem('live-scenario', id);
    setScenarioId(id);
  }, []);

  // Restart when scenario changes
  useEffect(() => {
    if (!showIntro) replay.start();
  }, [scenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="relative h-screen w-full bg-[#020817] text-white flex flex-col overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020817] via-[#0a1628] to-[#020817]" />

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && <IntroCard onStart={handleStart} />}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top: Scenario picker + Progress header */}
        <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-1 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <ScenarioPicker current={scenarioId} onChange={handleScenarioChange} />
            <TourButton onStartReplay={handleStart} />
          </div>
          <div className="text-[10px] text-white/20 font-mono">tick {replay.tick}/{scenario.maxTick}</div>
        </div>
        <ProgressHeader act={replay.act} pattiesDelivered={replay.pattiesDelivered} target={scenario.target} targetLabel={scenario.targetLabel} badge={scenario.badge} />

        {/* Middle: Org Chart + Feed */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Org Chart - 60% */}
          <div className="flex-[3] min-h-0 relative">
            <OrgChartLive
              nodeStates={replay.nodeStates}
              edgeAnimations={replay.edgeAnimations}
              reassignedEdges={replay.reassignedEdges}
              spawnedAgents={replay.spawnedAgents}
              zoomTarget={replay.zoomTarget}
            />
            {/* Narrative annotations */}
            <NarrativeAnnotations tick={replay.tick} />
            {/* Act banner overlay */}
            <AnimatePresence>
              {replay.actBanner && (
                <motion.div
                  key={replay.actBanner.num}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020817]/60 backdrop-blur-sm pointer-events-none"
                >
                  <div className="text-cyan-400/80 text-sm uppercase tracking-[0.3em] font-medium mb-1">
                    Act {replay.actBanner.num}
                  </div>
                  <div className="text-white text-2xl md:text-3xl font-black tracking-tight mb-2">
                    {replay.actBanner.name.replace(/^Act \w+: /, '')}
                  </div>
                  <div className="text-white/40 text-sm max-w-md text-center">
                    {replay.actBanner.narrative}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Live Feed - 40% */}
          <div className="flex-[2] min-h-0 border-l border-white/5">
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
              className="absolute inset-0 z-30 flex items-center justify-center bg-[#020817]/90 backdrop-blur-sm"
            >
              <div className="text-center max-w-lg px-8">
                <div className="text-6xl md:text-7xl font-black text-white mb-2">
                  {scenarioId === 'llm-recording' ? `🤖 ${LLM_DELIVERED}` : '🍔 10,000'}
                </div>
                <div className="text-lg text-cyan-400 font-semibold mb-6">
                  {scenarioId === 'llm-recording' ? `/ ${LLM_TARGET} TASKS COMPLETED` : '/ 10,000 DELIVERED'}
                </div>
                <p className="text-white/50 text-lg mb-8">
                  {scenarioId === 'llm-recording'
                    ? <>{LLM_METADATA.agents} agents. {LLM_METADATA.decisions} LLM decisions. <code className="text-purple-400 bg-purple-950/50 px-1.5 py-0.5 rounded text-sm">{LLM_METADATA.model.split('/').pop()}</code></>
                    : <>22 agents. 5 departments. One <code className="text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded text-sm">ORG.md</code>.</>}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/30 transition-all"
                  >
                    Explore the Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="/org-md"
                    target="_blank"
                    rel="noopener"
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 font-medium rounded-xl hover:bg-white/10 transition-all"
                  >
                    See the ORG.md →
                  </a>
                  <button
                    onClick={handleReplay}
                    className="px-6 py-3 text-white/30 font-medium hover:text-white/50 transition-all cursor-pointer"
                  >
                    Replay ↻
                  </button>
                </div>
                <p className="text-white/20 text-xs mt-8">
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
