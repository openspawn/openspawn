import { useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import "@xyflow/react/dist/style.css";
import { useDemo } from "../demo";
import { generateStaticDemoData } from "./agent-network-utils";

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

// Animated edge with credit flow
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  data,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  style?: React.CSSProperties;
  data?: { creditFlow?: number };
}) {
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX} ${(sourceY + targetY) / 2}, ${targetX} ${(sourceY + targetY) / 2}, ${targetX} ${targetY}`;
  
  return (
    <g>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke="#3f3f46"
        strokeWidth={2}
        style={style}
      />
      {/* Animated credit flow particles */}
      {data?.creditFlow && (
        <motion.circle
          r={4}
          fill="#fbbf24"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path("${edgePath}")` }}
        />
      )}
    </g>
  );
}

const nodeTypes = { agent: AgentNode };

interface AgentNetworkProps {
  className?: string;
}

// Track spawn counts per parent for positioning
const spawnCountByParent = new Map<string, number>();

// Calculate position for a new node based on its parent
function calculateSpawnPosition(
  parentId: string | undefined, 
  parentNode: Node<AgentNodeData> | undefined,
  level: number
): { x: number; y: number } {
  if (!parentNode || !parentId) {
    // Default position for top-level agents
    const count = spawnCountByParent.get('root') || 0;
    spawnCountByParent.set('root', count + 1);
    return { x: 200 + (count % 5) * 180, y: 280 };
  }
  
  // Get count of children already spawned by this parent
  const childCount = spawnCountByParent.get(parentId) || 0;
  spawnCountByParent.set(parentId, childCount + 1);
  
  // Spread children horizontally, offset based on child count
  const offsetX = (childCount - 1) * 180;
  const yOffset = level <= 7 ? 160 : 140; // More space for managers
  
  return {
    x: parentNode.position.x + offsetX - 180,
    y: parentNode.position.y + yOffset,
  };
}

// Track active task delegations for animation
interface TaskDelegation {
  id: string;
  fromId: string;
  toId: string;
  taskTitle: string;
  startTime: number;
}

