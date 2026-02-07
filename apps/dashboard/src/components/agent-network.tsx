import { useEffect, useState, useMemo, useCallback, createContext, useContext } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position,
  BackgroundVariant,
  BaseEdge,
  getSmoothStepPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import ELK from "elkjs/lib/elk.bundled.js";
import "@xyflow/react/dist/style.css";
import { useDemo } from "../demo";

// Context to share active delegations and speed with edge components
interface TaskDelegation {
  id: string;
  fromId: string;
  toId: string;
  taskTitle: string;
  startTime: number;
}
interface DelegationContextValue {
  delegations: TaskDelegation[];
  speed: number;
}
const DelegationContext = createContext<DelegationContextValue>({ delegations: [], speed: 1 });

// ELK instance for layout
const elk = new ELK();

// Auto-layout using ELK (async)
async function getLayoutedElements(nodes: Node[], edges: Edge[]): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 160,
      height: 100,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(elkGraph);

  const layoutedNodes = nodes.map((node) => {
    const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: elkNode?.x ?? 0,
        y: elkNode?.y ?? 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Level colors
const levelColors: Record<number, string> = {
  10: "#f472b6", // COO - pink
  9: "#a78bfa", // HR - purple
  8: "#22c55e", // Manager - green
  7: "#22c55e",
  6: "#06b6d4", // Senior - cyan
  5: "#06b6d4",
  4: "#fbbf24", // Worker - yellow
  3: "#fbbf24",
  2: "#71717a", // Probation - gray
  1: "#71717a",
};

const roleLabels: Record<string, string> = {
  coo: "COO",
  hr: "HR",
  manager: "Manager",
  senior: "Senior",
  worker: "Worker",
};

interface AgentNodeData {
  label: string;
  role: string;
  level: number;
  status: "active" | "pending" | "paused" | "suspended";
  credits: number;
  isHuman?: boolean;
  domain?: string;
  tasksCompleted?: number;
  isSpawning?: boolean;
  isDespawning?: boolean;
}

// Custom node component with spawn/despawn animations
function AgentNode({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const nodeData = data as AgentNodeData;
  const color = nodeData.isHuman ? "#06b6d4" : levelColors[nodeData.level] || "#71717a";
  
  // Determine if this node is spawning or despawning
  const isSpawning = nodeData.isSpawning;
  const isDespawning = nodeData.isDespawning;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDespawning ? 0 : 1, 
        opacity: isDespawning ? 0 : 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      
      {/* Spawn glow effect */}
      {isSpawning && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2, opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: "#22c55e", filter: "blur(20px)" }}
        />
      )}
      
      {/* Despawn fade effect */}
      {isDespawning && (
        <motion.div
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: "#ef4444", filter: "blur(20px)" }}
        />
      )}
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          borderColor: isSpawning ? ["#22c55e", color] : color,
        }}
        transition={{ duration: 0.5 }}
        className={`
          relative px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 min-w-[100px] sm:min-w-[140px]
          ${selected ? "shadow-lg shadow-purple-500/30" : ""}
          ${isSpawning ? "shadow-lg shadow-green-500/50" : ""}
          ${isDespawning ? "shadow-lg shadow-red-500/30 opacity-60" : ""}
        `}
        style={{
          borderColor: color,
          backgroundColor: `${color}15`,
        }}
      >
        {/* Level badge */}
        {!nodeData.isHuman && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute -top-2 -right-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            L{nodeData.level}
          </motion.div>
        )}

        {/* Status indicator */}
        <motion.div
          animate={{
            scale: nodeData.status === "active" ? [1, 1.2, 1] : 1,
            opacity: nodeData.status === "active" ? 1 : 0.5,
          }}
          transition={{ repeat: nodeData.status === "active" ? Infinity : 0, duration: 2 }}
          className="absolute -top-1 -left-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
          style={{
            backgroundColor:
              nodeData.status === "active" ? "#22c55e" :
              nodeData.status === "pending" ? "#fbbf24" :
              nodeData.status === "paused" ? "#a78bfa" : "#ef4444",
          }}
        />

        {/* Icon with spawn animation */}
        <motion.div 
          className="text-xl sm:text-2xl text-center mb-0.5 sm:mb-1"
          animate={isSpawning ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isSpawning ? 2 : 0 }}
        >
          {nodeData.isHuman ? "👤" : "🤖"}
        </motion.div>

        {/* Name */}
        <div className="text-xs sm:text-sm font-semibold text-white text-center truncate max-w-[80px] sm:max-w-none">
          {nodeData.label}
        </div>

        {/* Role */}
        <div className="text-[10px] sm:text-xs text-center" style={{ color }}>
          {nodeData.isHuman ? "Human" : roleLabels[nodeData.role] || nodeData.role}
          {nodeData.domain && <span className="hidden sm:inline"> • {nodeData.domain}</span>}
        </div>

        {/* Credits - hidden on mobile */}
        {!nodeData.isHuman && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden sm:block mt-2 text-xs text-center text-zinc-400"
          >
            💰 {nodeData.credits.toLocaleString()}
          </motion.div>
        )}

        {/* Task count - hidden on mobile */}
        {nodeData.tasksCompleted !== undefined && (
          <div className="hidden sm:block text-xs text-center text-zinc-500">
            ✓ {nodeData.tasksCompleted} tasks
          </div>
        )}
      </motion.div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </motion.div>
  );
}

