import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AGENTS, type NodeStatus, type SpawnedAgent } from './replay-data';

// ── Node positions (hardcoded tree) ──────────────────────────────────────────

const CX = 600; // center x
const LY = [0, 120, 240, 360]; // layer y positions

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
  { id: 'pearl-krabs', x: CX - 150, y: LY[2], parent: 'squidward-tentacles' },
  { id: 'perch-perkins', x: CX - 25, y: LY[2], parent: 'squidward-tentacles' },
  { id: 'barnacle-boy', x: CX + 150, y: LY[2], parent: 'squidward-tentacles' },
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

// ── Custom Node ──────────────────────────────────────────────────────────────

interface LiveNodeData extends Record<string, unknown> {
  agentId: string;
  emoji: string;
  name: string;
  status: NodeStatus;
  queueBadge?: number;
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

  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <Handle id="top" type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Status ring */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{
          border: `3px solid ${ringColor}`,
          boxShadow: isActive ? `0 0 12px ${ringColor}60, 0 0 24px ${ringColor}20` : 'none',
          animation: isPulsing ? 'pulse 1.5s ease-in-out infinite' : undefined,
        }}
      />

      {/* Inner content */}
      <div className="w-full h-full rounded-full flex flex-col items-center justify-center bg-[#0a1628] relative">
        <span className="text-2xl leading-none">{d.emoji}</span>
        <span className="text-[9px] text-white/60 font-medium mt-0.5 truncate max-w-[70px] text-center leading-tight">{d.name}</span>
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

const nodeTypes = { liveAgent: LiveAgentNode };
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
        name: agent?.name ?? n.id,
        status: state.status,
        queueBadge: state.queueBadge,
      } satisfies LiveNodeData,
    };
  });

  // Add spawned sous-chef nodes — 2 rows of 10, centered under SpongeBob
  const SPONGEBOB_X = CX - 400;
  const SPAWN_Y1 = LY[3] + 100; // below the existing layer 3
  const SPAWN_Y2 = SPAWN_Y1 + 70;
  const SPAWN_SPACING = 70;
  const ROW_SIZE = 10;

  for (let i = 0; i < spawnedAgents.length; i++) {
    const sa = spawnedAgents[i];
    const row = Math.floor(i / ROW_SIZE);
    const col = i % ROW_SIZE;
    const rowWidth = (Math.min(ROW_SIZE, spawnedAgents.length - row * ROW_SIZE) - 1) * SPAWN_SPACING;
    const x = SPONGEBOB_X - rowWidth / 2 + col * SPAWN_SPACING;
    const y = row === 0 ? SPAWN_Y1 : SPAWN_Y2;
    const state = nodeStates[sa.id] || { status: 'working' as NodeStatus };

    nodes.push({
      id: sa.id,
      type: 'liveAgent',
      position: { x: x - 40, y },
      data: {
        agentId: sa.id,
        emoji: sa.emoji,
        name: sa.name,
        status: state.status,
      } satisfies LiveNodeData,
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

  // Add edges for spawned agents
  for (const sa of spawnedAgents) {
    const edgeId = `e-${sa.parentId}-${sa.id}`;
    const key = `${sa.parentId}-${sa.id}`;
    edges.push({
      id: edgeId,
      source: sa.parentId,
      target: sa.id,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'liveEdge',
      data: { animations: edgeAnimMap.get(key) || [], isReassigned: false },
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
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
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
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
