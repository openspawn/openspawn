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

export function AgentNetwork({ className }: AgentNetworkProps) {
  const demo = useDemo();
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);

  // Use static demo data - simpler and avoids ReactFlow store conflicts
  const initialData = useMemo(() => generateStaticDemoData(), []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Simulate real-time updates only when NOT in demo mode
  useEffect(() => {
    if (demo.isDemo) return; // Demo mode handles its own updates via TanStack Query

    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data && !node.data.isHuman && Math.random() > 0.7) {
            const newData = node.data as AgentNodeData;
            return {
              ...node,
              data: {
                ...newData,
                credits: newData.credits + Math.floor(Math.random() * 50),
                tasksCompleted: (newData.tasksCompleted || 0) + (Math.random() > 0.8 ? 1 : 0),
              },
            };
          }
          return node;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [setNodes, demo.isDemo]);

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
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#3f3f46" },
          style: { stroke: "#3f3f46", strokeWidth: 2 },
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
    </div>
  );
}
