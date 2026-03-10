import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { IntroCard } from "../components/live/intro-card";
import {
  OrgChartLive,
  type AgentNodeState,
  type EdgeAnimation,
} from "../components/live/org-chart-live";
import { MobileOrgChart } from "../components/live/MobileOrgChart";
import { LiveFeed, type FeedMessage } from "../components/live/live-feed";
import { StatsBar } from "../components/live/stats-bar";
import { OpenSpawnBadge } from "../components/live/OpenSpawnBadge";
import {
  TIMELINE,
  ACTS,
  AGENTS,
  NodeStatus,
  type Stats,
  type ReplayEvent,
  type SpawnedAgent,
} from "../components/live/replay-data";
import { getActiveAnnotation, type Annotation } from "../components/live/live-view-annotations";
import {
  AgentControlPanel,
  TaskControlBar,
  AgentContextMenu,
  AGENT_DEPARTMENTS,
  type AgentControlState,
  type AgentControlStatus,
  type Department,
} from "../components/controls";
import {
  agentUpdateStatus,
  agentFire,
  agentRegister,
  escalate,
  eventList,
} from "../services/mcp-client";

import "../components/controls/control-animations.css";

// ── Variable tick timing ──────────────────────────────────────────────────────

const PRE_PAUSE_TICKS: Record<number, number> = {
  1: 1000,
  13: 900,
  56: 800,
  70: 800,
  92: 900,
  138: 1500,
};

function getTickDelay(nextTick: number): number {
  if (PRE_PAUSE_TICKS[nextTick] !== undefined) return PRE_PAUSE_TICKS[nextTick];
  if (nextTick <= 10) return 400;
  if (nextTick >= 19 && nextTick <= 26) return 300;
  if (nextTick <= 40) return 500;
  if (nextTick <= 55) return 450;
  if (nextTick <= 75) return 350;
  if (nextTick <= 90) return 600;
  if (nextTick <= 120) return 600;
  return 500;
}

// ── Replay Hook ──────────────────────────────────────────────────────────────