// Custom edge with flowing task packets - clean, minimal dots
function TaskFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  source,
  target,
}: EdgeProps) {
  const { delegations, speed } = useContext(DelegationContext);
  
  // Get the edge path
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Find active delegations for this edge
  const activeDelegations = delegations.filter(
    (d) => d.fromId === source && d.toId === target
  );

  // Animation duration scales with speed (faster = shorter duration)
  const baseDuration = 1.2;
  const duration = baseDuration / Math.sqrt(speed); // sqrt for smoother scaling

  return (
    <>
      {/* Base edge line */}
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      
      {/* Animated task packets - simple glowing dots */}
      {activeDelegations.map((delegation, index) => (
        <motion.circle
          key={delegation.id}
          r={6}
          fill="#22c55e"
          filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))"
          initial={{ offsetDistance: "0%", scale: 0, opacity: 0 }}
          animate={{ 
            offsetDistance: "100%", 
            scale: [0, 1.2, 1, 1, 0.8],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ 
            duration,
            ease: "easeInOut",
            times: [0, 0.1, 0.3, 0.9, 1],
          }}
          style={{ 
            offsetPath: `path("${edgePath}")`,
            // Stagger multiple packets on same edge
            offsetDistance: `${index * 15}%`,
          }}
        />
      ))}
    </>
  );
}

const nodeTypes = { agent: AgentNode };
const edgeTypes = { taskFlow: TaskFlowEdge };

interface AgentNetworkProps {
  className?: string;
}

// Initial raw data (before layout)
const initialNodes: Node<AgentNodeData>[] = [
  { id: "human", type: "agent", position: { x: 400, y: 0 }, data: { label: "Adam", role: "ceo", level: 10, status: "active", credits: 0, isHuman: true } },
  { id: "coo", type: "agent", position: { x: 400, y: 120 }, data: { label: "Agent Dennis", role: "coo", level: 10, status: "active", credits: 50000, tasksCompleted: 12 } },
  { id: "talent", type: "agent", position: { x: 400, y: 240 }, data: { label: "Talent Agent", role: "hr", level: 9, status: "active", credits: 25000, domain: "HR", tasksCompleted: 8 } },
  { id: "dev-lead", type: "agent", position: { x: 200, y: 360 }, data: { label: "Dev Lead", role: "manager", level: 8, status: "active", credits: 15000, domain: "Engineering", tasksCompleted: 24 } },
  { id: "qa-lead", type: "agent", position: { x: 600, y: 360 }, data: { label: "QA Lead", role: "manager", level: 8, status: "active", credits: 12000, domain: "Quality", tasksCompleted: 18 } },
  { id: "dev-1", type: "agent", position: { x: 100, y: 480 }, data: { label: "Dev Agent 1", role: "senior", level: 6, status: "active", credits: 8000, domain: "Backend", tasksCompleted: 45 } },
  { id: "dev-2", type: "agent", position: { x: 300, y: 480 }, data: { label: "Dev Agent 2", role: "senior", level: 5, status: "active", credits: 6000, domain: "Frontend", tasksCompleted: 38 } },
  { id: "qa-1", type: "agent", position: { x: 500, y: 480 }, data: { label: "QA Agent 1", role: "worker", level: 4, status: "active", credits: 4000, domain: "Testing", tasksCompleted: 67 } },
  { id: "qa-2", type: "agent", position: { x: 700, y: 480 }, data: { label: "QA Agent 2", role: "worker", level: 3, status: "pending", credits: 2000, domain: "Testing", tasksCompleted: 12 } },
];

