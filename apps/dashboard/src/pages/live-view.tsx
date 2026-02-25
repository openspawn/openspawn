import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { IntroCard } from '../components/live/intro-card';
import { OrgChartLive, type AgentNodeState, type EdgeAnimation } from '../components/live/org-chart-live';
import { MobileOrgChart } from '../components/live/MobileOrgChart';
import { LiveFeed, type FeedMessage } from '../components/live/live-feed';
import { StatsBar } from '../components/live/stats-bar';
import { OpenSpawnBadge } from '../components/live/OpenSpawnBadge';
import { TIMELINE, ACTS, type Stats, type ReplayEvent, type SpawnedAgent } from '../components/live/replay-data';

// ── Variable tick timing ──────────────────────────────────────────────────────
//
// Dramatic pauses fire BEFORE the specified tick (pre-event delay).
// Act timings:
//   Act I   (0–10):   400ms — brisk
//   Act II  (11–40):  500ms — steady; spawn burst (19–26) = 300ms
//   Act III (41–90):  rising 450 → crisis 350 → dead-stop 600
//   Act IV  (91–120): 600ms — breathing room
//   Act V   (121–150):500ms

const PRE_PAUSE_TICKS: Record<number, number> = {
  1:   1000,   // Before Plankton's mega-order
  13:  900,    // Before SpongeBob's first escalation
  56:  800,    // Before Squidward overwhelmed
  70:  800,    // Before escalation to Mr. Krabs 🚨
  92:  900,    // Before Mr. Krabs's decision
  138: 1500,   // Before final completion
};

function getTickDelay(nextTick: number): number {
  // Dramatic pre-event pauses override everything
  if (PRE_PAUSE_TICKS[nextTick] !== undefined) return PRE_PAUSE_TICKS[nextTick];

  // Act I: brisk setup (0–10)
  if (nextTick <= 10) return 400;

  // Spawn burst: rapid-fire (19–26)
  if (nextTick >= 19 && nextTick <= 26) return 300;

  // Act II: steady cooking (11–40)
  if (nextTick <= 40) return 500;

  // Act III rising tension (41–55)
  if (nextTick <= 55) return 450;

  // Act III crisis peak (56–75): frantic
  if (nextTick <= 75) return 350;

  // Act III dead stop (76–90): uncomfortable silence
  if (nextTick <= 90) return 600;

  // Act IV resolution (91–120): breathing room
  if (nextTick <= 120) return 600;

  // Act V victory (121–150)
  return 500;
}

// ── Replay Hook ──────────────────────────────────────────────────────────────

const INITIAL_STATS: Stats = {
  kitchenRate: 0, queueSize: 0, deliveryRate: 0,
  revenue: 0, margin: 0, budgetUsed: 0,
  pattiesProduced: 0, pattiesDelivered: 0,
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
    const events = TIMELINE.filter((e: ReplayEvent) => e.tick === currentTick);
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
              { from: 'squidward-tentacles', to: d.to },
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

  // Variable-speed tick engine using setTimeout (instead of flat setInterval)
  useEffect(() => {
    if (!running) return;
    if (tick < 0) return;

    const nextTick = tick + 1;
    if (nextTick > 150) {
      setRunning(false);
      setFinished(true);
      return;
    }

    const delay = getTickDelay(nextTick);
    const timer = setTimeout(() => {
      setTick(nextTick);
    }, delay);

    return () => clearTimeout(timer);
  }, [tick, running]);

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
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #F4C542 0%, #4AE88A 100%)',
            boxShadow: '0 0 12px rgba(244,197,66,0.4)',
            width: `${pct}%`,
            transition: 'width 0.5s ease-out',
          }}
        />
      </div>
    </div>
  );
}

// ── Act Banner CSS animations ─────────────────────────────────────────────────
const ACT_BANNER_STYLES = `
  @keyframes act-overlay-in {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to   { opacity: 1; backdrop-filter: blur(8px); }
  }
  @keyframes act-label-rise {
    from { opacity: 0; transform: translateY(8px); letter-spacing: 0.6em; }
    to   { opacity: 1; transform: translateY(0); letter-spacing: 0.3em; }
  }
  @keyframes act-title-stamp {
    0%   { opacity: 0; transform: scale(1.18) translateY(-6px); letter-spacing: 0.05em; filter: blur(6px); }
    60%  { opacity: 1; transform: scale(0.98) translateY(1px); letter-spacing: -0.03em; filter: blur(0); }
    80%  { transform: scale(1.01); }
    100% { opacity: 1; transform: scale(1); letter-spacing: -0.01em; }
  }
  @keyframes act-narrative-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes act-line-expand {
    from { width: 0; opacity: 0; }
    to   { width: 80px; opacity: 1; }
  }
  @keyframes act-overlay-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .act-overlay, .act-label, .act-title, .act-narrative, .act-line {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
`;

// ── Act Banner (CSS-only, no motion/react) ───────────────────────────────────

