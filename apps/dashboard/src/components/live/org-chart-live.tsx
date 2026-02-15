import { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AGENTS, type NodeStatus, type SpawnedAgent } from './replay-data';

// ── Node positions (hardcoded tree) ──────────────────────────────────────────

const CX = 600; // center x
const LY = [0, 160, 330, 500]; // layer y positions

interface NodeDef {
  id: string;
  x: number;
  y: number;
  parent?: string;
}

const NODE_LAYOUT: NodeDef[] = [
  // Layer 0: CEO
  { id: 'mr-krabs', x: CX, y: LY[0] },
  // Layer 1: VPs
  { id: 'spongebob-squarepants', x: CX - 400, y: LY[1], parent: 'mr-krabs' },
  { id: 'squidward-tentacles', x: CX, y: LY[1], parent: 'mr-krabs' },
  { id: 'squilliam-fancyson', x: CX + 400, y: LY[1], parent: 'mr-krabs' },
  // Layer 2: SpongeBob's reports (The Kitchen)
  { id: 'sandy-cheeks', x: CX - 500, y: LY[2], parent: 'spongebob-squarepants' },
  { id: 'karen', x: CX - 300, y: LY[2], parent: 'spongebob-squarepants' },
  // Layer 2: Squidward's reports (The Register)
  { id: 'pearl-krabs', x: CX - 180, y: LY[2], parent: 'squidward-tentacles' },
  { id: 'perch-perkins', x: CX, y: LY[2], parent: 'squidward-tentacles' },
  { id: 'barnacle-boy', x: CX + 180, y: LY[2], parent: 'squidward-tentacles' },
  // Layer 2: Squilliam's reports (The Vault)
  { id: 'plankton', x: CX + 350, y: LY[2], parent: 'squilliam-fancyson' },
  { id: 'mrs-puff', x: CX + 475, y: LY[2], parent: 'squilliam-fancyson' },
  // Layer 3: Sandy's reports
  { id: 'patrick-star', x: CX - 575, y: LY[3], parent: 'sandy-cheeks' },
  { id: 'gary', x: CX - 500, y: LY[3], parent: 'sandy-cheeks' },
  { id: 'plankton-jr', x: CX - 425, y: LY[3], parent: 'sandy-cheeks' },
  // Layer 3: Karen's report
  { id: 'mermaid-man', x: CX - 300, y: LY[3], parent: 'karen' },
  // Layer 3: Perch Perkins' reports
  { id: 'larry-the-lobster', x: CX - 100, y: LY[3], parent: 'perch-perkins' },
  { id: 'bubble-bass', x: CX - 25, y: LY[3], parent: 'perch-perkins' },
  { id: 'dennis', x: CX + 50, y: LY[3], parent: 'perch-perkins' },
  // Layer 3: Barnacle Boy's reports
  { id: 'flying-dutchman', x: CX + 125, y: LY[3], parent: 'barnacle-boy' },
  { id: 'fred-1', x: CX + 200, y: LY[3], parent: 'barnacle-boy' },
  { id: 'fred-2', x: CX + 250, y: LY[3], parent: 'barnacle-boy' },
  { id: 'fred-3', x: CX + 300, y: LY[3], parent: 'barnacle-boy' },
];

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentNodeState {
  status: NodeStatus;
  queueBadge?: number;
}

export interface EdgeAnimation {
  id: string;
  from: string;
  to: string;
  color: string; // cyan, red, white
  timestamp: number;
}

interface OrgChartLiveProps {
  nodeStates: Record<string, AgentNodeState>;
  edgeAnimations: EdgeAnimation[];
  reassignedEdges: Array<{ from: string; to: string }>;
  spawnedAgents: SpawnedAgent[];
}

// ── Custom Nodes ─────────────────────────────────────────────────────────────

interface LiveNodeData extends Record<string, unknown> {
  agentId: string;
  emoji: string;
  avatarUrl?: string;
  name: string;
  status: NodeStatus;
  queueBadge?: number;
}

interface PoolNodeData extends Record<string, unknown> {
  title: string;
  count: number;
  throughput?: number; // 0-100 percentage
}

