import { useEffect, useState, useMemo, useCallback, createContext, useContext, useRef } from "react";
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
import { useAgents, type Agent } from "../hooks/use-agents";

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

// Auto-layout using ELK (async) - compact spacing
async function getLayoutedElements(nodes: Node[], edges: Edge[]): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) return { nodes: [], edges: [] };
  
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "40",                      // Horizontal spacing between siblings
      "elk.layered.spacing.nodeNodeBetweenLayers": "60", // Vertical spacing between levels
      "elk.layered.spacing.edgeNodeBetweenLayers": "20",
      "elk.spacing.componentComponent": "40",
      "elk.layered.nodePlacement.strategy": "SIMPLE",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 140,
      height: 80,
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

// Custom node component
function AgentNode({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const nodeData = data as AgentNodeData;
  const color = nodeData.isHuman ? "#06b6d4" : levelColors[nodeData.level] || "#71717a";
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
      
      {isSpawning && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2, opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: "#22c55e", filter: "blur(20px)" }}
        />
      )}
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 min-w-[100px] sm:min-w-[140px]
          ${selected ? "shadow-lg shadow-purple-500/30" : ""}
          ${isSpawning ? "shadow-lg shadow-green-500/50" : ""}
        `}
        style={{
          borderColor: color,
          backgroundColor: `${color}15`,
        }}
      >
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

        <motion.div className="text-xl sm:text-2xl text-center mb-0.5 sm:mb-1">
          {nodeData.isHuman ? "👤" : "🤖"}
        </motion.div>

        <div className="text-xs sm:text-sm font-semibold text-white text-center truncate max-w-[80px] sm:max-w-none">
          {nodeData.label}
        </div>

        <div className="text-[10px] sm:text-xs text-center" style={{ color }}>
          {nodeData.isHuman ? "Human" : roleLabels[nodeData.role] || nodeData.role}
          {nodeData.domain && <span className="hidden sm:inline"> • {nodeData.domain}</span>}
        </div>

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
      </motion.div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </motion.div>
  );
}

// Custom edge with flowing task packets
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
  
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const activeDelegations = delegations.filter(
    (d) => d.fromId === source && d.toId === target
  );

  const baseDuration = 1.2;
  const duration = baseDuration / Math.sqrt(speed);

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      
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

// Convert API agents to ReactFlow nodes and edges
function buildNodesAndEdges(agents: Agent[]): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  // Add human node at the top
  const nodes: Node<AgentNodeData>[] = [
    {
      id: "human",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        label: "Adam",
        role: "ceo",
        level: 10,
        status: "active",
        credits: 0,
        isHuman: true,
      },
    },
  ];

  const edges: Edge[] = [];

  // Convert agents to nodes
  agents.forEach((agent) => {
    nodes.push({
      id: agent.id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        label: agent.name,
        role: agent.role,
        level: agent.level,
        status: agent.status as "active" | "pending" | "paused" | "suspended",
        credits: agent.currentBalance,
        domain: agent.domain || undefined,
        tasksCompleted: 0,
      },
    });

    // Create edge from parent
    const parentId = agent.parentId || (agent.level >= 9 ? "human" : undefined);
    if (parentId) {
      const color = levelColors[agent.level] || "#6366f1";
      edges.push({
        id: `e-${parentId}-${agent.id}`,
        source: parentId,
        target: agent.id,
        type: "taskFlow",
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}

// Inner component
function AgentNetworkInner({ className }: AgentNetworkProps) {
  const demo = useDemo();
  const { agents, loading } = useAgents();
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);
  const [activeDelegations, setActiveDelegations] = useState<TaskDelegation[]>([]);
  const prevAgentCountRef = useRef(0);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Auto-layout: runs whenever agents change
  useEffect(() => {
    if (loading) return;
    
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(agents);
    
    // Apply layout whenever agent count changes
    getLayoutedElements(newNodes, newEdges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      // Fit view when nodes are added/removed
      const agentCountChanged = agents.length !== prevAgentCountRef.current;
      prevAgentCountRef.current = agents.length;
      
      if (agentCountChanged) {
        setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
      }
    });
  }, [agents, loading, setNodes, setEdges, fitView]);

  // Task delegation simulation
  useEffect(() => {
    if (!demo.isPlaying || nodes.length === 0) return;

    const taskTitles = [
      "Review PR #42", "Deploy v2.1", "Fix auth bug", "Update docs",
      "Run tests", "Code review", "Setup CI/CD", "Refactor API",
    ];

    const interval = setInterval(() => {
      // Find edges to animate tasks along
      if (edges.length === 0) return;
      
      const randomEdge = edges[Math.floor(Math.random() * edges.length)];
      const taskTitle = taskTitles[Math.floor(Math.random() * taskTitles.length)];
      
      const delegation: TaskDelegation = {
        id: `del-${Date.now()}-${Math.random()}`,
        fromId: randomEdge.source,
        toId: randomEdge.target,
        taskTitle,
        startTime: Date.now(),
      };
      
      setActiveDelegations((prev) => [...prev, delegation]);

      const animDuration = 1200 / Math.sqrt(demo.speed);
      setTimeout(() => {
        setActiveDelegations((prev) => prev.filter((d) => d.id !== delegation.id));
      }, animDuration);
    }, 800 / demo.speed);
    
    return () => clearInterval(interval);
  }, [demo.isPlaying, demo.speed, nodes.length, edges]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    setSelectedNode(node as Node<AgentNodeData>);
  }

  const contextValue = useMemo(() => ({
    delegations: activeDelegations,
    speed: demo.speed,
  }), [activeDelegations, demo.speed]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-zinc-400">Loading agents...</div>
      </div>
    );
  }

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
          minZoom={0.3}
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

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-2 sm:p-4 text-sm max-w-[140px] sm:max-w-none landscape:hidden lg:landscape:block">
          <div className="font-semibold mb-2 text-white text-xs sm:text-sm">Levels</div>
          <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
            {[
              { level: "L10", label: "COO", color: "#f472b6" },
              { level: "L9", label: "HR", color: "#a78bfa" },
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
        </div>

        {/* Selected node details */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 sm:bottom-auto sm:top-4 left-4 right-4 sm:left-auto sm:right-4 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-lg p-4 sm:w-64"
            >
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-2 right-2 text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
              <div className="text-base sm:text-lg font-semibold text-white mb-1">
                {(selectedNode.data as AgentNodeData).label}
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 mb-3">
                {(selectedNode.data as AgentNodeData).isHuman
                  ? "Human Operator"
                  : `Level ${(selectedNode.data as AgentNodeData).level} ${roleLabels[(selectedNode.data as AgentNodeData).role] || (selectedNode.data as AgentNodeData).role}`}
              </div>
              {!(selectedNode.data as AgentNodeData).isHuman && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Credits</span>
                    <span className="text-white">{(selectedNode.data as AgentNodeData).credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Status</span>
                    <span className={(selectedNode.data as AgentNodeData).status === "active" ? "text-green-500" : "text-yellow-500"}>
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

        {/* Task Flow Feed */}
        {demo.isDemo && activeDelegations.length > 0 && (
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

// Wrapper with ReactFlowProvider
export function AgentNetwork({ className }: AgentNetworkProps) {
  return (
    <ReactFlowProvider>
      <AgentNetworkInner className={className} />
    </ReactFlowProvider>
  );
}