function ActBanner({ banner }: { banner: { num: number; name: string; narrative: string } | null }) {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<typeof banner>(null);
  // Key increments each time a new banner appears → forces re-mount → re-triggers animations
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (banner) {
      setContent(banner);
      setVisible(true);
      setAnimKey(k => k + 1);
    } else {
      setVisible(false);
    }
  }, [banner]);

  if (!content) return null;

  return (
    <>
      <style>{ACT_BANNER_STYLES}</style>
      <div
        key={`overlay-${animKey}`}
        className="act-overlay absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        style={{
          background: 'rgba(3,14,26,0.75)',
          opacity: visible ? undefined : 0,
          transition: visible ? undefined : 'opacity 0.4s ease',
          animation: visible ? 'act-overlay-in 0.4s ease forwards' : undefined,
        }}
      >
        {/* Decorative top line */}
        <div
          key={`line-top-${animKey}`}
          className="act-line h-px mb-6"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(244,197,66,0.6), transparent)',
            animation: 'act-line-expand 0.5s 0.1s ease forwards',
            width: 0,
            opacity: 0,
          }}
        />

        {/* Act number label */}
        <div
          key={`label-${animKey}`}
          className="act-label text-xs font-bold uppercase mb-2"
          style={{
            color: 'rgba(244,197,66,0.7)',
            fontFamily: 'Nunito, sans-serif',
            animation: 'act-label-rise 0.4s 0.05s cubic-bezier(0.16,1,0.3,1) forwards',
            opacity: 0,
            letterSpacing: '0.3em',
          }}
        >
          ── Act {content.num} ──
        </div>

        {/* Title — cinematic stamp */}
        <div
          key={`title-${animKey}`}
          className="act-title text-2xl md:text-4xl font-black tracking-tight mb-3"
          style={{
            color: '#F4C542',
            fontFamily: '"Baloo 2", cursive',
            textShadow: '0 0 40px rgba(244,197,66,0.5), 0 0 80px rgba(244,197,66,0.2)',
            animation: 'act-title-stamp 0.55s 0.12s cubic-bezier(0.34,1.56,0.64,1) forwards',
            opacity: 0,
          }}
        >
          {content.name.replace(/^Act \w+: /, '')}
        </div>

        {/* Narrative */}
        <div
          key={`narrative-${animKey}`}
          className="act-narrative text-sm max-w-sm text-center px-6"
          style={{
            color: 'rgba(184,228,247,0.55)',
            fontFamily: 'Nunito, sans-serif',
            animation: 'act-narrative-in 0.5s 0.3s ease forwards',
            opacity: 0,
          }}
        >
          {content.narrative}
        </div>

        {/* Decorative bottom line */}
        <div
          key={`line-bot-${animKey}`}
          className="act-line h-px mt-6"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(244,197,66,0.4), transparent)',
            animation: 'act-line-expand 0.5s 0.2s ease forwards',
            width: 0,
            opacity: 0,
          }}
        />
      </div>
    </>
  );
}

// ── Completion Overlay (CSS-only) ────────────────────────────────────────────

const COMPLETION_STYLES = `
  @keyframes completion-stamp {
    0%   { transform: scale(1.5); opacity: 0; filter: blur(8px); }
    55%  { transform: scale(0.94); opacity: 1; filter: blur(0); }
    75%  { transform: scale(1.03); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes completion-subtitle {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes completion-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes completion-glow-pulse {
    0%, 100% { text-shadow: 0 0 40px rgba(244,197,66,0.5), 0 0 80px rgba(244,197,66,0.2); }
    50%       { text-shadow: 0 0 60px rgba(244,197,66,0.8), 0 0 120px rgba(244,197,66,0.35); }
  }
  @media (prefers-reduced-motion: reduce) {
    .completion-stamp, .completion-subtitle, .completion-glow { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
  }
`;