function LiveAgentNode({ data }: NodeProps) {
  const d = data as unknown as LiveNodeData;
  const statusColors: Record<NodeStatus, string> = {
    idle: '#22c55e',
    working: '#22d3ee',
    busy: '#eab308',
    overwhelmed: '#ef4444',
  };
  const ringColor = statusColors[d.status];
  const isActive = d.status !== 'idle';
  const isPulsing = d.status === 'overwhelmed' || d.status === 'busy';

  // Animation based on status
  const getAnimation = () => {
    if (d.status === 'overwhelmed') return 'jitter 0.3s ease-in-out infinite';
    if (d.status === 'working') return 'bob 1.5s ease-in-out infinite';
    return 'idle-pulse 3s ease-in-out infinite';
  };

  // Stagger delay for idle animation based on agent name hash
  const getAnimationDelay = () => {
    if (d.status !== 'idle') return '0s';
    const hash = d.agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `${(hash % 3000) / 1000}s`;
  };

  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Status ring */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{
          border: `3px solid ${ringColor}`,
          boxShadow: isActive
            ? `0 0 ${d.status === 'working' ? '16px' : '12px'} ${ringColor}60, 0 0 24px ${ringColor}20`
            : 'none',
          animation: isPulsing ? 'ring-pulse 1.5s ease-in-out infinite' : undefined,
        }}
      />

      {/* Inner content */}
      <div
        className="w-full h-full rounded-full flex flex-col items-center justify-center bg-[#0a1628] relative overflow-hidden"
        style={{
          animation: getAnimation(),
          animationDelay: getAnimationDelay(),
        }}
      >
        {d.avatarUrl ? (
          <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-2xl leading-none">{d.emoji}</span>
        )}
      </div>

      {/* Name label below */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[9px] text-white/60 font-medium">{d.name}</span>
      </div>

      {/* Queue badge */}
      {d.queueBadge != null && d.queueBadge > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {d.queueBadge > 999 ? `${(d.queueBadge / 1000).toFixed(1)}k` : d.queueBadge}
        </div>
      )}

      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
}

function PoolNode({ data }: NodeProps) {
  const d = data as unknown as PoolNodeData;
  const throughput = d.throughput ?? 75;

  return (
    <div className="relative" style={{ width: 160, height: 80 }}>
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Pool container */}
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-cyan-900/40 to-cyan-950/60 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20 flex flex-col items-center justify-center px-3 py-2">
        {/* Title */}
        <div className="text-sm font-semibold text-cyan-300 mb-1">{d.title}</div>

        {/* Count */}
        <div className="text-xs text-white/80 font-medium mb-2">⭐×{d.count} active</div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500 rounded-full"
            style={{
              width: `${throughput}%`,
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.5)',
            }}
          />
        </div>
      </div>

      <Handle id="bottom" type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
}

// ── Custom Edge ──────────────────────────────────────────────────────────────

function LiveEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8 });

  const anims = ((data as Record<string, unknown>)?.animations as EdgeAnimation[]) || [];
  const isReassigned = (data as Record<string, unknown>)?.isReassigned === true;

  return (
    <g>
      {/* Base edge with subtle glow */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isReassigned ? '#22d3ee' : 'rgba(34, 211, 238, 0.15)',
          strokeWidth: isReassigned ? 2.5 : 1.5,
          filter: isReassigned ? 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))' : undefined,
        }}
      />
      {/* Animated particles */}
      {anims.map((anim) => (
        <g key={anim.id}>
          <circle r="4" fill={anim.color} opacity="0.9">
            <animateMotion dur="1.2s" repeatCount="1" path={edgePath} fill="freeze" />
          </circle>
          <circle r="8" fill={anim.color} opacity="0.2">
            <animateMotion dur="1.2s" repeatCount="1" path={edgePath} fill="freeze" />
          </circle>
        </g>
      ))}
    </g>
  );
}

const nodeTypes = { liveAgent: LiveAgentNode, poolNode: PoolNode };
const edgeTypes = { liveEdge: LiveEdge };

// ── Build graph ──────────────────────────────────────────────────────────────