const INITIAL_STATS: Stats = {
  kitchenRate: 0,
  queueSize: 0,
  deliveryRate: 0,
  revenue: 0,
  margin: 0,
  budgetUsed: 0,
  pattiesProduced: 0,
  pattiesDelivered: 0,
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
  const [actBanner, setActBanner] = useState<{
    num: number;
    name: string;
    narrative: string;
  } | null>(null);
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

  const processEvents = useCallback((currentTick: number) => {
    const events = TIMELINE.filter((e: ReplayEvent) => e.tick === currentTick);
    let changed = false;

    for (const event of events) {
      changed = true;
      const d = event.data;

      switch (event.type) {
        case "act_change":
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

        case "stat_update":
          if (d.stats) {
            statsRef.current = { ...statsRef.current, ...d.stats };
          }
          break;

        case "node_status":
          if (d.agent) {
            nodeStatesRef.current = {
              ...nodeStatesRef.current,
              [d.agent]: {
                ...(nodeStatesRef.current[d.agent] || { status: NodeStatus.Idle }),
                status: d.status || NodeStatus.Idle,
              },
            };
          }
          break;

        case "spawn":
          if (d.spawnAgent) {
            spawnedRef.current = [...spawnedRef.current, d.spawnAgent];
            nodeStatesRef.current = {
              ...nodeStatesRef.current,
              [d.spawnAgent.id]: { status: NodeStatus.Working },
            };
            edgeAnimsRef.current = [
              ...edgeAnimsRef.current,
              {
                id: `ea-spawn-${currentTick}-${d.spawnAgent.id}`,
                from: d.spawnAgent.parentId,
                to: d.spawnAgent.id,
                color: "#F4C542",
                timestamp: Date.now(),
              },
            ];
          }
          if (d.text) {
            const fromId = d.from || "spongebob-squarepants";
            messagesRef.current = [
              ...messagesRef.current,
              {
                id: `${currentTick}-${event.type}-${fromId}-${messagesRef.current.length}`,
                tick: currentTick,
                agentId: fromId,
                text: d.text,
                type: "message",
              },
            ];
          }
          break;

        case "message":
        case "delegation":
        case "escalation":
        case "completion":
        case "reassign": {
          const fromId = d.from || "mr-krabs";
          messagesRef.current = [
            ...messagesRef.current,
            {
              id: `${currentTick}-${event.type}-${fromId}-${messagesRef.current.length}`,
              tick: currentTick,
              agentId: fromId,
              text: d.text || "",
              type: event.type,
            },
          ];

          if ((event.type === "delegation" || event.type === "reassign") && d.from && d.to) {
            edgeAnimsRef.current = [
              ...edgeAnimsRef.current,
              {
                id: `ea-${currentTick}-${d.from}-${d.to}`,
                from: d.from,
                to: d.to,
                color: "#F4C542",
                timestamp: Date.now(),
              },
            ];
          }
          if (event.type === "escalation" && d.from && d.to) {
            edgeAnimsRef.current = [
              ...edgeAnimsRef.current,
              {
                id: `ea-${currentTick}-${d.from}-${d.to}`,
                from: d.from,
                to: d.to,
                color: "#ef4444",
                timestamp: Date.now(),
              },
            ];
          }
          if (event.type === "reassign" && d.from && d.to) {
            reassignedRef.current = [
              ...reassignedRef.current,
              { from: "squidward-tentacles", to: d.to },
            ];
          }
          break;
        }
      }

      if (statsRef.current.queueSize > 0) {
        nodeStatesRef.current = {
          ...nodeStatesRef.current,
          "squidward-tentacles": {
            ...(nodeStatesRef.current["squidward-tentacles"] || { status: NodeStatus.Working }),
            queueBadge: statsRef.current.queueSize,
          },
        };
      }
    }

    const now = Date.now();
    const before = edgeAnimsRef.current.length;
    edgeAnimsRef.current = edgeAnimsRef.current.filter((a) => now - a.timestamp < 2000);
    if (edgeAnimsRef.current.length !== before) changed = true;

    if (changed) forceUpdate((n) => n + 1);
  }, []);

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
    const timer = setTimeout(() => setTick(nextTick), delay);
    return () => clearTimeout(timer);
  }, [tick, running]);

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

function ProgressHeader({
  act,
  pattiesDelivered,
}: {
  act: (typeof ACTS)[0];
  pattiesDelivered: number;
}) {
  const pct = Math.min(100, (pattiesDelivered / 10000) * 100);
  return (
    <div
      className="shrink-0 space-y-2 px-4 py-3 border-b"
      style={{
        background: "rgba(6,42,69,0.9)",
        borderColor: "rgba(74,174,217,0.2)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
          >
            {act.name}
          </h2>
          <p className="text-[#B8E4F7]/50 text-xs" style={{ fontFamily: "Nunito, sans-serif" }}>
            {act.narrative}
          </p>
        </div>
        <div className="text-right">
          <div
            className="text-lg font-bold"
            style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
          >
            {pattiesDelivered.toLocaleString()}
          </div>
          <div
            className="text-[10px] text-[#B8E4F7]/30"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            / 10,000 patties 🍔
          </div>
        </div>
      </div>
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(74,174,217,0.1)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #F4C542 0%, #4AE88A 100%)",
            boxShadow: "0 0 12px rgba(244,197,66,0.4)",
            width: `${pct}%`,
            transition: "width 0.5s ease-out",
          }}
        />
      </div>
    </div>
  );
}