function CompletionOverlay({ finished, onReplay }: { finished: boolean; onReplay: () => void }) {
  return (
    <>
      <style>{COMPLETION_STYLES}</style>
      <div
        className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm"
        style={{
          background: 'rgba(3,14,26,0.92)',
          opacity: finished ? 1 : 0,
          pointerEvents: finished ? 'auto' : 'none',
          transition: 'opacity 0.5s ease',
        }}
      >
      <div className="text-center max-w-lg px-8">
        {/* Stamp entrance for the big number */}
        <div
          className="completion-stamp text-6xl md:text-7xl font-black mb-2"
          style={{
            fontFamily: '"Baloo 2", cursive',
            color: '#F4C542',
            animation: finished ? 'completion-stamp 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, completion-glow-pulse 3s 1s ease-in-out infinite' : 'none',
            opacity: finished ? undefined : 0,
          }}
        >
          🍔 10,000
        </div>
        <div
          className="completion-subtitle text-lg font-semibold mb-6"
          style={{
            color: '#4AE88A',
            fontFamily: '"Baloo 2", cursive',
            animation: finished ? 'completion-subtitle 0.6s 0.35s ease forwards' : 'none',
            opacity: finished ? undefined : 0,
          }}
        >
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

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
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
            onClick={onReplay}
            className="px-6 py-3 font-medium transition-all cursor-pointer"
            style={{ color: 'rgba(184,228,247,0.3)', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none' }}
          >
            Replay ↻
          </button>
        </div>

        {/* OpenSpawn CTA block — upgraded from tiny footnote */}
        <div
          className="rounded-2xl p-6 text-left"
          style={{
            background: 'rgba(6,42,69,0.8)',
            border: '1px solid rgba(74,174,217,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🪸</span>
            <span className="text-lg font-black" style={{ color: '#4AAED9', fontFamily: '"Baloo 2", cursive' }}>
              OpenSpawn
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: '#B8E4F7', fontFamily: 'Nunito, sans-serif' }}>
            This entire operation ran on OpenSpawn.
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}>
            22 AI agents. 5 departments. One ORG.md file. No engineers babysitting the process.
          </p>
          <a
            href="https://openspawn.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'rgba(74,174,217,0.2)',
              border: '1px solid rgba(74,174,217,0.5)',
              color: '#4AAED9',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Build your own org → <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
    </>
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

      {/* Ambient caustic light effects — subtle underwater atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div style={{
          position: 'absolute', borderRadius: '50%',
          width: '50vw', height: '40vh', top: '-5vh', left: '-5vw',
          background: 'radial-gradient(ellipse, rgba(74,174,217,1) 0%, transparent 70%)',
          opacity: 0.04,
          animation: 'bb-caustic 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', borderRadius: '50%',
          width: '40vw', height: '30vh', bottom: '10%', right: '-8vw',
          background: 'radial-gradient(ellipse, rgba(46,204,113,1) 0%, transparent 70%)',
          opacity: 0.025,
          animation: 'bb-caustic 13s 6s ease-in-out infinite',
          '--bb-caustic-rotate': '-3deg' as string,
          '--bb-caustic-drift': '20px' as string,
          '--bb-caustic-min': '0.02' as string,
          '--bb-caustic-max': '0.05' as string,
        } as React.CSSProperties} />
        <div style={{
          position: 'absolute', borderRadius: '50%',
          width: '35vw', height: '25vh', top: '40%', left: '30%',
          background: 'radial-gradient(ellipse, rgba(26,125,181,1) 0%, transparent 70%)',
          opacity: 0.03,
          animation: 'bb-caustic 22s 3s ease-in-out infinite',
          '--bb-caustic-rotate': '5deg' as string,
          '--bb-caustic-drift': '0px' as string,
          '--bb-caustic-min': '0.02' as string,
          '--bb-caustic-max': '0.04' as string,
        } as React.CSSProperties} />
      </div>

      {/* Intro overlay */}
      {showIntro && <IntroCard onStart={handleStart} />}

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top: Progress header */}
        <ProgressHeader act={replay.act} tick={replay.tick} pattiesDelivered={replay.pattiesDelivered} />

        {/* Mobile: OpenSpawn badge strip (below header, above org chart) */}
        <div className="flex md:hidden">
          <OpenSpawnBadge
            variant="mobile"
            spawnedAgents={replay.spawnedAgents}
            pattiesDelivered={replay.pattiesDelivered}
            finished={replay.finished}
          />
        </div>

        {/* Middle: Org Chart + Feed */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Desktop Org Chart (md+) - 60% */}
          <div className="hidden md:flex flex-[3] min-h-0 relative">
            <OrgChartLive
              nodeStates={replay.nodeStates}
              edgeAnimations={replay.edgeAnimations}
              reassignedEdges={replay.reassignedEdges}
              spawnedAgents={replay.spawnedAgents}
            />

            {/* Desktop OpenSpawn badge — bottom-left of org chart panel */}
            <OpenSpawnBadge
              variant="desktop"
              spawnedAgents={replay.spawnedAgents}
              pattiesDelivered={replay.pattiesDelivered}
              finished={replay.finished}
            />

            {/* Act banner overlay */}
            <ActBanner banner={replay.actBanner} />
          </div>

          {/* Mobile Org Chart (<md) — compact department cards */}
          <div className="flex md:hidden w-full overflow-y-auto" style={{ maxHeight: '45vh' }}>
            <MobileOrgChart
              nodeStates={replay.nodeStates}
              spawnedAgents={replay.spawnedAgents}
            />
          </div>

          {/* Live Feed - 40% */}
          <div
            className="flex-[2] min-h-0"
            style={{ borderLeft: '1px solid rgba(74,174,217,0.1)' }}
          >
            <LiveFeed messages={replay.messages} />
          </div>
        </div>

        {/* Bottom: Stats bar */}
        <StatsBar stats={replay.stats} />

        {/* Finished overlay */}
        <CompletionOverlay finished={replay.finished} onReplay={handleReplay} />
      </div>
    </div>
  );
}