function buildGraph(
  nodeStates: Record<string, AgentNodeState>,
  edgeAnimations: EdgeAnimation[],
  reassignedEdges: Array<{ from: string; to: string }>,
  spawnedAgents: SpawnedAgent[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = NODE_LAYOUT.map(n => {
    const agent = AGENTS[n.id];
    const state = nodeStates[n.id] || { status: 'idle' as NodeStatus };
    return {
      id: n.id,
      type: 'liveAgent',
      position: { x: n.x - 40, y: n.y },
      data: {
        agentId: n.id,
        emoji: agent?.emoji ?? '🐟',
        avatarUrl: agent?.avatarUrl,
        name: agent?.name ?? n.id,
        status: state.status,
        queueBadge: state.queueBadge,
      } satisfies LiveNodeData,
    };
  });

  // Add pool node for spawned sous-chefs (if any)
  if (spawnedAgents.length > 0) {
    const SPONGEBOB_X = CX - 400;
    const SPAWN_Y = LY[3] + 100; // below the existing layer 3
    
    // Calculate throughput based on working agents
    const workingCount = spawnedAgents.filter(sa => {
      const state = nodeStates[sa.id];
      return state?.status === 'working' || state?.status === 'busy';
    }).length;
    const throughput = Math.min(100, (workingCount / spawnedAgents.length) * 100);

    nodes.push({
      id: 'grill-station-pool',
      type: 'poolNode',
      position: { x: SPONGEBOB_X - 80, y: SPAWN_Y },
      data: {
        title: '🍳 Grill Station',
        count: spawnedAgents.length,
        throughput,
      } satisfies PoolNodeData,
    });
  }

  // Build edge animation lookup
  const edgeAnimMap = new Map<string, EdgeAnimation[]>();
  for (const anim of edgeAnimations) {
    const key = `${anim.from}-${anim.to}`;
    const reverseKey = `${anim.to}-${anim.from}`;
    if (!edgeAnimMap.has(key) && !edgeAnimMap.has(reverseKey)) {
      edgeAnimMap.set(key, []);
    }
    const arr = edgeAnimMap.get(key) || edgeAnimMap.get(reverseKey);
    arr?.push(anim);
  }

  const reassignedSet = new Set(reassignedEdges.map(e => `${e.from}-${e.to}`));

  const edges: Edge[] = [];
  for (const n of NODE_LAYOUT) {
    if (!n.parent) continue;
    const edgeId = `e-${n.parent}-${n.id}`;
    const key = `${n.parent}-${n.id}`;
    edges.push({
      id: edgeId,
      source: n.parent,
      target: n.id,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'liveEdge',
      data: {
        animations: edgeAnimMap.get(key) || [],
        isReassigned: reassignedSet.has(key),
      },
    });
  }

  // Add edge from SpongeBob to pool node (aggregates all spawn animations)
  if (spawnedAgents.length > 0) {
    const poolParent = 'spongebob-squarepants';
    const poolKey = `${poolParent}-grill-station-pool`;
    
    // Aggregate all spawn animations to show on the pool edge
    const poolAnimations: EdgeAnimation[] = [];
    for (const sa of spawnedAgents) {
      const key = `${sa.parentId}-${sa.id}`;
      const anims = edgeAnimMap.get(key) || [];
      poolAnimations.push(...anims);
    }

    edges.push({
      id: `e-${poolParent}-grill-station-pool`,
      source: poolParent,
      target: 'grill-station-pool',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'liveEdge',
      data: { animations: poolAnimations, isReassigned: false },
    });
  }

  // Add reassigned edges that aren't in the base tree
  for (const re of reassignedEdges) {
    const edgeId = `e-${re.from}-${re.to}`;
    if (!edges.find(e => e.id === edgeId)) {
      edges.push({
        id: edgeId,
        source: re.from,
        target: re.to,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'liveEdge',
        data: { animations: edgeAnimMap.get(`${re.from}-${re.to}`) || [], isReassigned: true },
      });
    }
  }

  return { nodes, edges };
}

// ── Component ────────────────────────────────────────────────────────────────

function OrgChartInner({ nodeStates, edgeAnimations, reassignedEdges, spawnedAgents }: OrgChartLiveProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(nodeStates, edgeAnimations, reassignedEdges, spawnedAgents),
    [nodeStates, edgeAnimations, reassignedEdges, spawnedAgents],
  );

  const { fitView, setCenter } = useReactFlow();
  const prevSpawnCount = useRef(0);
  const zoomResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Zoom into pool node area when spawning starts, zoom back out after
  useEffect(() => {
    const count = spawnedAgents.length;
    if (count > prevSpawnCount.current && count >= 1) {
      // Zoom to the Grill Station pool node area
      // Pool is at x=CX-400-80=120, y=LY[3]+100=600
      clearTimeout(zoomResetTimer.current);
      setCenter(120, 580, { zoom: 1.4, duration: 800 });

      // After 3 seconds (or when spawning stops), zoom back to full view
      zoomResetTimer.current = setTimeout(() => {
        fitView({ padding: 0.15, duration: 800 });
      }, 3000);
    }
    prevSpawnCount.current = count;
  }, [spawnedAgents.length, setCenter, fitView]);

  // On first render and when no spawns, fit the full view
  const onInit = useCallback(() => {
    fitView({ padding: 0.15, duration: 0 });
  }, [fitView]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      />
      <style>{`
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes idle-pulse {
          0%, 100% { transform: scale(1.0); }
          50% { transform: scale(1.03); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes jitter {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1.5px); }
          75% { transform: translateX(1.5px); }
        }
      `}</style>
    </div>
  );
}

export function OrgChartLive(props: OrgChartLiveProps) {
  return (
    <ReactFlowProvider>
      <OrgChartInner {...props} />
    </ReactFlowProvider>
  );
}