// ── Act Banner CSS ───────────────────────────────────────────────────────────
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
    0%   { opacity: 0; transform: scale(1.18) translateY(-6px); filter: blur(6px); }
    60%  { opacity: 1; transform: scale(0.98) translateY(1px); filter: blur(0); }
    80%  { transform: scale(1.01); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes act-narrative-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes act-line-expand {
    from { width: 0; opacity: 0; }
    to   { width: 80px; opacity: 1; }
  }
  @keyframes annotation-slide-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .act-overlay, .act-label, .act-title, .act-narrative, .act-line, .annotation-bubble {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
`;

function ActBanner({
  banner,
}: {
  banner: { num: number; name: string; narrative: string } | null;
}) {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<typeof banner>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (banner) {
      setContent(banner);
      setVisible(true);
      setAnimKey((k) => k + 1);
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
          background: "rgba(3,14,26,0.75)",
          opacity: visible ? undefined : 0,
          transition: visible ? undefined : "opacity 0.4s ease",
          animation: visible ? "act-overlay-in 0.4s ease forwards" : undefined,
        }}
      >
        <div
          key={`line-top-${animKey}`}
          className="act-line h-px mb-6"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(244,197,66,0.6), transparent)",
            animation: "act-line-expand 0.5s 0.1s ease forwards",
            width: 0,
            opacity: 0,
          }}
        />
        <div
          key={`label-${animKey}`}
          className="act-label text-xs font-bold uppercase mb-2"
          style={{
            color: "rgba(244,197,66,0.7)",
            fontFamily: "Nunito, sans-serif",
            animation: "act-label-rise 0.4s 0.05s cubic-bezier(0.16,1,0.3,1) forwards",
            opacity: 0,
            letterSpacing: "0.3em",
          }}
        >
          ── Act {content.num} ──
        </div>
        <div
          key={`title-${animKey}`}
          className="act-title text-2xl md:text-4xl font-black tracking-tight mb-3"
          style={{
            color: "#F4C542",
            fontFamily: '"Baloo 2", cursive',
            textShadow: "0 0 40px rgba(244,197,66,0.5)",
            animation: "act-title-stamp 0.55s 0.12s cubic-bezier(0.34,1.56,0.64,1) forwards",
            opacity: 0,
          }}
        >
          {content.name.replace(/^Act \w+: /, "")}
        </div>
        <div
          key={`narrative-${animKey}`}
          className="act-narrative text-sm max-w-sm text-center px-6"
          style={{
            color: "rgba(184,228,247,0.55)",
            fontFamily: "Nunito, sans-serif",
            animation: "act-narrative-in 0.5s 0.3s ease forwards",
            opacity: 0,
          }}
        >
          {content.narrative}
        </div>
        <div
          key={`line-bot-${animKey}`}
          className="act-line h-px mt-6"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(244,197,66,0.4), transparent)",
            animation: "act-line-expand 0.5s 0.2s ease forwards",
            width: 0,
            opacity: 0,
          }}
        />
      </div>
    </>
  );
}

// ── Annotation Bubble ────────────────────────────────────────────────────────

function AnnotationBubble({ annotation }: { annotation: Annotation | null }) {
  if (!annotation) return null;
  return (
    <div
      key={annotation.id}
      className="annotation-bubble absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-20 rounded-xl px-4 py-3"
      style={{
        background: "rgba(6,42,69,0.95)",
        border: `1px solid ${annotation.color}40`,
        boxShadow: `0 0 20px ${annotation.color}20`,
        backdropFilter: "blur(8px)",
        animation: "annotation-slide-in 0.3s ease forwards",
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0">{annotation.icon}</span>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "rgba(184,228,247,0.8)", fontFamily: "Nunito, sans-serif" }}
        >
          {annotation.text}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="text-[10px]"
          style={{ color: "rgba(74,174,217,0.4)", fontFamily: "Nunito, sans-serif" }}
        >
          🪸 OpenSpawn feature
        </span>
      </div>
    </div>
  );
}

// ── Completion Overlay ───────────────────────────────────────────────────────

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
  @keyframes completion-glow-pulse {
    0%, 100% { text-shadow: 0 0 40px rgba(244,197,66,0.5), 0 0 80px rgba(244,197,66,0.2); }
    50%       { text-shadow: 0 0 60px rgba(244,197,66,0.8), 0 0 120px rgba(244,197,66,0.35); }
  }
  @keyframes completion-stat-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .completion-stamp, .completion-subtitle, .completion-glow, .completion-stat {
      animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important;
    }
  }
`;

interface CompletionProps {
  finished: boolean;
  onReplay: () => void;
  stats: Stats;
  messageCount: number;
  spawnedCount: number;
}

function CompletionOverlay({
  finished,
  onReplay,
  stats,
  messageCount,
  spawnedCount,
}: CompletionProps) {
  // Count escalations from messages
  const escalationCount = 2; // known from timeline: tick 13 & tick 70

  return (
    <>
      <style>{COMPLETION_STYLES}</style>
      <div
        className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm overflow-y-auto"
        style={{
          background: "rgba(3,14,26,0.94)",
          opacity: finished ? 1 : 0,
          pointerEvents: finished ? "auto" : "none",
          transition: "opacity 0.5s ease",
        }}
      >
        <div className="text-center max-w-lg px-6 py-8">
          {/* Big number */}
          <div
            className="completion-stamp text-5xl md:text-7xl font-black mb-2"
            style={{
              fontFamily: '"Baloo 2", cursive',
              color: "#F4C542",
              animation: finished
                ? "completion-stamp 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, completion-glow-pulse 3s 1s ease-in-out infinite"
                : "none",
              opacity: finished ? undefined : 0,
            }}
          >
            🍔 10,000
          </div>
          <div
            className="completion-subtitle text-lg font-semibold mb-8"
            style={{
              color: "#4AE88A",
              fontFamily: '"Baloo 2", cursive',
              animation: finished ? "completion-subtitle 0.6s 0.35s ease forwards" : "none",
              opacity: finished ? undefined : 0,
            }}
          >
            🎉 PATTIES DELIVERED! 🎉
          </div>

          {/* Summary stats grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 completion-stat"
            style={{
              animation: finished ? "completion-stat-in 0.5s 0.6s ease forwards" : "none",
              opacity: finished ? undefined : 0,
            }}
          >
            {[
              { label: "Agents Used", value: `${22 + spawnedCount}`, icon: "🤖" },
              { label: "Messages", value: `${messageCount}`, icon: "💬" },
              { label: "Escalations", value: `${escalationCount}`, icon: "🚨" },
              { label: "Revenue", value: `${stats.revenue.toLocaleString()} cr`, icon: "💰" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(6,42,69,0.7)",
                  border: "1px solid rgba(74,174,217,0.15)",
                }}
              >
                <div className="text-lg mb-1">{s.icon}</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
                >
                  {s.value}
                </div>
                <div
                  className="text-[10px]"
                  style={{ color: "rgba(184,228,247,0.4)", fontFamily: "Nunito, sans-serif" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Value proposition */}
          <div
            className="completion-stat rounded-2xl p-6 mb-6 text-center"
            style={{
              background: "rgba(6,42,69,0.8)",
              border: "1px solid rgba(74,174,217,0.3)",
              animation: finished ? "completion-stat-in 0.5s 0.8s ease forwards" : "none",
              opacity: finished ? undefined : 0,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🪸</span>
              <span
                className="text-lg font-black"
                style={{ color: "#4AAED9", fontFamily: '"Baloo 2", cursive' }}
              >
                OpenSpawn
              </span>
            </div>
            <p
              className="text-base font-semibold mb-2"
              style={{ color: "#B8E4F7", fontFamily: "Nunito, sans-serif" }}
            >
              This is what OpenSpawn does.
            </p>
            <p
              className="text-sm mb-1"
              style={{ color: "rgba(184,228,247,0.55)", fontFamily: "Nunito, sans-serif" }}
            >
              Graduate from sub-agents.
            </p>
            <p
              className="text-sm mb-5"
              style={{ color: "rgba(184,228,247,0.4)", fontFamily: "Nunito, sans-serif" }}
            >
              Persistent agents · Org hierarchy · Cross-department comms · Auto-escalation
            </p>
            <a
              href="https://openspawn.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #4AAED9 0%, #1A7DB5 100%)",
                color: "#fff",
                fontFamily: "Nunito, sans-serif",
                textDecoration: "none",
              }}
            >
              Try it → npx openspawn start <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Replay */}
          <button
            onClick={onReplay}
            className="px-6 py-3 font-medium cursor-pointer"
            style={{
              color: "rgba(184,228,247,0.3)",
              fontFamily: "Nunito, sans-serif",
              background: "none",
              border: "none",
            }}
          >
            Replay ↻
          </button>
        </div>
      </div>
    </>
  );
}

// ── Mobile Tab Bar ───────────────────────────────────────────────────────────

enum MobileTab {
  Org = "org",
  Feed = "feed",
  Stats = "stats",
}

function MobileTabBar({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (t: MobileTab) => void;
}) {
  const tabs: { id: MobileTab; label: string; icon: string }[] = [
    { id: MobileTab.Org, label: "Org Chart", icon: "🏢" },
    { id: MobileTab.Feed, label: "Live Feed", icon: "💬" },
    { id: MobileTab.Stats, label: "Stats", icon: "📊" },
  ];

  return (
    <div
      className="flex md:hidden shrink-0"
      style={{
        background: "rgba(6,42,69,0.95)",
        borderBottom: "1px solid rgba(74,174,217,0.15)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-none cursor-pointer"
          style={{
            background: active === tab.id ? "rgba(74,174,217,0.1)" : "transparent",
            borderBottom: active === tab.id ? "2px solid #4AAED9" : "2px solid transparent",
            color: active === tab.id ? "#4AAED9" : "rgba(184,228,247,0.4)",
            fontFamily: "Nunito, sans-serif",
            transition: "color 0.2s, background 0.2s",
          }}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Mobile Stats Panel (full-screen view) ────────────────────────────────────

function MobileStatsPanel({ stats }: { stats: Stats }) {
  const items = [
    { icon: "🔥", label: "Kitchen Rate", value: `${stats.kitchenRate}/tick`, color: "#F4C542" },
    {
      icon: "📦",
      label: "Queue",
      value: stats.queueSize.toLocaleString(),
      color: stats.queueSize > 2000 ? "#FF4757" : stats.queueSize > 1000 ? "#F4C542" : "#4AE88A",
    },
    { icon: "🚚", label: "Delivery Rate", value: `${stats.deliveryRate}/tick`, color: "#4AE88A" },
    {
      icon: "💰",
      label: "Revenue",
      value: `${stats.revenue.toLocaleString()} cr`,
      color: "#F4C542",
    },
    { icon: "📊", label: "Margin", value: `${stats.margin.toFixed(1)}%`, color: "#B8E4F7" },
    {
      icon: "🦀",
      label: "Budget Used",
      value: `${stats.budgetUsed}%`,
      color: stats.budgetUsed > 85 ? "#FF4757" : stats.budgetUsed > 65 ? "#F4C542" : "#4AE88A",
    },
    {
      icon: "🍔",
      label: "Produced",
      value: stats.pattiesProduced.toLocaleString(),
      color: "#F4C542",
    },
    {
      icon: "✅",
      label: "Delivered",
      value: stats.pattiesDelivered.toLocaleString(),
      color: "#4AE88A",
    },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-3"
      style={{ background: "linear-gradient(180deg, #062A45 0%, #030E1A 100%)" }}
    >
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3"
            style={{
              background: "rgba(6,42,69,0.85)",
              border: "1px solid rgba(74,174,217,0.12)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <span
                className="text-[11px]"
                style={{ color: "rgba(184,228,247,0.4)", fontFamily: "Nunito, sans-serif" }}
              >
                {item.label}
              </span>
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: item.color, fontFamily: '"Baloo 2", cursive' }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function LiveViewPage() {
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem("live-intro-seen");
  });
  const [mobileTab, setMobileTab] = useState<MobileTab>(MobileTab.Org);

  // Agent control state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentOverrides, setAgentOverrides] = useState<
    Record<string, { paused?: boolean; department?: Department; modelTier?: "sonnet" | "opus" }>
  >({});
  const [firedAgents, setFiredAgents] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ agentId: string; x: number; y: number } | null>(
    null,
  );

  const getAgentControlState = useCallback(
    (agentId: string, nodeStates: Record<string, AgentNodeState>): AgentControlState | null => {
      const agentDef = AGENTS[agentId];
      if (!agentDef) return null;
      const overrides = agentOverrides[agentId] || {};
      const nodeState = nodeStates[agentId];
      const baseStatus = nodeState?.status || NodeStatus.Idle;
      const status: AgentControlStatus = overrides.paused ? "paused" : baseStatus;
      return {
        id: agentId,
        name: agentDef.name,
        emoji: agentDef.emoji,
        avatarUrl: agentDef.avatarUrl,
        status,
        department: overrides.department || AGENT_DEPARTMENTS[agentId] || "Operations",
        modelTier: overrides.modelTier || "sonnet",
      };
    },
    [agentOverrides],
  );

  const handlePauseResume = useCallback(
    (agentId: string) => {
      const wasPaused = !!agentOverrides[agentId]?.paused;
      const newStatus = wasPaused ? "working" : "paused";
      agentUpdateStatus(agentId, newStatus).catch((err: unknown) =>
        console.warn("[MCP] agentUpdateStatus failed:", err instanceof Error ? err.message : err),
      );
      setAgentOverrides((prev) => ({
        ...prev,
        [agentId]: { ...prev[agentId], paused: !prev[agentId]?.paused },
      }));
    },
    [agentOverrides],
  );

  const handleReassign = useCallback((agentId: string, department: Department) => {
    setAgentOverrides((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], department },
    }));
  }, []);

  const handleFire = useCallback((agentId: string) => {
    agentFire(agentId).catch((err: unknown) =>
      console.warn("[MCP] agentFire failed:", err instanceof Error ? err.message : err),
    );
    setFiredAgents((prev) => new Set([...prev, agentId]));
    setSelectedAgentId(null);
  }, []);

  const handleModelChange = useCallback((agentId: string, tier: "sonnet" | "opus") => {
    setAgentOverrides((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], modelTier: tier },
    }));
  }, []);

  const handleHire = useCallback(
    (role: string, department: Department, modelTier: "sonnet" | "opus") => {
      const id = `agent-${role.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      agentRegister({ id, name: role, role, department, model: modelTier }).catch((err: unknown) =>
        console.warn("[MCP] agentRegister failed:", err instanceof Error ? err.message : err),
      );
      console.log(`[LiveView] hire-agent: role=${role}, dept=${department}, tier=${modelTier}`);
    },
    [],
  );

  const handleEscalate = useCallback(() => {
    escalate("Dashboard user escalation", "high").catch((err: unknown) =>
      console.warn("[MCP] escalate failed:", err instanceof Error ? err.message : err),
    );
    console.log("[LiveView] escalate: sending to CEO agent");
  }, []);

  const handleViewPlan = useCallback(() => {
    console.log("[LiveView] view-plan: opening PLAN.md");
  }, []);

  const replay = useReplay();
  const annotation = getActiveAnnotation(replay.tick);

  // Auto-switch mobile tab to feed during key moments
  useEffect(() => {
    if (replay.tick === 13 || replay.tick === 70) {
      setMobileTab(MobileTab.Feed);
    }
  }, [replay.tick]);

  const handleStart = useCallback(() => {
    localStorage.setItem("live-intro-seen", "1");
    setShowIntro(false);
    replay.start();
  }, [replay.start]);

  const handleReplay = useCallback(() => {
    replay.start();
  }, [replay.start]);

  useEffect(() => {
    if (!showIntro && !replay.running && !replay.finished && replay.tick < 0) {
      replay.start();
    }
  }, [showIntro, replay.running, replay.finished, replay.tick, replay.start]);

  return (
    <div
      className="relative h-screen w-full text-white flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #062A45 0%, #030E1A 100%)" }}
    >
      {/* Ocean background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, rgba(11,94,138,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(26,125,181,0.2) 0%, transparent 50%)",
        }}
      />

      {/* Ambient caustics */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            borderRadius: "50%",
            width: "50vw",
            height: "40vh",
            top: "-5vh",
            left: "-5vw",
            background: "radial-gradient(ellipse, rgba(74,174,217,1) 0%, transparent 70%)",
            opacity: 0.04,
            animation: "bb-caustic 18s ease-in-out infinite",
          }}
        />
      </div>

      {/* Intro overlay */}
      {showIntro && <IntroCard onStart={handleStart} />}

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Persistent OpenSpawn banner — always visible at top */}
        <OpenSpawnBadge
          variant="desktop"
          spawnedAgents={replay.spawnedAgents}
          pattiesDelivered={replay.pattiesDelivered}
          finished={replay.finished}
        />

        {/* Progress header */}
        <ProgressHeader act={replay.act} pattiesDelivered={replay.pattiesDelivered} />

        {/* Mobile tab bar */}
        <MobileTabBar active={mobileTab} onChange={setMobileTab} />

        {/* Middle: Org Chart + Feed */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Desktop Org Chart (md+) - 60% */}
          <div className="hidden md:flex flex-[3] min-h-0 relative">
            <OrgChartLive
              nodeStates={replay.nodeStates}
              edgeAnimations={replay.edgeAnimations}
              reassignedEdges={replay.reassignedEdges}
              spawnedAgents={replay.spawnedAgents}
              onAgentClick={(agentId) => {
                if (!firedAgents.has(agentId)) setSelectedAgentId(agentId);
              }}
              onAgentContextMenu={(agentId, x, y) => {
                if (!firedAgents.has(agentId)) setContextMenu({ agentId, x, y });
              }}
            />
            <ActBanner banner={replay.actBanner} />
            <AnnotationBubble annotation={annotation} />
          </div>

          {/* Mobile: one panel at a time */}
          <div className="flex md:hidden flex-1 min-h-0 relative">
            {mobileTab === MobileTab.Org && (
              <div className="w-full h-full overflow-y-auto">
                <MobileOrgChart
                  nodeStates={replay.nodeStates}
                  spawnedAgents={replay.spawnedAgents}
                />
              </div>
            )}
            {mobileTab === MobileTab.Feed && (
              <div className="w-full h-full">
                <LiveFeed messages={replay.messages} />
              </div>
            )}
            {mobileTab === MobileTab.Stats && <MobileStatsPanel stats={replay.stats} />}
            {/* Mobile annotation */}
            <AnnotationBubble annotation={annotation} />
          </div>

          {/* Desktop Live Feed - 40% */}
          <div
            className="hidden md:flex flex-[2] min-h-0"
            style={{ borderLeft: "1px solid rgba(74,174,217,0.1)" }}
          >
            <LiveFeed messages={replay.messages} />
          </div>
        </div>

        {/* Desktop stats bar */}
        <div className="hidden md:flex">
          <StatsBar stats={replay.stats} />
        </div>

        {/* Finished overlay */}
        <CompletionOverlay
          finished={replay.finished}
          onReplay={handleReplay}
          stats={replay.stats}
          messageCount={replay.messages.length}
          spawnedCount={replay.spawnedAgents.length}
        />
      </div>

      {/* Task Control Bar */}
      <TaskControlBar onHire={handleHire} onEscalate={handleEscalate} onViewPlan={handleViewPlan} />

      {/* Agent Control Panel (slide-in) */}
      {selectedAgentId &&
        (() => {
          const agentState = getAgentControlState(selectedAgentId, replay.nodeStates);
          if (!agentState) return null;
          return (
            <AgentControlPanel
              agent={agentState}
              onClose={() => setSelectedAgentId(null)}
              onPauseResume={handlePauseResume}
              onReassign={handleReassign}
              onFire={handleFire}
              onModelChange={handleModelChange}
            />
          );
        })()}

      {/* Agent Context Menu */}
      {contextMenu && (
        <AgentContextMenu
          agentId={contextMenu.agentId}
          agentName={AGENTS[contextMenu.agentId]?.name || contextMenu.agentId}
          x={contextMenu.x}
          y={contextMenu.y}
          isPaused={!!agentOverrides[contextMenu.agentId]?.paused}
          onClose={() => setContextMenu(null)}
          onViewLogs={(id) => {
            eventList({ agent_id: id }).then(
              (events) => console.log(`[LiveView] logs for ${id}:`, events),
              (err: unknown) =>
                console.warn("[MCP] eventList failed:", err instanceof Error ? err.message : err),
            );
          }}
          onSendMessage={(id) => console.log(`[LiveView] send-message: ${id}`)}
          onReassign={(id) => {
            setContextMenu(null);
            setSelectedAgentId(id);
          }}
          onPauseResume={(id) => {
            handlePauseResume(id);
            setContextMenu(null);
          }}
          onFire={(id) => {
            handleFire(id);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
}
