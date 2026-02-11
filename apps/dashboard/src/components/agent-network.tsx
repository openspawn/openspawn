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
import { isSandboxMode } from "../graphql/fetcher";
import { useSandboxSSE, type SandboxSSEEvent } from "../hooks/use-sandbox-sse";
import { useAgents, type Agent } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useMessages, useConversations } from "../hooks/use-messages";
import { getAgentAvatarUrl, getAvatarSettings } from "../lib/avatar";
import { useAgentHealth } from "../hooks/use-agent-health";
import { useTouchDevice } from "../hooks/use-touch-device";
import { levelColors } from "../lib/status-colors";

// Context to share active delegations, speed, avatar settings, and activity data
interface TaskDelegation {
  id: string;
  fromId: string;
  toId: string;
  taskTitle: string;
  startTime: number;
}

interface AgentActivity {
  taskCount: number;
  messageCount: number;
  activityLevel: 'hot' | 'warm' | 'cool' | 'idle';
}

interface EdgeMessageData {
  count: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface AgentHealthData {
  completionRate: number;
  creditUsage: number;
  ringStatus: 'active' | 'idle' | 'busy' | 'error';
}

interface NetworkContextValue {
  delegations: TaskDelegation[];
  speed: number;
  avatarVersion: number;
  agentActivity: Map<string, AgentActivity>;
  edgeMessages: Map<string, EdgeMessageData>;
  agentHealth: Map<string, AgentHealthData>;
  isMobileOrTouch: boolean;
  dimIdle: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({ 
  delegations: [], 
  speed: 1, 
  avatarVersion: 0,
  agentActivity: new Map(),
  edgeMessages: new Map(),
  agentHealth: new Map(),
  isMobileOrTouch: false,
  dimIdle: false,
});

// ELK instance for layout
const elk = new ELK();

// Layout options for normal and compact modes
interface LayoutOptions {
  compact: boolean;
}

// Auto-layout using ELK (async)
async function getLayoutedElements(
  nodes: Node[], 
  edges: Edge[],
  options: LayoutOptions = { compact: false }
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) return { nodes: [], edges: [] };
  
  const nodeWidth = options.compact ? 90 : 160;
  const nodeHeight = options.compact ? 64 : 96;
  const horizontalSpacing = options.compact ? 40 : 70;
  const verticalSpacing = options.compact ? 100 : 150;
  
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": String(horizontalSpacing),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(verticalSpacing),
      "elk.layered.spacing.edgeNodeBetweenLayers": "25",
      "elk.spacing.componentComponent": String(horizontalSpacing),
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: nodeWidth,
      height: nodeHeight,
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

// Level colors from shared status-colors module

// Heat map colors based on activity
const heatColors = {
  hot: "#ef4444",      // red - very busy
  warm: "#f59e0b",     // orange - busy
  moderate: "#fbbf24", // yellow - moderate
  cool: "#06b6d4",     // cyan - light activity
  idle: "#64748b",     // slate - idle
};

const roleLabels: Record<string, string> = {
  coo: "COO",
  hr: "HR",
  manager: "Manager",
  senior: "Senior",
  worker: "Worker",
};

interface AgentNodeData extends Record<string, unknown> {
  label: string;
  agentId: string;
  role: string;
  level: number;
  status: "active" | "pending" | "paused" | "suspended";
  credits: number;
  isHuman?: boolean;
  domain?: string;
  tasksCompleted?: number;
  avatar?: string;
  isSpawning?: boolean;
  isDespawning?: boolean;
  compact?: boolean;
  activityLevel?: 'hot' | 'warm' | 'cool' | 'idle';
  taskCount?: number;
}

// Custom node component with heat map coloring
function AgentNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const { avatarVersion, agentActivity, agentHealth, isMobileOrTouch, dimIdle } = useContext(NetworkContext);
  const hasAnimated = useRef(false);
  
  // Get activity data
  const activity = agentActivity.get(nodeData.agentId);
  const activityLevel = activity?.activityLevel || 'idle';
  const taskCount = activity?.taskCount || 0;
  
  // Determine node color based on activity (heat map)
  let color: string;
  if (nodeData.isHuman) {
    color = "#06b6d4"; // Human always cyan
  } else {
    // Use heat map colors based on activity
    switch (activityLevel) {
      case 'hot':
        color = heatColors.hot;
        break;
      case 'warm':
        color = heatColors.warm;
        break;
      case 'cool':
        color = heatColors.cool;
        break;
      default:
        color = heatColors.idle;
    }
  }
  