export function AgentNetwork({ className }: AgentNetworkProps) {
  const demo = useDemo();
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [spawnedIds, setSpawnedIds] = useState<Set<string>>(new Set());
  const [activeDelegations, setActiveDelegations] = useState<TaskDelegation[]>([]);

  // Start with core hierarchy - Human → COO → Talent Agent + initial workers
  const initialData = useMemo(() => {
    const nodes: Node<AgentNodeData>[] = [
      {
        id: "human",
        type: "agent",
        position: { x: 400, y: 0 },
        data: { label: "Adam", role: "ceo", level: 10, status: "active", credits: 0, isHuman: true },
      },
      {
        id: "coo",
        type: "agent",
        position: { x: 400, y: 140 },
        data: { label: "Agent Dennis", role: "coo", level: 10, status: "active", credits: 50000, tasksCompleted: 12 },
      },
      {
        id: "talent",
        type: "agent",
        position: { x: 400, y: 280 },
        data: { label: "Talent Agent", role: "hr", level: 9, status: "active", credits: 25000, domain: "HR", tasksCompleted: 8 },
      },
      {
        id: "dev-lead",
        type: "agent",
        position: { x: 200, y: 420 },
        data: { label: "Dev Lead", role: "manager", level: 8, status: "active", credits: 15000, domain: "Engineering", tasksCompleted: 24 },
      },
      {
        id: "qa-lead",
        type: "agent",
        position: { x: 600, y: 420 },
        data: { label: "QA Lead", role: "manager", level: 8, status: "active", credits: 12000, domain: "Quality", tasksCompleted: 18 },
      },
      {
        id: "dev-1",
        type: "agent",
        position: { x: 100, y: 560 },
        data: { label: "Dev Agent 1", role: "senior", level: 6, status: "active", credits: 8000, domain: "Backend", tasksCompleted: 45 },
      },
      {
        id: "dev-2",
        type: "agent",
        position: { x: 300, y: 560 },
        data: { label: "Dev Agent 2", role: "senior", level: 5, status: "active", credits: 6000, domain: "Frontend", tasksCompleted: 38 },
      },
      {
        id: "qa-1",
        type: "agent",
        position: { x: 500, y: 560 },
        data: { label: "QA Agent 1", role: "worker", level: 4, status: "active", credits: 4000, domain: "Testing", tasksCompleted: 67 },
      },
      {
        id: "qa-2",
        type: "agent",
        position: { x: 700, y: 560 },
        data: { label: "QA Agent 2", role: "worker", level: 3, status: "pending", credits: 2000, domain: "Testing", tasksCompleted: 12 },
      },
    ];
    const edges: Edge[] = [
      { id: "e-human-coo", source: "human", target: "coo", type: "smoothstep", animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } },
      { id: "e-coo-talent", source: "coo", target: "talent", type: "smoothstep", animated: true, style: { stroke: "#a78bfa", strokeWidth: 2 } },
      { id: "e-talent-dev", source: "talent", target: "dev-lead", type: "smoothstep", animated: true, style: { stroke: "#22c55e", strokeWidth: 2 } },
      { id: "e-talent-qa", source: "talent", target: "qa-lead", type: "smoothstep", animated: true, style: { stroke: "#22c55e", strokeWidth: 2 } },
      { id: "e-dev-1", source: "dev-lead", target: "dev-1", type: "smoothstep", animated: true, style: { stroke: "#06b6d4", strokeWidth: 2 } },
      { id: "e-dev-2", source: "dev-lead", target: "dev-2", type: "smoothstep", animated: true, style: { stroke: "#06b6d4", strokeWidth: 2 } },
      { id: "e-qa-1", source: "qa-lead", target: "qa-1", type: "smoothstep", animated: true, style: { stroke: "#fbbf24", strokeWidth: 2 } },
      { id: "e-qa-2", source: "qa-lead", target: "qa-2", type: "smoothstep", animated: true, style: { stroke: "#fbbf24", strokeWidth: 2 } },
    ];
    return { nodes, edges };
  }, []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

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
      
      setNodes((nds) => {
        const parentNode = nds.find(n => n.id === newAgent.parentId);
        const pos = calculateSpawnPosition(newAgent.parentId, parentNode, newAgent.level);
        
        const newNode: Node<AgentNodeData> = {
          id: newAgent.id,
          type: "agent",
          position: pos,
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
        
        // Clear spawning state after animation
        setTimeout(() => {
          setNodes((current) =>
            current.map((n) =>
              n.id === newAgent.id ? { ...n, data: { ...n.data, isSpawning: false } } : n
            )
          );
        }, 2000);
        
        return [...nds, newNode];
      });
      
      // Add edge from parent
      if (newAgent.parentId) {
        setEdges((eds) => [
          ...eds,
          {
            id: `e-${newAgent.parentId}-${newAgent.id}`,
            source: newAgent.parentId,
            target: newAgent.id,
            animated: true,
          },
        ]);
      }
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
    }
  }, [demo.recentEvents, demo.isDemo, setNodes, setEdges, spawnedIds]);

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

        // Remove delegation after animation completes (2 seconds)
        setTimeout(() => {
          setActiveDelegations((prev) => prev.filter((d) => d.id !== delegation.id));
        }, 2000 / demo.speed);
      }
    }, 1500 / demo.speed);
    
    return () => clearInterval(interval);
  }, [demo.isPlaying, demo.speed, setNodes]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    setSelectedNode(node as Node<AgentNodeData>);
  }

  return (
    <div className={`relative ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
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

      {/* Task Delegation Feed - shows live task assignments */}
      {demo.isDemo && activeDelegations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 sm:right-4 sm:top-20 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-lg p-3 w-48 sm:w-56 max-h-48 overflow-hidden"
        >
          <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Task Delegations
          </div>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {activeDelegations.slice(-4).map((del) => {
                const fromNode = nodes.find((n) => n.id === del.fromId);
                const toNode = nodes.find((n) => n.id === del.toId);
                return (
                  <motion.div
                    key={del.id}
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="text-[10px] sm:text-xs bg-zinc-800/50 rounded px-2 py-1.5"
                  >
                    <div className="text-white font-medium truncate">{del.taskTitle}</div>
                    <div className="text-zinc-500 flex items-center gap-1">
                      <span className="truncate">{fromNode?.data?.label || del.fromId}</span>
                      <span className="text-green-500">→</span>
                      <span className="truncate">{toNode?.data?.label || del.toId}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
