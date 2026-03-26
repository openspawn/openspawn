import { useMemo, useState, useCallback } from "react";
import { PageHeader } from "@openspawn/dashboard-ui";
import { useAgents } from "../hooks";
import type { Agent } from "../hooks";
import { getStatusVariant, getLevelColor, useSidePanel } from "@openspawn/dashboard-data";
import { ConnectedAgentDetailPanel } from "../components/agent-panel-connected";

/* ── Types ─────────────────────────────────────────────────────── */

interface NodePosition {
  x: number;
  y: number;
}

interface LayoutNode {
  agent: Agent;
  pos: NodePosition;
}

interface Edge {
  from: string;
  to: string;
}

/* ── Constants ─────────────────────────────────────────────────── */

const NODE_RADIUS = 40;
const TIER_GAP_Y = 160;
const NODE_GAP_X = 160;

const STATUS_DOT_COLORS: Record<string, string> = {
  success: "#34d399", // emerald-400
  warning: "#fbbf24", // amber-400
  destructive: "#fb7185", // rose-400
  secondary: "#71717a", // gray-500
};

/* ── Layout ────────────────────────────────────────────────────── */

function layoutAgents(agents: Agent[], viewWidth: number): { nodes: LayoutNode[]; edges: Edge[] } {
  if (agents.length === 0) return { nodes: [], edges: [] };

  // Group into tiers by level
  const leadership = agents.filter((a) => a.level >= 9);
  const management = agents.filter((a) => a.level >= 7 && a.level < 9);
  const workers = agents.filter((a) => a.level < 7);

  const tiers = [leadership, management, workers].filter((t) => t.length > 0);

  const nodes: LayoutNode[] = [];
  const startY = 80;

  tiers.forEach((tier, tierIdx) => {
    const tierWidth = tier.length * NODE_GAP_X;
    const offsetX = (viewWidth - tierWidth) / 2 + NODE_GAP_X / 2;
    const y = startY + tierIdx * TIER_GAP_Y;

    tier.forEach((agent, i) => {
      nodes.push({
        agent,
        pos: { x: offsetX + i * NODE_GAP_X, y },
      });
    });
  });

  // Build edges: each tier connects down to the next tier
  const edges: Edge[] = [];
  for (let t = 0; t < tiers.length - 1; t++) {
    const upper = tiers[t];
    const lower = tiers[t + 1];
    for (const parent of upper) {
      for (const child of lower) {
        // If child has parentId, connect to parent; otherwise connect to all upper tier
        if (child.parentId) {
          if (child.parentId === parent.id) {
            edges.push({ from: parent.id, to: child.id });
          }
        } else {
          edges.push({ from: parent.id, to: child.id });
        }
      }
    }
  }

  // Deduplicate: if a child has no parent, it may get connected to many.
  // Keep only one connection per child if they have no explicit parent
  const childConnections = new Map<string, string[]>();
  for (const e of edges) {
    const arr = childConnections.get(e.to) || [];
    arr.push(e.from);
    childConnections.set(e.to, arr);
  }

  return { nodes, edges };
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Components ────────────────────────────────────────────────── */

function NetworkEdge({
  x1,
  y1,
  x2,
  y2,
  highlighted,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  highlighted: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={highlighted ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)"}
      strokeWidth={highlighted ? 2 : 1}
      strokeDasharray={highlighted ? undefined : "4 4"}
      style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
    />
  );
}

function NetworkNode({
  agent,
  x,
  y,
  highlighted,
  dimmed,
  onHover,
  onLeave,
  onClick,
}: {
  agent: Agent;
  x: number;
  y: number;
  highlighted: boolean;
  dimmed: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const statusVariant = getStatusVariant(agent.status);
  const statusColor = STATUS_DOT_COLORS[statusVariant];
  const levelColor = getLevelColor(agent.level);
  const initials = getInitials(agent.name);
  const isActive = agent.status.toLowerCase() === "active";

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        cursor: "pointer",
        opacity: dimmed ? 0.3 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Active glow */}
      {isActive && highlighted && (
        <circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 8}
          fill="none"
          stroke={statusColor}
          strokeWidth={2}
          opacity={0.4}
          style={{ filter: "blur(4px)" }}
        />
      )}

      {/* Node circle */}
      <circle
        cx={x}
        cy={y}
        r={NODE_RADIUS}
        fill={highlighted ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}
        stroke={highlighted ? levelColor : "rgba(255,255,255,0.1)"}
        strokeWidth={highlighted ? 2 : 1}
        style={{ transition: "fill 0.2s, stroke 0.2s" }}
      />

      {/* Initials */}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={18}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {initials}
      </text>

      {/* Status dot */}
      <circle
        cx={x + NODE_RADIUS - 6}
        cy={y - NODE_RADIUS + 6}
        r={6}
        fill={statusColor}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={2}
      />

      {/* Name */}
      <text
        x={x}
        y={y + NODE_RADIUS + 18}
        textAnchor="middle"
        fill="white"
        fontSize={13}
        fontWeight={500}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {agent.name}
      </text>

      {/* Role */}
      <text
        x={x}
        y={y + NODE_RADIUS + 34}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {agent.role}
      </text>

      {/* Level badge */}
      <rect
        x={x - 18}
        y={y + NODE_RADIUS + 40}
        width={36}
        height={18}
        rx={9}
        fill={levelColor}
        opacity={0.2}
      />
      <text
        x={x}
        y={y + NODE_RADIUS + 52}
        textAnchor="middle"
        fill={levelColor}
        fontSize={10}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        L{agent.level}
      </text>
    </g>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export function NetworkPage() {
  const { agents, loading, error } = useAgents();
  const { openSidePanel, closeSidePanel } = useSidePanel();
  const openAgentPanel = (id: string) => {
    openSidePanel(<ConnectedAgentDetailPanel agentId={id} onClose={closeSidePanel} />, {
      width: 540,
    });
  };

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const viewWidth = 900;

  const { nodes, edges } = useMemo(() => layoutAgents(agents, viewWidth), [agents, viewWidth]);

  // Compute total SVG height from node positions
  const svgHeight = useMemo(() => {
    if (nodes.length === 0) return 400;
    const maxY = Math.max(...nodes.map((n) => n.pos.y));
    return maxY + NODE_RADIUS + 80; // padding below lowest tier
  }, [nodes]);

  // Build adjacency for hover highlighting
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!map.has(e.from)) map.set(e.from, new Set());
      if (!map.has(e.to)) map.set(e.to, new Set());
      map.get(e.from)?.add(e.to);
      map.get(e.to)?.add(e.from);
    }
    return map;
  }, [edges]);

  const isHighlighted = useCallback(
    (id: string) => {
      if (!hoveredId) return false;
      return id === hoveredId || (adjacency.get(hoveredId)?.has(id) ?? false);
    },
    [hoveredId, adjacency],
  );

  const isEdgeHighlighted = useCallback(
    (from: string, to: string) => {
      if (!hoveredId) return false;
      return hoveredId === from || hoveredId === to;
    },
    [hoveredId],
  );

  const posMap = useMemo(() => {
    const m = new Map<string, NodePosition>();
    for (const n of nodes) m.set(n.agent.id, n.pos);
    return m;
  }, [nodes]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Network" description="Agent network topology" />

      <div className="overflow-x-auto">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-6 min-w-[320px]">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 py-8 text-center">
              Failed to load agents: {String(error)}
            </p>
          )}

          {!loading && !error && agents.length === 0 && (
            <p className="text-sm text-white/40 py-8 text-center">No agents found.</p>
          )}

          {!loading && !error && agents.length > 0 && (
            <div className="flex justify-center">
              <svg
                viewBox={`0 0 ${viewWidth} ${svgHeight}`}
                width="100%"
                style={{ maxWidth: viewWidth, height: "auto" }}
                className="select-none"
              >
                {/* Edges */}
                {edges.map((e) => {
                  const fromPos = posMap.get(e.from);
                  const toPos = posMap.get(e.to);
                  if (!fromPos || !toPos) return null;
                  return (
                    <NetworkEdge
                      key={`${e.from}-${e.to}`}
                      x1={fromPos.x}
                      y1={fromPos.y + NODE_RADIUS}
                      x2={toPos.x}
                      y2={toPos.y - NODE_RADIUS}
                      highlighted={isEdgeHighlighted(e.from, e.to)}
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map(({ agent, pos }) => (
                  <NetworkNode
                    key={agent.id}
                    agent={agent}
                    x={pos.x}
                    y={pos.y}
                    highlighted={isHighlighted(agent.id)}
                    dimmed={hoveredId !== null && !isHighlighted(agent.id)}
                    onHover={() => setHoveredId(agent.id)}
                    onLeave={() => setHoveredId(null)}
                    onClick={() => openAgentPanel(agent.id)}
                  />
                ))}
              </svg>
            </div>
          )}

          {/* Legend */}
          {!loading && agents.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_DOT_COLORS.success }}
                />
                Active
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_DOT_COLORS.warning }}
                />
                Idle
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_DOT_COLORS.secondary }}
                />
                Inactive
              </span>
              <span className="mx-2 h-3 w-px bg-white/10" />
              <span className="text-white/30">Click a node to view details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
