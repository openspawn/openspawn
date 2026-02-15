import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAgents } from '../hooks/use-agents';
import { useTasks } from '../hooks/use-tasks';
import { useCredits } from '../hooks/use-credits';
import { SANDBOX_URL } from '../lib/sandbox-url';

// ── Types ──────────────────────────────────────────────────────────────────

type LayoutMode = 'A' | 'B' | 'C';

interface FeedItem {
  id: string;
  timestamp: string;
  agent?: string;
  emoji: string;
  text: string;
}

interface ScenarioState {
  phase: string;
  tick: number;
  pattiesProduced: number;
  pattiesDelivered: number;
  queueSize: number;
  kitchenRate: number;
  deliveryRate: number;
  totalRevenue: number;
  totalCost: number;
}

// ── Scenario Acts ──────────────────────────────────────────────────────────

const ACTS = [
  { name: 'Act I: The Order', narrative: 'Plankton walks into the Krusty Krab and slaps down the order of a lifetime — 10,000 Krabby Patties. Mr. Krabs sees dollar signs.' },
  { name: 'Act II: Full Steam Ahead', narrative: 'SpongeBob fires up every grill. The kitchen is a blur of spatulas and patties. Production is at maximum capacity.' },
  { name: 'Act III: The Bottleneck', narrative: 'Squidward can\'t keep up. Patties pile up at the window. The queue grows. Tensions rise.' },
  { name: 'Act IV: Adaptation', narrative: 'The team reorganizes. Extra hands on delivery. The queue slowly drains as the system finds its balance.' },
  { name: 'Act V: Victory Lap', narrative: 'The last patty leaves the window. 10,000 delivered. Squilliam tallies the profits. Bikini Bottom celebrates.' },
];

function getAct(pattiesDelivered: number) {
  if (pattiesDelivered < 100) return ACTS[0];
  if (pattiesDelivered < 3000) return ACTS[1];
  if (pattiesDelivered < 6000) return ACTS[2];
  if (pattiesDelivered < 9000) return ACTS[3];
  return ACTS[4];
}

// ── Agent emoji mapping ────────────────────────────────────────────────────

const AGENT_EMOJI: Record<string, string> = {
  spongebob: '🧽', patrick: '⭐', sandy: '🐿️', squidward: '🦑',
  'mr. krabs': '🦀', plankton: '🦠', gary: '🐌', pearl: '🐋',
  squilliam: '🎩', karen: '💻', larry: '🦞', mermaidman: '🦸',
  barnacleboy: '🦹',
};

function getAgentEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(AGENT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '🐟';
}

// ── Division classification ────────────────────────────────────────────────

type Division = 'kitchen' | 'register' | 'vault';

function classifyAgent(name: string): Division {
  const lower = name.toLowerCase();
  if (['spongebob', 'patrick', 'sandy', 'gary', 'larry'].some(n => lower.includes(n))) return 'kitchen';
  if (['squidward', 'mermaidman', 'barnacleboy'].some(n => lower.includes(n))) return 'register';
  return 'vault';
}

// ── Hooks ──────────────────────────────────────────────────────────────────

function useScenarioState() {
  return useQuery<ScenarioState>({
    queryKey: ['scenario-state'],
    queryFn: async () => {
      try {
        const res = await fetch(`${SANDBOX_URL}/api/scenario/state`);
        if (res.ok) return res.json();
      } catch { /* fallthrough */ }
      // TODO: Replace mock with real API when /api/scenario/state exists
      return null;
    },
    refetchInterval: 2000,
  });
}