const initialEdges: Edge[] = [
  { id: "e-human-coo", source: "human", target: "coo", type: "taskFlow", animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } },
  { id: "e-coo-talent", source: "coo", target: "talent", type: "taskFlow", animated: true, style: { stroke: "#a78bfa", strokeWidth: 2 } },
  { id: "e-talent-dev", source: "talent", target: "dev-lead", type: "taskFlow", animated: true, style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e-talent-qa", source: "talent", target: "qa-lead", type: "taskFlow", animated: true, style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e-dev-1", source: "dev-lead", target: "dev-1", type: "taskFlow", animated: true, style: { stroke: "#06b6d4", strokeWidth: 2 } },
  { id: "e-dev-2", source: "dev-lead", target: "dev-2", type: "taskFlow", animated: true, style: { stroke: "#06b6d4", strokeWidth: 2 } },
  { id: "e-qa-1", source: "qa-lead", target: "qa-1", type: "taskFlow", animated: true, style: { stroke: "#fbbf24", strokeWidth: 2 } },
  { id: "e-qa-2", source: "qa-lead", target: "qa-2", type: "taskFlow", animated: true, style: { stroke: "#fbbf24", strokeWidth: 2 } },
];

// Inner component that uses useReactFlow (must be inside ReactFlowProvider)
function AgentNetworkInner({ className }: AgentNetworkProps) {
  const demo = useDemo();
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [spawnedIds, setSpawnedIds] = useState<Set<string>>(new Set());
  const [activeDelegations, setActiveDelegations] = useState<TaskDelegation[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Run initial layout on mount
  useEffect(() => {
    getLayoutedElements(initialNodes, initialEdges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setLayoutReady(true);
      setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 50);
    });
  }, []);

  // Re-layout and fit view when nodes/edges change significantly
  const runLayout = useCallback(async () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // Fit view after layout with a small delay for animation
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // Process simulation events to spawn/despawn agents
  useEffect(() => {
    if (!demo.isDemo || demo.recentEvents.length === 0) return;
    
    const latestEvent = demo.recentEvents[0];
    if (!latestEvent) return;
    
    // Handle agent spawn
    if (latestEvent.type === 'agent_created') {
      const newAgent = latestEvent.payload as any;
      if (spawnedIds.has(newAgent.id)) return; // Already added
      
      setSpawnedIds(prev => new Set(prev).add(newAgent.id));
      
      // Add new node (position will be set by layout)
      const newNode: Node<AgentNodeData> = {
        id: newAgent.id,
        type: "agent",
        position: { x: 0, y: 0 }, // Will be repositioned by dagre
        data: {
          label: newAgent.name,
          role: newAgent.role,
          level: newAgent.level,
          status: newAgent.status,
          credits: newAgent.currentBalance,
          domain: newAgent.domain,
          tasksCompleted: 0,
          isSpawning: true, // Trigger spawn animation
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
      
      // Add edge from parent
      if (newAgent.parentId) {
        setEdges((eds) => [
          ...eds,
          {
            id: `e-${newAgent.parentId}-${newAgent.id}`,
            source: newAgent.parentId,
            target: newAgent.id,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#22c55e", strokeWidth: 2 },
          },
        ]);
      }
      
      // Re-layout after spawn
      setTimeout(() => {
        runLayout();
        // Clear spawning state after animation
        setTimeout(() => {
          setNodes((current) =>
            current.map((n) =>
              n.id === newAgent.id ? { ...n, data: { ...n.data, isSpawning: false } } : n
            )
          );
        }, 1500);
      }, 100);
    }
    
    // Handle agent status change (despawn)
    if (latestEvent.type === 'agent_terminated') {
      const { agent, newStatus } = latestEvent.payload as any;
      
      setNodes((nds) =>
        nds.map((n) =>
          n.id === agent.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: newStatus,
                  isDespawning: newStatus === 'revoked',
                },
              }
            : n
        )
      );
      
      // Re-layout after despawn (if agent is being removed)
      if (newStatus === 'revoked') {
        setTimeout(() => runLayout(), 1000);
      }
    }
  }, [demo.recentEvents, demo.isDemo, setNodes, setEdges, spawnedIds, runLayout]);

  // Simulate real-time credit/task updates and task delegations
  useEffect(() => {
    if (!demo.isPlaying) return;

    // Task delegation paths (parent → child relationships)
    const delegationPaths = [
      { from: "human", to: "coo" },
      { from: "coo", to: "talent" },
      { from: "talent", to: "dev-lead" },
      { from: "talent", to: "qa-lead" },
      { from: "dev-lead", to: "dev-1" },
      { from: "dev-lead", to: "dev-2" },
      { from: "qa-lead", to: "qa-1" },
      { from: "qa-lead", to: "qa-2" },
    ];

    const taskTitles = [
      "Review PR #42",
      "Deploy v2.1",
      "Fix auth bug",
      "Update docs",
      "Run tests",
      "Code review",
      "Setup CI/CD",
      "Refactor API",
    ];

    const interval = setInterval(() => {
      // Credit/task updates
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data && !node.data.isHuman && Math.random() > 0.6) {
            const newData = node.data as AgentNodeData;
            const creditDelta = Math.floor(Math.random() * 100) - 30;
            return {
              ...node,
              data: {
                ...newData,
                credits: Math.max(0, newData.credits + creditDelta),
                tasksCompleted: (newData.tasksCompleted || 0) + (Math.random() > 0.7 ? 1 : 0),
              },
            };
          }
          return node;
        })
      );

      // Randomly create task delegations
      if (Math.random() > 0.5) {
        const path = delegationPaths[Math.floor(Math.random() * delegationPaths.length)];
        const taskTitle = taskTitles[Math.floor(Math.random() * taskTitles.length)];
        const delegation: TaskDelegation = {
          id: `del-${Date.now()}-${Math.random()}`,
          fromId: path.from,
          toId: path.to,
          taskTitle,
          startTime: Date.now(),
        };
        setActiveDelegations((prev) => [...prev, delegation]);

        // Remove delegation after animation completes (matches edge animation duration)
        const animDuration = 1200 / Math.sqrt(demo.speed);
        setTimeout(() => {
          setActiveDelegations((prev) => prev.filter((d) => d.id !== delegation.id));
        }, animDuration);
      }
    }, 800 / demo.speed); // Create delegations more frequently
    
    return () => clearInterval(interval);
  }, [demo.isPlaying, demo.speed, setNodes]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    setSelectedNode(node as Node<AgentNodeData>);
  }

  // Context value includes speed so edges can adapt animation duration
  const contextValue = useMemo(() => ({
    delegations: activeDelegations,
    speed: demo.speed,
  }), [activeDelegations, demo.speed]);

  return (
    <DelegationContext.Provider value={contextValue}>
      <div className={`relative ${className}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          style: { stroke: "#6366f1", strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
        <Controls className="!bg-zinc-800 !border-zinc-700 !rounded-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-white [&>button:hover]:!bg-zinc-700" />
      </ReactFlow>

      {/* Legend - hidden in landscape mobile, compact on portrait mobile, shown on larger screens */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-2 sm:p-4 text-sm max-w-[140px] sm:max-w-none landscape:hidden lg:landscape:block">
        <div className="font-semibold mb-2 text-white text-xs sm:text-sm">Levels</div>
        <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
          {[
            { level: "L10", label: "COO", color: "#f472b6" },
            { level: "L9", label: "HR", color: "#a78bfa" },
            { level: "L7-8", label: "Mgr", color: "#22c55e" },
            { level: "L5-6", label: "Sr", color: "#06b6d4" },
            { level: "L3-4", label: "Wkr", color: "#fbbf24" },
            { level: "L1-2", label: "New", color: "#71717a" },
          ].map((item) => (
            <div key={item.level} className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-zinc-400">{item.level}</span>
              <span className="text-zinc-500 hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="hidden sm:block mt-3 pt-3 border-t border-zinc-800 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-zinc-400">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-zinc-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-zinc-400">Paused</span>
          </div>
        </div>
      </div>

      {/* Selected node details - bottom sheet on mobile, side panel on desktop */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute 
              bottom-20 sm:bottom-auto sm:top-4 
              left-4 right-4 sm:left-auto sm:right-4 
              bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-lg p-4 
              sm:w-64"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-white p-1"
            >
              ✕
            </button>
            <div className="flex sm:block items-center gap-3">
              <div className="text-2xl sm:hidden">
                {(selectedNode.data as AgentNodeData).isHuman ? "👤" : "🤖"}
              </div>
              <div>
                <div className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">
                  {(selectedNode.data as AgentNodeData).label}
                </div>
                <div className="text-xs sm:text-sm text-zinc-400 mb-2 sm:mb-3">
                  {(selectedNode.data as AgentNodeData).isHuman
                    ? "Human Operator"
                    : `Level ${(selectedNode.data as AgentNodeData).level} ${roleLabels[(selectedNode.data as AgentNodeData).role] || (selectedNode.data as AgentNodeData).role}`}
                </div>
              </div>
            </div>
            {!(selectedNode.data as AgentNodeData).isHuman && (
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Credits</span>
                  <span className="text-white">{(selectedNode.data as AgentNodeData).credits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tasks</span>
                  <span className="text-white">{(selectedNode.data as AgentNodeData).tasksCompleted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className={
                    (selectedNode.data as AgentNodeData).status === "active" ? "text-green-500" :
                    (selectedNode.data as AgentNodeData).status === "pending" ? "text-yellow-500" : "text-purple-500"
                  }>
                    {(selectedNode.data as AgentNodeData).status}
                  </span>
                </div>
                {(selectedNode.data as AgentNodeData).domain && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Domain</span>
                    <span className="text-white">{(selectedNode.data as AgentNodeData).domain}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Flow Feed - shows recent delegations in a compact stack */}
      {demo.isDemo && (
        <div className="absolute bottom-20 right-4 sm:bottom-6 sm:right-4 z-10">
          <AnimatePresence mode="popLayout">
            {activeDelegations.slice(-5).map((del, idx) => {
              const fromNode = nodes.find((n) => n.id === del.fromId);
              const toNode = nodes.find((n) => n.id === del.toId);
              return (
                <motion.div
                  key={del.id}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1 - idx * 0.15, x: 0, scale: 1 - idx * 0.03, y: idx * -4 }}
                  exit={{ opacity: 0, x: 30, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-zinc-900/95 backdrop-blur border border-green-500/30 rounded-lg px-3 py-1.5 mb-1 text-xs flex items-center gap-2 shadow-lg shadow-green-500/10"
                  style={{ position: idx === 0 ? 'relative' : 'absolute', bottom: 0 }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <span className="text-zinc-400 truncate max-w-[60px]">{fromNode?.data?.label || del.fromId}</span>
                  <span className="text-green-500">→</span>
                  <span className="text-zinc-400 truncate max-w-[60px]">{toNode?.data?.label || del.toId}</span>
                  <span className="text-zinc-500 hidden sm:inline truncate max-w-[80px]">"{del.taskTitle}"</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      </div>
    </DelegationContext.Provider>
  );
}

// Wrapper component that provides ReactFlowProvider
export function AgentNetwork({ className }: AgentNetworkProps) {
  return (
    <ReactFlowProvider>
      <AgentNetworkInner className={className} />
    </ReactFlowProvider>
  );
}
