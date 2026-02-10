/**
 * Org Chart — ReactFlow tree layout showing teams → sub-teams → agents.
 * Features: animated edge pulses, click-to-detail, presence glow on active agents.
 */
import { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react';
import { useDemo } from '../demo/DemoProvider';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle,
  Position,
  BackgroundVariant,
  BaseEdge,
  getSmoothStepPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react';
import { motion } from 'framer-motion';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';
import {
  Crown,
  Code2,
  DollarSign,
  Megaphone,
  Server,
  Monitor,
  ShieldCheck,
  Send,
  Handshake,
  PenTool,
  BarChart3,
  UserPlus,
  Heart,
  MessageCircle,
  Wrench,
  Headphones,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { teams, type Team, getTeamColor, getSubTeams } from '../demo/teams';
import { useTeamStats } from '../hooks/use-teams';
import { useAgents, type Agent } from '../hooks/use-agents';
import { getAgentAvatarUrl } from '../lib/avatar';

// ── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Crown, Code2, DollarSign, Megaphone, Users, Headphones,
  Server, Monitor, ShieldCheck, Send, Handshake,
  PenTool, BarChart3, UserPlus, Heart, MessageCircle, Wrench,
};

// ── ELK instance ────────────────────────────────────────────────────────────
const elk = new ELK();

async function layoutElements(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.layered.spacing.edgeNodeBetweenLayers': '20',
      'elk.spacing.componentComponent': '50',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: nodes.map((n) => {
      const isTeam = (n.data as Record<string, unknown>).isTeam;
      return {
        id: n.id,
        width: isTeam ? 180 : 140,
        height: isTeam ? 72 : 64,
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layout = await elk.layout(elkGraph);

  const layoutedNodes = nodes.map((node) => {
    const elkNode = layout.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── Team Node ───────────────────────────────────────────────────────────────
interface TeamNodeData extends Record<string, unknown> {
  isTeam: true;
  teamId: string;
  name: string;
  icon: string;
  color: string;
  agentCount: number;
}

function TeamNodeContent({ data }: { data: TeamNodeData }) {
  const color = getTeamColor(data.color);
  const Icon = ICON_MAP[data.icon] ?? Users;
  const stats = useTeamStats(data.teamId);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative cursor-pointer"
      style={{ width: 180, height: 72 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ background: color, width: 10, height: 10, border: '2px solid #1e1e2e' }}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full h-full flex items-center gap-3 rounded-xl border-2 px-4 hover:brightness-110 transition-all"
        style={{
          borderColor: color,
          backgroundColor: `${color}15`,
          boxShadow: `0 0 24px ${color}25`,
        }}
      >
        <div
          className="flex items-center justify-center rounded-lg p-2"
          style={{ backgroundColor: `${color}30`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground truncate">{data.name}</div>
          <div className="text-[10px] text-zinc-400">
            {data.agentCount} agent{data.agentCount !== 1 ? 's' : ''}
          </div>
        </div>
      </motion.div>
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ background: color, width: 10, height: 10, border: '2px solid #1e1e2e' }}
      />

      {/* Hover tooltip with aggregate stats */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-[72px] left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <span className="text-zinc-400">Active:</span>
            <span className="text-emerald-400 font-medium">{stats.activeCount}/{stats.agentCount}</span>
            <span className="text-zinc-400">Credits:</span>
            <span className="text-amber-400 font-medium">{stats.totalCredits.toLocaleString()}</span>
            <span className="text-zinc-400">Success:</span>
            <span className="text-cyan-400 font-medium">{stats.taskCompletionRate}%</span>
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900 border-l border-t border-zinc-700" />
        </motion.div>
      )}
    </div>
  );
}

function TeamNode({ data }: NodeProps) {
  return <TeamNodeContent data={data as unknown as TeamNodeData} />;
}

// ── Agent Node ──────────────────────────────────────────────────────────────
interface AgentNodeData extends Record<string, unknown> {
  isTeam: false;
  label: string;
  agentId: string;
  agentDbId: string; // the database `id` for the detail panel
  level: number;
  status: string;
  isLead: boolean;
  teamColor: string;
}

function AgentOrgNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const teamColor = getTeamColor(d.teamColor);
  const avatarUrl = getAgentAvatarUrl(d.agentId, d.level, 32);
  const isActive = d.status === 'ACTIVE';
  const statusColor = isActive
    ? '#22c55e'
    : d.status === 'PENDING'
      ? '#fbbf24'
      : '#ef4444';

  return (
    <div className="relative cursor-pointer" style={{ width: 140, height: 64 }}>
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ background: teamColor, width: 8, height: 8, border: '2px solid #1e1e2e' }}
      />

      {/* Active glow ring */}
      {isActive && (
        <motion.div
          className="absolute -inset-1 rounded-2xl pointer-events-none"
          style={{ boxShadow: `0 0 12px 2px ${statusColor}50` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-full h-full flex items-center gap-2 rounded-xl border px-3 hover:brightness-110 transition-all"
        style={{
          borderColor: d.isLead ? '#f59e0b' : `${teamColor}60`,
          backgroundColor: d.isLead ? 'rgba(245,158,11,0.08)' : `${teamColor}08`,
        }}
      >
        {/* Status dot */}
        <div
          className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: statusColor }}
        />

        {/* Lead crown */}
        {d.isLead && (
          <div className="absolute -top-2 -right-2">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
          </div>
        )}

        {avatarUrl ? (
          <img src={avatarUrl} alt={d.label} className="w-8 h-8 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs flex-shrink-0">
            🤖
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-foreground truncate">{d.label}</div>
          <div className="text-[10px] text-zinc-400">L{d.level}</div>
        </div>
      </motion.div>
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ background: teamColor, width: 8, height: 8, border: '2px solid #1e1e2e' }}
      />
    </div>
  );
}

// ── Custom animated edge ─────────────────────────────────────────────────────
function OrgEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = (data as Record<string, unknown> | undefined)?.animated === true;
  const edgeColor = (style as Record<string, unknown>)?.stroke as string || '#64748b';

  return (
    <g>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...style, strokeWidth: 2, opacity: 0.5 }}
        markerEnd={markerEnd}
      />
      {/* Animated pulse particle along the edge */}
      {isAnimated && (
        <>
          <circle r="3" fill={edgeColor} opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="6" fill={edgeColor} opacity="0.3">
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
    </g>
  );
}

const nodeTypes = { team: TeamNode, agentOrg: AgentOrgNode };
const edgeTypes = { orgEdge: OrgEdge };

// ── Build nodes & edges ─────────────────────────────────────────────────────
function buildOrgGraph(
  allTeams: Team[],
  agents: Agent[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Count agents per team
  const agentCountMap = new Map<string, number>();
  agents.forEach((a) => {
    const tid = a.teamId;
    if (tid) agentCountMap.set(tid, (agentCountMap.get(tid) ?? 0) + 1);
  });

  // Add team nodes
  allTeams.forEach((team) => {
    const subs = getSubTeams(team.id);
    const directCount = agentCountMap.get(team.id) ?? 0;
    const subCount = subs.reduce((s, sub) => s + (agentCountMap.get(sub.id) ?? 0), 0);

    nodes.push({
      id: team.id,
      type: 'team',
      position: { x: 0, y: 0 },
      data: {
        isTeam: true,
        teamId: team.id,
        name: team.name,
        icon: team.icon,
        color: team.color,
        agentCount: directCount + subCount,
      } as TeamNodeData,
    });

    // Edge from parent team to this sub-team
    if (team.parentTeamId) {
      const parentColor = allTeams.find((t) => t.id === team.parentTeamId)?.color ?? 'slate';
      edges.push({
        id: `e-${team.parentTeamId}-${team.id}`,
        source: team.parentTeamId,
        target: team.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'orgEdge',
        style: { stroke: getTeamColor(parentColor) },
      });
    }
  });

  // Add agent nodes for leaf teams (teams with no sub-teams)
  allTeams.forEach((team) => {
    const subs = getSubTeams(team.id);
    if (subs.length > 0) return; // skip parent teams; agents are shown under sub-teams

    const teamAgents = agents.filter(
      (a) => a.teamId === team.id,
    );
    const color = getTeamColor(team.color);

    teamAgents.forEach((agent) => {
      const nodeId = `agent-${agent.id}`;
      nodes.push({
        id: nodeId,
        type: 'agentOrg',
        position: { x: 0, y: 0 },
        data: {
          isTeam: false,
          label: agent.name,
          agentId: agent.agentId,
          agentDbId: agent.id,
          level: agent.level,
          status: agent.status,
          isLead: agent.id === team.leadAgentId,
          teamColor: team.color,
        } as AgentNodeData,
      });

      edges.push({
        id: `e-${team.id}-${nodeId}`,
        source: team.id,
        target: nodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'orgEdge',
        style: { stroke: color },
      });
    });
  });

  // Also add agents for parent teams that have agents directly (e.g. Executive, EPD leads)
  allTeams.forEach((team) => {
    const subs = getSubTeams(team.id);
    if (subs.length === 0) return; // already handled above

    const teamAgents = agents.filter(
      (a) => a.teamId === team.id,
    );
    const color = getTeamColor(team.color);

    teamAgents.forEach((agent) => {
      const nodeId = `agent-${agent.id}`;
      nodes.push({
        id: nodeId,
        type: 'agentOrg',
        position: { x: 0, y: 0 },
        data: {
          isTeam: false,
          label: agent.name,
          agentId: agent.agentId,
          agentDbId: agent.id,
          level: agent.level,
          status: agent.status,
          isLead: agent.id === team.leadAgentId,
          teamColor: team.color,
        } as AgentNodeData,
      });

      edges.push({
        id: `e-${team.id}-${nodeId}`,
        source: team.id,
        target: nodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'orgEdge',
        style: { stroke: color },
      });
    });
  });

  return { nodes, edges };
}

// ── Inner component ─────────────────────────────────────────────────────────
function OrgChartInner({ className, onAgentClick, onTeamClick }: { className?: string; onAgentClick?: (agentId: string) => void; onTeamClick?: (teamId: string) => void }) {
  const { agents, loading } = useAgents();
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [isLayouted, setIsLayouted] = useState(false);
  const baseEdgesRef = useRef<Edge[]>([]);

  // Only re-layout when agent IDs change (add/remove), not on every data update
  const agentIds = useMemo(
    () => agents.map((a) => a.agentId).sort().join(','),
    [agents],
  );

  useEffect(() => {
    if (loading) return;

    const { nodes: rawNodes, edges: rawEdges } = buildOrgGraph(teams, agents);

    setIsLayouted(false);
    layoutElements(rawNodes, rawEdges).then(({ nodes: ln, edges: le }) => {
      setNodes(ln);
      baseEdgesRef.current = le;
      setEdges(le);
      setIsLayouted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentIds, loading, setNodes, setEdges]);

  // Animate random edges to simulate message flow (scales with demo speed)
  const { speed } = useDemo();

  useEffect(() => {
    if (!isLayouted || baseEdgesRef.current.length === 0) return;

    // Scale animation timing with speed — faster speed = more frequent + shorter animations
    const intervalMs = Math.max(500, 3000 / speed);
    const displayMs = Math.max(300, 2000 / speed);
    // More simultaneous animations at higher speeds
    const animCount = speed >= 10 ? 4 : speed >= 5 ? 3 : 2;

    const interval = setInterval(() => {
      const base = baseEdgesRef.current;
      const animatedIds = new Set<string>();
      const count = Math.min(animCount, base.length);
      while (animatedIds.size < count) {
        animatedIds.add(base[Math.floor(Math.random() * base.length)].id);
      }

      setEdges((prev) =>
        prev.map((e) => {
          const shouldAnimate = animatedIds.has(e.id);
          const wasAnimated = (e.data as any)?.animated;
          if (shouldAnimate === wasAnimated) return e;
          return { ...e, data: { ...((e.data as object) || {}), animated: shouldAnimate } };
        }),
      );

      setTimeout(() => {
        setEdges((prev) =>
          prev.map((e) => {
            if (!(e.data as any)?.animated) return e;
            return { ...e, data: { ...((e.data as object) || {}), animated: false } };
          }),
        );
      }, displayMs);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isLayouted, setEdges, speed]);

  // Handle node clicks → open agent detail panel
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const d = node.data as Record<string, unknown>;
      if (d.isTeam && d.teamId && onTeamClick) {
        onTeamClick(d.teamId as string);
      } else if (!d.isTeam && d.agentDbId && onAgentClick) {
        onAgentClick(d.agentDbId as string);
      }
    },
    [onAgentClick, onTeamClick],
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-zinc-400 animate-pulse">Loading org chart…</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={isLayouted ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'orgEdge',
          style: { stroke: '#64748b', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
        <Controls className="!bg-zinc-800 !border-zinc-700 !rounded-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-foreground [&>button:hover]:!bg-zinc-700" />
      </ReactFlow>
    </div>
  );
}

// ── Public component (wrapped in provider) ──────────────────────────────────
export function OrgChart({ className, onAgentClick, onTeamClick }: { className?: string; onAgentClick?: (agentId: string) => void; onTeamClick?: (teamId: string) => void }) {
  return (
    <ReactFlowProvider>
      <OrgChartInner className={className} onAgentClick={onAgentClick} onTeamClick={onTeamClick} />
    </ReactFlowProvider>
  );
}