function useLiveFeed() {
  return useQuery<FeedItem[]>({
    queryKey: ['live-feed'],
    queryFn: async () => {
      const items: FeedItem[] = [];
      try {
        const [eventsRes, msgsRes] = await Promise.all([
          fetch(`${SANDBOX_URL}/api/events?limit=30`),
          fetch(`${SANDBOX_URL}/api/messages?limit=30`),
        ]);
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          for (const e of (Array.isArray(events) ? events : events.events || [])) {
            items.push({
              id: `e-${e.id || e.timestamp}`,
              timestamp: e.timestamp || e.createdAt || new Date().toISOString(),
              agent: e.agentName || e.agent || '',
              emoji: getAgentEmoji(e.agentName || e.agent || ''),
              text: e.message || e.description || e.type || 'Event',
            });
          }
        }
        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          for (const m of (Array.isArray(msgs) ? msgs : msgs.messages || [])) {
            items.push({
              id: `m-${m.id || m.timestamp}`,
              timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
              agent: m.agentName || m.from || m.agent || '',
              emoji: getAgentEmoji(m.agentName || m.from || m.agent || ''),
              text: m.content || m.message || m.text || '',
            });
          }
        }
      } catch { /* use empty */ }
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 50);
    },
    refetchInterval: 2000,
  });
}

// ── Simulated state (when API isn't available) ─────────────────────────────