  const isSpawning = nodeData.isSpawning;
  const isDespawning = nodeData.isDespawning;
  const compact = nodeData.compact;
  const isActive = nodeData.status === "active" && activityLevel !== 'idle';
  const isIdle = activityLevel === 'idle';
  
  // Increase node size on mobile for easier tapping (44px+ touch targets)
  const mobileScale = isMobileOrTouch ? 1.2 : 1;
  const nodeWidth = (compact ? 90 : 160) * mobileScale;
  const nodeHeight = (compact ? 64 : 96) * mobileScale;
  
  const avatarUrl = useMemo(() => {
    if (nodeData.isHuman) return null;
    return getAgentAvatarUrl(nodeData.agentId, nodeData.level, compact ? 32 : 48);
  }, [nodeData.agentId, nodeData.level, nodeData.isHuman, compact, avatarVersion]);
  
  return (
    <div 
      className="relative"
      style={{ width: nodeWidth, height: nodeHeight }}
    >
      <Handle 
        id="top"
        type="target" 
        position={Position.Top}
        style={{ 
          background: color,
          width: compact ? 8 : 12,
          height: compact ? 8 : 12,
          border: '2px solid #27272a',
          borderRadius: '50%',
        }}
      />
      
      <motion.div
        initial={hasAnimated.current ? false : { scale: 0, opacity: 0 }}
        animate={{ 
          scale: isDespawning ? 0 : 1, 
          opacity: isDespawning ? 0 : (isIdle && dimIdle ? 0.35 : isIdle ? 0.9 : 1),
        }}
        exit={{ scale: 0, opacity: 0 }}
        onAnimationComplete={() => { hasAnimated.current = true; }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="absolute inset-0"
      >
        {/* Pulsing glow for active/busy agents — disabled on mobile for performance */}
        {isActive && !isMobileOrTouch && (
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: activityLevel === 'hot' ? 1 : 2,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-xl blur-lg"
            style={{ backgroundColor: color }}
          />
        )}
        {/* Static glow fallback on mobile */}
        {isActive && isMobileOrTouch && (
          <div
            className="absolute inset-0 rounded-xl blur-md opacity-30"
            style={{ backgroundColor: color }}
          />
        )}
        
        {isSpawning && !isMobileOrTouch && (
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
            w-full h-full flex flex-col items-center justify-center
            rounded-xl border-2 px-2 py-1 transition-all
            ${selected ? "shadow-lg shadow-purple-500/30" : ""}
            ${isSpawning ? "shadow-lg shadow-green-500/50" : ""}
            ${isActive ? "shadow-lg" : ""}
          `}
          style={{
            borderColor: color,
            backgroundColor: `${color}${isIdle ? '18' : '20'}`,
            boxShadow: isActive ? `0 0 20px ${color}40` : undefined,
          }}
        >
          {/* Level badge */}
          {!nodeData.isHuman && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`absolute rounded-full font-bold text-foreground ${compact ? '-top-1.5 -right-1.5 px-1 py-0 text-[8px]' : '-top-2 -right-2 px-1.5 py-0.5 text-[10px]'}`}
              style={{ backgroundColor: color }}
            >
              L{nodeData.level}
            </motion.div>
          )}

          {/* Task count badge */}
          {!nodeData.isHuman && taskCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`absolute rounded-full font-bold text-foreground bg-violet-600 ${compact ? '-bottom-1.5 -right-1.5 px-1 py-0 text-[8px]' : '-bottom-2 -right-2 px-1.5 py-0.5 text-[10px]'}`}
            >
              {taskCount}
            </motion.div>
          )}

          {/* Status indicator */}
          <motion.div
            animate={{
              scale: isActive ? [1, 1.3, 1] : 1,
              opacity: isActive ? 1 : 0.5,
            }}
            transition={{ 
              repeat: isActive ? Infinity : 0, 
              duration: activityLevel === 'hot' ? 1.5 : 2,
            }}
            className={`absolute rounded-full ${compact ? '-top-0.5 -left-0.5 w-2 h-2' : '-top-1 -left-1 w-2.5 h-2.5'}`}
            style={{
              backgroundColor:
                nodeData.status === "active" ? "#22c55e" :
                nodeData.status === "pending" ? "#fbbf24" :
                nodeData.status === "paused" ? "#a78bfa" : "#ef4444",
            }}
          />

          {/* Avatar/Icon with status rings */}
          {!compact && (() => {
            const health = agentHealth.get(nodeData.agentId);
            const avatarImg = nodeData.isHuman ? (
              <span className="text-lg leading-none">👤</span>
            ) : nodeData.avatar ? (
              <span className="text-2xl leading-none select-none">{nodeData.avatar}</span>
            ) : avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={nodeData.label}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="text-lg leading-none">🤖</span>
            );

            if (!nodeData.isHuman && health) {
              const r1 = 18, r2 = 15, sw = 2;
              const c1 = 2 * Math.PI * r1, c2 = 2 * Math.PI * r2;
              const o1 = c1 * (1 - health.completionRate);
              const o2 = c2 * (1 - health.creditUsage);
              const col = (v: number) => v >= 0.85 ? '#f43f5e' : v >= 0.6 ? '#f59e0b' : '#10b981';
              return (
                <div className="relative mb-0.5" style={{ width: 40, height: 40 }}>
                  <svg className="absolute inset-0" width={40} height={40} viewBox="0 0 40 40">
                    <circle cx={20} cy={20} r={r1} fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={sw} />
                    <motion.circle
                      cx={20} cy={20} r={r1} fill="none"
                      stroke={col(health.completionRate)} strokeWidth={sw} strokeLinecap="round"
                      strokeDasharray={c1}
                      initial={{ strokeDashoffset: c1 }}
                      animate={{ strokeDashoffset: o1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      transform="rotate(-90 20 20)"
                    />
                    <circle cx={20} cy={20} r={r2} fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={sw} />
                    <motion.circle
                      cx={20} cy={20} r={r2} fill="none"
                      stroke={col(health.creditUsage)} strokeWidth={sw} strokeLinecap="round"
                      strokeDasharray={c2}
                      initial={{ strokeDashoffset: c2 }}
                      animate={{ strokeDashoffset: o2 }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                      transform="rotate(-90 20 20)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {avatarImg}
                  </div>
                </div>
              );
            }
            return <div className="mb-0.5">{avatarImg}</div>;
          })()}

          {/* Name — larger font on mobile for readability */}
          <div 
            className={`font-semibold text-foreground text-center truncate w-full ${
              compact 
                ? (isMobileOrTouch ? 'text-xs' : 'text-[10px]') 
                : (isMobileOrTouch ? 'text-base' : 'text-sm')
            }`}
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            {compact ? (nodeData.isHuman ? "👤 " : "") + nodeData.label.split(' ')[0] : nodeData.label}
          </div>

          {/* Role — slightly larger on mobile */}
          {!compact && (
            <div className={`text-center truncate w-full ${isMobileOrTouch ? 'text-[11px]' : 'text-[9px]'}`} style={{ color }}>
              {nodeData.isHuman ? "Human" : roleLabels[nodeData.role] || nodeData.role}
            </div>
          )}

          {/* Credits */}
          {!nodeData.isHuman && !compact && (
            <div className="text-[9px] text-center text-zinc-400 mt-0.5">
              💰 {nodeData.credits.toLocaleString()}
            </div>
          )}
        </motion.div>
      </motion.div>

      <Handle 
        id="bottom"
        type="source" 
        position={Position.Bottom}
        style={{ 
          background: color,
          width: compact ? 8 : 12,
          height: compact ? 8 : 12,
          border: '2px solid #27272a',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

// Custom edge with enhanced flowing particles and variable thickness
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
  selected,
}: EdgeProps & { selected?: boolean }) {
  const { delegations, speed, edgeMessages, isMobileOrTouch } = useContext(NetworkContext);
  
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

  // Get message count for this edge
  const edgeKey = `${source}-${target}`;
  const messageData = edgeMessages.get(edgeKey);
  const messageCount = messageData?.count || 0;
  
  // Calculate edge thickness based on message volume
  const baseStrokeWidth = 2;
  const maxStrokeWidth = 6;
  const strokeWidth = messageCount > 0 
    ? Math.min(baseStrokeWidth + Math.log(messageCount + 1) * 0.8, maxStrokeWidth)
    : baseStrokeWidth;

  const baseDuration = 1.2;
  const duration = baseDuration / Math.sqrt(speed);

  // Reduce particle count on mobile for performance
  const maxParticles = isMobileOrTouch ? 1 : 3;
  const particleCount = Math.min(Math.max(1, Math.floor(messageCount / 5)), maxParticles);
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <>
      {/* Glow underlay for active edges — skip on mobile */}
      {messageCount > 0 && !isMobileOrTouch && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            ...style,
            strokeWidth: strokeWidth + 4,
            opacity: 0.15,
            filter: 'blur(4px)',
          }}
        />
      )}
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{
          ...style,
          strokeWidth,
          strokeDasharray: messageCount > 0 ? undefined : '6 4',
          opacity: selected ? 1 : (messageCount > 0 ? 0.85 : 0.35),
        }} 
        markerEnd={markerEnd} 
      />
      
      {/* Animated particles along edge — simplified on mobile */}
      {!isMobileOrTouch && activeDelegations.map((delegation) => (
        <motion.g key={delegation.id}>
          {/* Main particle */}
          <motion.circle
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
            }}
          />
          {/* Trailing glow */}
          <motion.circle
            r={4}
            fill="#22c55e"
            opacity={0.4}
            filter="blur(4px)"
            initial={{ offsetDistance: "0%" }}
            animate={{ 
              offsetDistance: "100%",
            }}
            transition={{ 
              duration,
              ease: "easeInOut",
              delay: 0.1,
            }}
            style={{ 
              offsetPath: `path("${edgePath}")`,
            }}
          />
        </motion.g>
      ))}
      {/* Mobile: simpler single particle for active delegations */}
      {isMobileOrTouch && activeDelegations.slice(0, 1).map((delegation) => (
        <motion.circle
          key={delegation.id}
          r={5}
          fill="#22c55e"
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
          transition={{ duration, ease: "easeInOut" }}
          style={{ offsetPath: `path("${edgePath}")` }}
        />
      ))}
      
      {/* Ambient particles for high-traffic edges — skip on mobile */}
      {!isMobileOrTouch && messageCount > 10 && particles.map((i) => (
        <motion.circle
          key={`ambient-${i}`}
          r={3}
          fill="#06b6d4"
          opacity={0.3}
          filter="blur(2px)"
          animate={{ 
            offsetDistance: ["0%", "100%"],
            opacity: [0, 0.3, 0],
          }}
          transition={{ 
            duration: duration * 2,
            ease: "linear",
            repeat: Infinity,
            delay: i * (duration * 0.5),
          }}
          style={{ 
            offsetPath: `path("${edgePath}")`,
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
  onAgentClick?: (agentId: string) => void;
}

// Edge tooltip component
function EdgeTooltip({ 
  edgeData, 
  onClose,
}: { 
  edgeData: { source: string; target: string; sourceLabel: string; targetLabel: string } | null;
  onClose: () => void;
}) {
  const { edgeMessages } = useContext(NetworkContext);
  
  if (!edgeData) return null;
  
  const edgeKey = `${edgeData.source}-${edgeData.target}`;
  const messageData = edgeMessages.get(edgeKey);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 bg-zinc-900/95 backdrop-blur border border-cyan-500/50 rounded-lg p-4 
                 shadow-xl shadow-cyan-500/20 z-50 min-w-[250px]"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
      >
        ✕
      </button>
      
      <div className="text-sm font-semibold text-foreground mb-2">
        {edgeData.sourceLabel} → {edgeData.targetLabel}
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Messages</span>
          <span className="text-cyan-400 font-semibold">{messageData?.count || 0}</span>
        </div>
        
        {messageData?.lastMessage && (
          <div className="border-t border-zinc-800 pt-2 mt-2">
            <div className="text-zinc-500 mb-1">Last message:</div>
            <div className="text-zinc-300 italic line-clamp-2">
              "{messageData.lastMessage}"
            </div>
            {messageData.lastMessageTime && (
              <div className="text-zinc-500 text-[10px] mt-1">
                {new Date(messageData.lastMessageTime).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Calculate agent activity levels based on tasks and messages
function calculateAgentActivity(
  agents: Agent[],
  tasks: any[],
  messages: any[],
  conversations: any[]
): Map<string, AgentActivity> {
  const activityMap = new Map<string, AgentActivity>();
  
  // Count tasks per agent
  const taskCounts = new Map<string, number>();
  tasks.forEach((task) => {
    if (task.assignedToId) {
      taskCounts.set(task.assignedToId, (taskCounts.get(task.assignedToId) || 0) + 1);
    }
  });
  
  // Count messages per agent
  const messageCounts = new Map<string, number>();
  messages.forEach((msg) => {
    if (msg.fromAgentId) {
      messageCounts.set(msg.fromAgentId, (messageCounts.get(msg.fromAgentId) || 0) + 1);
    }
    if (msg.toAgentId) {
      messageCounts.set(msg.toAgentId, (messageCounts.get(msg.toAgentId) || 0) + 1);
    }
  });
  
  // Calculate activity level for each agent
  agents.forEach((agent) => {
    const taskCount = taskCounts.get(agent.id) || 0;
    const messageCount = messageCounts.get(agent.id) || 0;
    const totalActivity = taskCount * 2 + messageCount; // Weight tasks more heavily
    
    let activityLevel: 'hot' | 'warm' | 'cool' | 'idle';
    if (totalActivity === 0) {
      activityLevel = 'idle';
    } else if (totalActivity >= 20) {
      activityLevel = 'hot';
    } else if (totalActivity >= 10) {
      activityLevel = 'warm';
    } else {
      activityLevel = 'cool';
    }
    
    activityMap.set(agent.id, {
      taskCount,
      messageCount,
      activityLevel,
    });
  });
  
  return activityMap;
}

// Calculate message counts for edges
function calculateEdgeMessages(
  messages: any[],
  conversations: any[]
): Map<string, EdgeMessageData> {
  const edgeMap = new Map<string, EdgeMessageData>();
  
  // Count direct messages between agents
  messages.forEach((msg) => {
    if (msg.fromAgentId && msg.toAgentId) {
      const key = `${msg.fromAgentId}-${msg.toAgentId}`;
      const existing = edgeMap.get(key) || { count: 0 };
      edgeMap.set(key, {
        count: existing.count + 1,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt,
      });
    }
  });
  
  // Add conversation data
  conversations.forEach((conv) => {
    if (conv.agents && conv.agents.length === 2) {
      const [agent1, agent2] = conv.agents;
      const key = `${agent1.id}-${agent2.id}`;
      const existing = edgeMap.get(key) || { count: 0 };
      if (conv.messageCount > existing.count) {
        edgeMap.set(key, {
          count: conv.messageCount,
          lastMessage: conv.latestMessage?.content,
          lastMessageTime: conv.latestMessage?.createdAt,
        });
      }
    }
  });
  
  return edgeMap;
}

// Convert API agents to ReactFlow nodes and edges
function buildNodesAndEdges(
  agents: Agent[], 
  compact: boolean,
  agentActivity: Map<string, AgentActivity>
): { nodes: Node<AgentNodeData>[]; edges: Edge[] } {
  const nodes: Node<AgentNodeData>[] = [
    {
      id: "human",
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        label: "Human",
        agentId: "human",
        role: "ceo",
        level: 10,
        status: "active",
        credits: 0,
        isHuman: true,
        compact,
      },
    },
  ];

  const edges: Edge[] = [];

  agents.forEach((agent) => {
    const activity = agentActivity.get(agent.id);
    
    nodes.push({
      id: agent.id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        label: agent.name,
        agentId: agent.agentId || agent.id,
        role: agent.role,
        level: agent.level,
        status: agent.status as unknown as "active" | "pending" | "paused" | "suspended",
        credits: agent.currentBalance,
        domain: agent.domain || undefined,
        avatar: (agent as any).avatar || undefined,
        tasksCompleted: 0,
        compact,
        activityLevel: activity?.activityLevel,
        taskCount: activity?.taskCount,
      },
    });

    const parentId = agent.parentId || (agent.level >= 9 ? "human" : undefined);
    if (parentId) {
      // Use activity-based color for edge
      let color = levelColors[agent.level] || "#6366f1";
      if (activity) {
        switch (activity.activityLevel) {
          case 'hot':
            color = heatColors.hot;
            break;
          case 'warm':
            color = heatColors.warm;
            break;
          case 'cool':
            color = heatColors.cool;
            break;
          default:
            color = heatColors.idle;
        }
      }
      
      edges.push({
        id: `e-${parentId}-${agent.id}`,
        source: parentId,
        target: agent.id,
        sourceHandle: "bottom",
        targetHandle: "top",
        type: "taskFlow",
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}

// Touch-optimized zoom controls for mobile
function MobileZoomControls({ onFitView }: { onFitView: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();
  
  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className="w-12 h-12 rounded-xl bg-card/95 backdrop-blur border border-border 
                   text-foreground text-xl font-bold flex items-center justify-center
                   active:bg-zinc-600 transition-colors shadow-lg"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className="w-12 h-12 rounded-xl bg-card/95 backdrop-blur border border-border 
                   text-foreground text-xl font-bold flex items-center justify-center
                   active:bg-zinc-600 transition-colors shadow-lg"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={onFitView}
        className="w-12 h-12 rounded-xl bg-card/95 backdrop-blur border border-border 
                   text-foreground text-sm font-semibold flex items-center justify-center
                   active:bg-zinc-600 transition-colors shadow-lg"
        aria-label="Fit view"
        title="Fit all nodes"
      >
        ⊡
      </button>
    </div>
  );
}

// Inner component
function AgentNetworkInner({ className, onAgentClick }: AgentNetworkProps) {
  const demo = useDemo();
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { messages } = useMessages(100);
  const { conversations } = useConversations();
  const { fitView, zoomIn, setCenter, getNode } = useReactFlow();
  const { isMobileOrTouch, isMobile } = useTouchDevice();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ 
    source: string; 
    target: string; 
    sourceLabel: string; 
    targetLabel: string;
  } | null>(null);
  const [activeDelegations, setActiveDelegations] = useState<TaskDelegation[]>([]);
  const [compact, setCompact] = useState(false);
  const [dimIdle, setDimIdle] = useState(false);
  const [isLayouted, setIsLayouted] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const agentHealth = useAgentHealth();
  const prevAgentCountRef = useRef(0);
  
  // Double-tap detection for zoom-to-node
  const lastTapRef = useRef<{ time: number; nodeId: string | null }>({ time: 0, nodeId: null });
  // Long-press detection
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressNodeRef = useRef<string | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  
  const loading = agentsLoading || tasksLoading;
  
  // Handle fit view for mobile controls
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);
  
  // Calculate activity metrics
  const agentActivity = useMemo(() => {
    return calculateAgentActivity(agents, tasks, messages, conversations);
  }, [agents, tasks, messages, conversations]);
  
  const edgeMessages = useMemo(() => {
    return calculateEdgeMessages(messages, conversations);
  }, [messages, conversations]);
  
  // Listen for avatar style changes
  useEffect(() => {
    const handleAvatarChange = () => {
      setAvatarVersion(v => v + 1);
    };
    window.addEventListener('avatar-style-changed', handleAvatarChange);
    return () => window.removeEventListener('avatar-style-changed', handleAvatarChange);
  }, []);

  // Only re-layout when agent IDs change (add/remove), not on every data update
  const agentIds = useMemo(
    () => agents.map((a) => a.id).sort().join(','),
    [agents],
  );

  // Auto-layout — use slightly more spacing on mobile to accommodate larger nodes
  useEffect(() => {
    if (loading) return;
    
    setIsLayouted(false);
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(agents, compact, agentActivity);
    
    getLayoutedElements(newNodes, newEdges, { compact }).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouted(true);
      
      prevAgentCountRef.current = agents.length;
      
      // More padding on mobile so nodes aren't clipped at edges
      const padding = isMobileOrTouch ? 0.25 : 0.15;
      setTimeout(() => fitView({ padding, duration: isMobileOrTouch ? 400 : 800 }), 50);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentIds, loading, compact, isMobileOrTouch, setNodes, setEdges, fitView]);

  // Task delegation simulation — use ref for edges to avoid interval restart on edge changes
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // In sandbox mode: create real delegation animations from SSE events
  useSandboxSSE(useCallback((event: SandboxSSEEvent) => {
    if (!isSandboxMode) return;
    if (!event.message?.includes('Delegated') && event.type !== 'agent_action') return;
    if (!event.agentId) return;

    // Find an edge from this agent
    const currentEdges = edgesRef.current;
    const edge = currentEdges.find(e => e.source === event.agentId || e.target === event.agentId);
    if (!edge) return;

    const delegation: TaskDelegation = {
      id: `del-${Date.now()}-${Math.random()}`,
      fromId: edge.source,
      toId: edge.target,
      taskTitle: event.message || 'Task delegation',
      startTime: Date.now(),
    };

    setActiveDelegations((prev) => [...prev, delegation]);
    setTimeout(() => {
      setActiveDelegations((prev) => prev.filter((d) => d.id !== delegation.id));
    }, 1200);
  }, []));

  // Random delegation animation for demo mode (not sandbox)
  useEffect(() => {
    if (isSandboxMode) return;
    if (!demo.isPlaying || nodes.length === 0) return;

    const taskTitles = [
      "Review PR #42", "Deploy v2.1", "Fix auth bug", "Update docs",
      "Run tests", "Code review", "Setup CI/CD", "Refactor API",
    ];

    const interval = setInterval(() => {
      const currentEdges = edgesRef.current;
      if (currentEdges.length === 0) return;
      
      const randomEdge = currentEdges[Math.floor(Math.random() * currentEdges.length)];
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
  }, [demo.isPlaying, demo.speed, nodes.length]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    const now = Date.now();
    const lastTap = lastTapRef.current;
    
    // Double-tap detection: zoom to node on double-tap (mobile)
    if (
      isMobileOrTouch &&
      lastTap.nodeId === node.id &&
      now - lastTap.time < 400
    ) {
      // Double-tap → zoom into this node
      const nodeWidth = compact ? 90 : 160;
      const nodeHeight = compact ? 64 : 96;
      setCenter(
        node.position.x + nodeWidth / 2,
        node.position.y + nodeHeight / 2,
        { zoom: 1.3, duration: 400 }
      );
      lastTapRef.current = { time: 0, nodeId: null };
      return;
    }
    
    lastTapRef.current = { time: now, nodeId: node.id };
    
    setSelectedNode(node as Node<AgentNodeData>);
    setSelectedEdge(null);
    if (node.id !== "human") {
      onAgentClick?.(node.id);
    }
  }
  
  // Long-press handler for touch devices — opens detail panel
  function handleNodeMouseDown(_event: React.MouseEvent, node: Node) {
    if (!isMobileOrTouch) return;
    longPressNodeRef.current = node.id;
    longPressTimerRef.current = setTimeout(() => {
      if (longPressNodeRef.current === node.id && node.id !== "human") {
        onAgentClick?.(node.id);
        setSelectedNode(node as Node<AgentNodeData>);
      }
    }, 500); // 500ms long-press
  }
  
  function handleNodeMouseUp() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressNodeRef.current = null;
  }

  function handleEdgeClick(_event: React.MouseEvent, edge: Edge) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      setSelectedEdge({
        source: edge.source,
        target: edge.target,
        sourceLabel: String((sourceNode.data as AgentNodeData).label || edge.source),
        targetLabel: String((targetNode.data as AgentNodeData).label || edge.target),
      });
      setSelectedNode(null);
    }
  }

  const contextValue = useMemo(() => ({
    delegations: activeDelegations,
    speed: demo.speed,
    avatarVersion,
    agentActivity,
    edgeMessages,
    agentHealth,
    isMobileOrTouch,
    dimIdle,
  }), [activeDelegations, demo.speed, avatarVersion, agentActivity, edgeMessages, agentHealth, isMobileOrTouch, dimIdle]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-zinc-400">Loading network...</div>
      </div>
    );
  }

  return (
    <NetworkContext.Provider value={contextValue}>
      <div className={`relative ${className}`}>
        <ReactFlow
          nodes={nodes}
          edges={isLayouted ? edges : []}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={undefined}
          onNodeMouseLeave={handleNodeMouseUp}
          onEdgeClick={handleEdgeClick}
          edgeTypes={edgeTypes}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2.0}
          /* Touch: ReactFlow natively supports pinch-to-zoom and pan.
             Ensure these are enabled and not accidentally blocked. */
          panOnDrag
          panOnScroll={false}
          zoomOnPinch
          zoomOnScroll={!isMobileOrTouch}
          zoomOnDoubleClick={false}
          preventScrolling
          /* Disable node dragging on mobile to prevent accidental moves */
          nodesDraggable={!isMobileOrTouch}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "taskFlow",
            animated: !isMobileOrTouch,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
            style: { stroke: "#6366f1", strokeWidth: 2 },
          }}
          onNodeDragStart={handleNodeMouseDown as any}
          onNodeDragStop={handleNodeMouseUp as any}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
          {/* Desktop: standard controls. Mobile: hidden (replaced by MobileZoomControls) */}
          {!isMobileOrTouch && (
            <Controls className="!bg-card !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
          )}
        </ReactFlow>
        
        {/* Mobile touch controls — large tap targets */}
        {isMobileOrTouch && (
          <MobileZoomControls onFitView={handleFitView} />
        )}

        {/* Legend — hidden on very small touch devices to save space */}
        <div className={`absolute top-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-2 sm:p-4 text-sm max-w-[140px] sm:max-w-none landscape:hidden lg:landscape:block ${isMobile ? 'hidden sm:block' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground text-xs sm:text-sm">Activity</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDimIdle(!dimIdle)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  dimIdle
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-muted text-muted-foreground border border-border hover:bg-accent'
                }`}
                title={dimIdle ? "Show all nodes" : "Dim idle nodes"}
              >
                {dimIdle ? "◐" : "◑"}
              </button>
              <button
                onClick={() => setCompact(!compact)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  compact 
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                    : 'bg-muted text-muted-foreground border border-border hover:bg-accent'
                }`}
                title={compact ? "Expand nodes" : "Compact nodes"}
              >
                {compact ? "▪" : "▫"}
              </button>
            </div>
          </div>
          <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
            {[
              { label: "Hot", color: heatColors.hot, desc: "Very busy" },
              { label: "Warm", color: heatColors.warm, desc: "Busy" },
              { label: "Cool", color: heatColors.cool, desc: "Light" },
              { label: "Idle", color: heatColors.idle, desc: "Inactive" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-muted-foreground/70 hidden sm:inline text-[10px]">{item.desc}</span>
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
              className="absolute bottom-20 sm:bottom-auto sm:top-4 left-4 right-4 sm:left-auto sm:right-4 bg-card/95 backdrop-blur border border-border rounded-lg p-4 sm:w-64"
            >
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
              <div className="text-base sm:text-lg font-semibold text-foreground mb-1">
                {(selectedNode.data as AgentNodeData).label}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mb-3">
                {(selectedNode.data as AgentNodeData).isHuman
                  ? "Human Operator"
                  : `Level ${(selectedNode.data as AgentNodeData).level} ${roleLabels[(selectedNode.data as AgentNodeData).role] || (selectedNode.data as AgentNodeData).role}`}
              </div>
              {!(selectedNode.data as AgentNodeData).isHuman && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Activity</span>
                    <span className="text-foreground capitalize">
                      {agentActivity.get((selectedNode.data as AgentNodeData).agentId)?.activityLevel || 'idle'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tasks</span>
                    <span className="text-violet-400">
                      {agentActivity.get((selectedNode.data as AgentNodeData).agentId)?.taskCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Credits</span>
                    <span className="text-foreground">{(selectedNode.data as AgentNodeData).credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Status</span>
                    <span className={(selectedNode.data as AgentNodeData).status === "active" ? "text-emerald-500" : "text-amber-500"}>
                      {(selectedNode.data as AgentNodeData).status}
                    </span>
                  </div>
                  {(selectedNode.data as AgentNodeData).domain && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Domain</span>
                      <span className="text-foreground">{(selectedNode.data as AgentNodeData).domain}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edge tooltip */}
        <AnimatePresence>
          {selectedEdge && (
            <EdgeTooltip edgeData={selectedEdge} onClose={() => setSelectedEdge(null)} />
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
                    className="bg-zinc-900/95 backdrop-blur border border-emerald-500/30 rounded-lg px-3 py-1.5 mb-1 text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                    style={{ position: idx === 0 ? 'relative' : 'absolute', bottom: 0 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="text-zinc-400 truncate max-w-[60px]">{String(fromNode?.data?.label || "") || del.fromId}</span>
                    <span className="text-emerald-500">→</span>
                    <span className="text-zinc-400 truncate max-w-[60px]">{String(toNode?.data?.label || "") || del.toId}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </NetworkContext.Provider>
  );
}

// Wrapper with ReactFlowProvider
export function AgentNetwork({ className, onAgentClick }: AgentNetworkProps) {
  return (
    <ReactFlowProvider>
      <AgentNetworkInner className={className} onAgentClick={onAgentClick} />
    </ReactFlowProvider>
  );
}