function useSimulatedState(realState: ScenarioState | null | undefined) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (realState) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [realState]);

  if (realState) return realState;

  const produced = Math.min(10000, tick * 50);
  const delivered = Math.min(produced, tick * 8);
  const queue = produced - delivered;

  return {
    phase: getAct(delivered).name,
    tick,
    pattiesProduced: produced,
    pattiesDelivered: delivered,
    queueSize: queue,
    kitchenRate: produced < 10000 ? 50 : 0,
    deliveryRate: delivered < produced ? 8 : 0,
    totalRevenue: delivered * 2.99,
    totalCost: produced * 0.45,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LayoutToggle({ mode, setMode }: { mode: LayoutMode; setMode: (m: LayoutMode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
      {(['A', 'B', 'C'] as LayoutMode[]).map(m => (
        <button
          key={m}
          onClick={() => { setMode(m); localStorage.setItem('live-layout', m); }}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            mode === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white/60'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function ActBanner({ act }: { act: typeof ACTS[0] }) {
  return (
    <motion.div
      key={act.name}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">{act.name}</h2>
      <p className="text-white/50 text-sm max-w-2xl mx-auto">{act.narrative}</p>
    </motion.div>
  );
}

function ProgressBar({ produced, delivered, total }: { produced: number; delivered: number; total: number }) {
  const pct = Math.min(100, (delivered / total) * 100);
  const prodPct = Math.min(100, (produced / total) * 100);
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-white/40">
        <span>🍔 {delivered.toLocaleString()} delivered</span>
        <span>{total.toLocaleString()} target</span>
      </div>
      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 bg-amber-500/20 rounded-full"
          animate={{ width: `${prodPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white drop-shadow">{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-white/30">
        <span>Produced: {produced.toLocaleString()}</span>
        <span>Queue: {(produced - delivered).toLocaleString()}</span>
      </div>
    </div>
  );
}

interface AgentInfo { name: string; emoji: string; status: string; division: Division }

function DivisionPanel({ title, emoji, agents, rate, rateLabel, color }: {
  title: string; emoji: string; agents: AgentInfo[]; rate: number; rateLabel: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-white/[0.02] p-4 space-y-3 ${color}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h3>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5">{rate}/tick</span>
      </div>
      <div className="text-xs text-white/40">{rateLabel}</div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {agents.length === 0 && <div className="text-xs text-white/20 italic">No agents assigned</div>}
        {agents.map(a => (
          <div key={a.name} className="flex items-center gap-2 text-sm">
            <span>{a.emoji}</span>
            <span className="text-white/70 font-medium">{a.name}</span>
            <span className="text-white/30 text-xs ml-auto truncate max-w-[120px]">{a.status}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function LiveFeed({ items }: { items: FeedItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [items]);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Live Feed</span>
      </div>
      <div ref={containerRef} className="h-40 overflow-y-auto p-2 space-y-1">
        {items.length === 0 && (
          <div className="text-xs text-white/20 italic p-2">Waiting for events…</div>
        )}
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 text-xs py-1 px-2 rounded hover:bg-white/[0.02]"
            >
              <span>{item.emoji}</span>
              <span className="text-white/30 font-mono shrink-0">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-white/60 truncate">{item.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Scoreboard({ state }: { state: ScenarioState }) {
  return (
    <div className="space-y-4">
      <ProgressBar produced={state.pattiesProduced} delivered={state.pattiesDelivered} total={10000} />
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Window Queue" value={state.queueSize.toLocaleString()} color={state.queueSize > 500 ? 'text-red-400' : 'text-amber-400'} />
        <MetricCard label="Tick" value={`#${state.tick}`} color="text-white/60" />
        <MetricCard label="Revenue" value={`$${state.totalRevenue.toFixed(0)}`} color="text-emerald-400" />
        <MetricCard label="Cost" value={`$${state.totalCost.toFixed(0)}`} color="text-amber-400" />
      </div>
      <div className="text-center">
        <span className={`text-xs font-semibold ${state.totalRevenue - state.totalCost > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          Profit: ${(state.totalRevenue - state.totalCost).toFixed(0)}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
      <div className="text-[10px] text-white/30 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function PipelineViz({ state }: { state: ScenarioState }) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <div className="text-center">
        <div className="text-2xl">🍳</div>
        <div className="text-xs text-white/40 mt-1">Production</div>
        <div className="text-sm font-bold text-cyan-400">{state.pattiesProduced.toLocaleString()}</div>
        <div className="text-[10px] text-white/30">{state.kitchenRate}/tick</div>
      </div>
      <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-white/20 text-xl">→</motion.div>
      <div className="text-center">
        <div className="text-2xl">📦</div>
        <div className="text-xs text-white/40 mt-1">Queue</div>
        <div className={`text-sm font-bold ${state.queueSize > 500 ? 'text-red-400' : 'text-amber-400'}`}>
          {state.queueSize.toLocaleString()}
        </div>
      </div>
      <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-white/20 text-xl">→</motion.div>
      <div className="text-center">
        <div className="text-2xl">🪑</div>
        <div className="text-xs text-white/40 mt-1">Delivery</div>
        <div className="text-sm font-bold text-emerald-400">{state.pattiesDelivered.toLocaleString()}</div>
        <div className="text-[10px] text-white/30">{state.deliveryRate}/tick</div>
      </div>
    </div>
  );
}

function FinancialTicker({ state }: { state: ScenarioState }) {
  const profit = state.totalRevenue - state.totalCost;
  return (
    <div className="flex items-center justify-center gap-6 py-2 px-4 bg-white/[0.02] border-t border-white/5 text-xs">
      <span className="text-white/30">💰 Revenue: <span className="text-emerald-400 font-medium">${state.totalRevenue.toFixed(0)}</span></span>
      <span className="text-white/30">📉 Cost: <span className="text-amber-400 font-medium">${state.totalCost.toFixed(0)}</span></span>
      <span className="text-white/30">📊 Profit: <span className={`font-medium ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${profit.toFixed(0)}</span></span>
      <span className="text-white/30">🎫 Queue: <span className={`font-medium ${state.queueSize > 500 ? 'text-red-400' : 'text-amber-400'}`}>{state.queueSize.toLocaleString()}</span></span>
    </div>
  );
}

// ── Layouts ────────────────────────────────────────────────────────────────

function LayoutA({ state, kitchenAgents, registerAgents, feedItems }: LayoutProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        <DivisionPanel title="The Kitchen" emoji="🔥" agents={kitchenAgents} rate={state.kitchenRate} rateLabel="Patties produced per tick" color="border-amber-500/20" />
        <div className="space-y-4">
          <Scoreboard state={state} />
        </div>
        <DivisionPanel title="The Register" emoji="🪑" agents={registerAgents} rate={state.deliveryRate} rateLabel="Patties delivered per tick" color="border-cyan-500/20" />
      </div>
      <LiveFeed items={feedItems} />
    </div>
  );
}

function LayoutB({ state, kitchenAgents, registerAgents, vaultAgents, feedItems }: LayoutProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      <ProgressBar produced={state.pattiesProduced} delivered={state.pattiesDelivered} total={10000} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        <DivisionPanel title="The Kitchen" emoji="🔥" agents={kitchenAgents} rate={state.kitchenRate} rateLabel="Production" color="border-amber-500/20" />
        <DivisionPanel title="The Register" emoji="🪑" agents={registerAgents} rate={state.deliveryRate} rateLabel="Delivery" color="border-cyan-500/20" />
        <DivisionPanel title="The Vault" emoji="💰" agents={vaultAgents} rate={0} rateLabel="Finance" color="border-emerald-500/20" />
      </div>
      <LiveFeed items={feedItems} />
    </div>
  );
}

function LayoutC({ state, kitchenAgents, registerAgents, feedItems }: LayoutProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Hero */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center space-y-3">
        <PipelineViz state={state} />
        <ProgressBar produced={state.pattiesProduced} delivered={state.pattiesDelivered} total={10000} />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        <DivisionPanel title="The Kitchen" emoji="🔥" agents={kitchenAgents} rate={state.kitchenRate} rateLabel="Production" color="border-amber-500/20" />
        <DivisionPanel title="The Register" emoji="🪑" agents={registerAgents} rate={state.deliveryRate} rateLabel="Delivery" color="border-cyan-500/20" />
        <LiveFeed items={feedItems} />
      </div>
      {/* Ticker */}
      <FinancialTicker state={state} />
    </div>
  );
}

interface LayoutProps {
  state: ScenarioState;
  kitchenAgents: AgentInfo[];
  registerAgents: AgentInfo[];
  vaultAgents: AgentInfo[];
  feedItems: FeedItem[];
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function LiveViewPage() {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<LayoutMode>(
    () => (localStorage.getItem('live-layout') as LayoutMode) || 'A'
  );

  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { data: scenarioState } = useScenarioState();
  const { data: feedItems } = useLiveFeed();

  const state = useSimulatedState(scenarioState);
  const act = getAct(state.pattiesDelivered);
  const feed = feedItems || [];

  // Classify agents into divisions
  const classifiedAgents = useMemo<AgentInfo[]>(() => {
    if (agents.length === 0) {
      // Mock agents for demo
      return [
        { name: 'SpongeBob', emoji: '🧽', status: 'Flipping patties', division: 'kitchen' },
        { name: 'Patrick', emoji: '⭐', status: 'Carrying buns', division: 'kitchen' },
        { name: 'Sandy', emoji: '🐿️', status: 'Quality control', division: 'kitchen' },
        { name: 'Gary', emoji: '🐌', status: 'Meowing supportively', division: 'kitchen' },
        { name: 'Larry', emoji: '🦞', status: 'Heavy lifting', division: 'kitchen' },
        { name: 'Squidward', emoji: '🦑', status: 'Reluctantly delivering', division: 'register' },
        { name: 'MermaidMan', emoji: '🦸', status: 'EVIL! ...delivery', division: 'register' },
        { name: 'BarnacleBoy', emoji: '🦹', status: 'Sidekick duties', division: 'register' },
        { name: 'Squilliam', emoji: '🎩', status: 'Counting profits', division: 'vault' },
        { name: 'Mr. Krabs', emoji: '🦀', status: 'Money money money', division: 'vault' },
        { name: 'Karen', emoji: '💻', status: 'Running analytics', division: 'vault' },
      ];
    }
    return agents.map(a => ({
      name: a.name,
      emoji: getAgentEmoji(a.name),
      status: a.status || 'idle',
      division: classifyAgent(a.name),
    }));
  }, [agents]);

  const kitchenAgents = classifiedAgents.filter(a => a.division === 'kitchen');
  const registerAgents = classifiedAgents.filter(a => a.division === 'register');
  const vaultAgents = classifiedAgents.filter(a => a.division === 'vault');

  const layoutProps: LayoutProps = { state, kitchenAgents, registerAgents, vaultAgents, feedItems: feed };

  return (
    <div className="relative min-h-screen w-full bg-[#020817] text-white flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/app/bikini-bottom-bg.jpg)', opacity: 0.08 }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020817]/80 to-[#020817]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen p-4 md:p-6 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              🍍 Operation: 10,000 Krabby Patties
            </h1>
            <ActBanner act={act} />
          </div>
          <LayoutToggle mode={layout} setMode={setLayout} />
        </div>

        {/* Layout content */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={layout}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {layout === 'A' && <LayoutA {...layoutProps} />}
              {layout === 'B' && <LayoutB {...layoutProps} />}
              {layout === 'C' && <LayoutC {...layoutProps} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-end shrink-0">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-cyan-400 transition-colors"
          >
            Explore Dashboard <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
