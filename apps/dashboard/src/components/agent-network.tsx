/**
 * AgentNetwork — ReactFlow-based visualisation of the agent org-chart.
 *
 * Sub-components have been extracted to keep this file manageable:
 *   agent-network-context.tsx  – shared types, constants, NetworkContext
 *   agent-network-node.tsx     – AgentNode custom node
 *   agent-network-edge.tsx     – TaskFlowEdge + EdgeTooltip
 */
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import { motion, AnimatePresence } from "motion/react";
import ELK from "elkjs/lib/elk.bundled.js";
import "@xyflow/react/dist/style.css";
import { useDemo } from "../demo";
import { isSandboxMode } from "@openspawn/dashboard-data";
import { useSandboxSSE, type SandboxSSEEvent } from "../hooks/use-sandbox-sse";
import { useAgents, type Agent } from "../hooks/use-agents";
import { useTasks, type Task } from "../hooks/use-tasks";
import {
  useMessages,
  useConversations,
  type Message,
  type Conversation,
} from "../hooks/use-messages";
import { resolveAvatarUrl } from "../lib/resolve-avatar-url";
import { useAgentHealth } from "../hooks/use-agent-health";
import { useTouchDevice } from "../hooks/use-touch-device";
import { levelColors } from "../lib/status-colors";

// Extracted sub-components
import {
  NetworkContext,
  heatColors,
  type TaskDelegation,
  type AgentActivity,
  type EdgeMessageData,
  type AgentNodeData,
} from "./agent-network-context";
import { AgentNode } from "./agent-network-node";
import { TaskFlowEdge, EdgeTooltip } from "./agent-network-edge";

// ─── ELK layout ───────────────────────────────────────────────────────────────

const elk = new ELK();

interface LayoutOptions {
  compact: boolean;
}

async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = { compact: false },
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
    children: nodes.map((node) => ({ id: node.id, width: nodeWidth, height: nodeHeight })),
    edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const layoutedGraph = await elk.layout(elkGraph);

  const layoutedNodes = nodes.map((node) => {
    const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return { ...node, position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 } };
  });

  return { nodes: layoutedNodes, edges };
}

// ─── Activity + edge-message calculations ─────────────────────────────────────

function calculateAgentActivity(
  agents: Agent[],
  tasks: Task[],
  messages: Message[],
  conversations: Conversation[],
): Map<string, AgentActivity> {
  const activityMap = new Map<string, AgentActivity>();

  const taskCounts = new Map<string, number>();
  tasks.forEach((task) => {
    if (task.assigneeId)
      taskCounts.set(task.assigneeId, (taskCounts.get(task.assigneeId) || 0) + 1);
  });

  const messageCounts = new Map<string, number>();
  messages.forEach((msg) => {
    if (msg.fromAgentId)
      messageCounts.set(msg.fromAgentId, (messageCounts.get(msg.fromAgentId) || 0) + 1);
    if (msg.toAgentId)
      messageCounts.set(msg.toAgentId, (messageCounts.get(msg.toAgentId) || 0) + 1);
  });

  agents.forEach((agent) => {
    const taskCount = taskCounts.get(agent.id) || 0;
    const messageCount = messageCounts.get(agent.id) || 0;
    const total = taskCount * 2 + messageCount;

    const activityLevel: AgentActivity["activityLevel"] =
      total === 0 ? "idle" : total >= 20 ? "hot" : total >= 10 ? "warm" : "cool";

    activityMap.set(agent.id, { taskCount, messageCount, activityLevel });
  });

  // Suppress unused variable warning (conversations used for future edge data)
  void conversations;

  return activityMap;
}

function calculateEdgeMessages(
  messages: Message[],
  conversations: Conversation[],
): Map<string, EdgeMessageData> {
  const edgeMap = new Map<string, EdgeMessageData>();

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

// ─── Graph construction ───────────────────────────────────────────────────────

function buildNodesAndEdges(
  agents: Agent[],
  compact: boolean,
  agentActivity: Map<string, AgentActivity>,
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
        avatar: agent.avatar || undefined,
        avatarColor: agent.avatarColor || undefined,
        avatarUrl: resolveAvatarUrl(agent.avatarUrl) || undefined,
        tasksCompleted: 0,
        compact,
        activityLevel: activity?.activityLevel,
        taskCount: activity?.taskCount,
      },
    });

    const parentId = agent.parentId || (agent.level >= 9 ? "human" : undefined);
    if (parentId) {
      let color = levelColors[agent.level] || "#6366f1";
      if (activity) {
        switch (activity.activityLevel) {
          case "hot":
            color = heatColors.hot;
            break;
          case "warm":
            color = heatColors.warm;
            break;
          case "cool":
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

// ─── Mobile zoom controls ─────────────────────────────────────────────────────

function MobileZoomControls({ onFitView }: { onFitView: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className="w-12 h-12 rounded-xl bg-card/95 backdrop-blur border border-border text-foreground text-xl font-bold flex items-center justify-center active:bg-zinc-600 transition-colors shadow-lg"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className="w-12 h-12 rounded-xl bg-card/95 backdrop-blur border border-border text-foreground text-xl font-bold flex items-center justify-center active:bg-zinc-600 transition-colors shadow-lg"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={onFitView}
        className="w-12 h-12 rounded-xl bg-card/95 backdrop-blur border border-border text-foreground text-sm font-semibold flex items-center justify-center active:bg-zinc-600 transition-colors shadow-lg"
        aria-label="Fit view"
        title="Fit all nodes"
      >
        ⊡
      </button>
    </div>
  );
}

// ─── ReactFlow node / edge type maps ─────────────────────────────────────────

const nodeTypes = { agent: AgentNode };
const edgeTypes = { taskFlow: TaskFlowEdge };

// ─── AgentNetworkInner ────────────────────────────────────────────────────────

interface AgentNetworkProps {
  className?: string;
  onAgentClick?: (agentId: string) => void;
}

function AgentNetworkInner({ className, onAgentClick }: AgentNetworkProps) {
  const demo = useDemo();
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { messages } = useMessages();
  const { conversations } = useConversations();
  const { fitView, setCenter } = useReactFlow();
  const { isMobileOrTouch, isMobile } = useTouchDevice();

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

  const agentHealth = useAgentHealth();
  const prevAgentCountRef = useRef(0);
  const lastTapRef = useRef<{ time: number; nodeId: string | null }>({ time: 0, nodeId: null });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressNodeRef = useRef<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  const loading = agentsLoading || tasksLoading;

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  const agentActivity = useMemo(
    () => calculateAgentActivity(agents, tasks, messages, conversations),
    [agents, tasks, messages, conversations],
  );

  const edgeMessages = useMemo(
    () => calculateEdgeMessages(messages, conversations),
    [messages, conversations],
  );

  const agentIds = useMemo(
    () =>
      agents
        .map((a) => a.id)
        .sort()
        .join(","),
    [agents],
  );

  // Re-layout only when agent IDs change (not on every data update)
  useEffect(() => {
    if (loading) return;
    setIsLayouted(false);
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(agents, compact, agentActivity);
    getLayoutedElements(newNodes, newEdges, { compact }).then(({ nodes: ln, edges: le }) => {
      setNodes(ln);
      setEdges(le);
      setIsLayouted(true);
      prevAgentCountRef.current = agents.length;
      const padding = isMobileOrTouch ? 0.25 : 0.15;
      setTimeout(() => fitView({ padding, duration: isMobileOrTouch ? 400 : 800 }), 50);
    });
  }, [agentIds, loading, compact, isMobileOrTouch, setNodes, setEdges, fitView]);

  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Sandbox mode: real delegation animations from SSE
  useSandboxSSE(
    useCallback((event: SandboxSSEEvent) => {
      if (!isSandboxMode) return;
      if (!event.message?.includes("Delegated") && event.type !== "agent_action") return;
      if (!event.agentId) return;

      const edge = edgesRef.current.find(
        (e) => e.source === event.agentId || e.target === event.agentId,
      );
      if (!edge) return;

      const delegation: TaskDelegation = {
        id: `del-${Date.now()}-${Math.random()}`,
        fromId: edge.source,
        toId: edge.target,
        taskTitle: event.message || "Task delegation",
        startTime: Date.now(),
      };
      setActiveDelegations((prev) => [...prev, delegation]);
      setTimeout(
        () => setActiveDelegations((prev) => prev.filter((d) => d.id !== delegation.id)),
        1200,
      );
    }, []),
  );

  // Demo mode: random delegation animation
  useEffect(() => {
    if (isSandboxMode) return;
    if (!demo.isPlaying || nodes.length === 0) return;

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
      setTimeout(
        () => setActiveDelegations((prev) => prev.filter((d) => d.id !== delegation.id)),
        animDuration,
      );
    }, 800 / demo.speed);

    return () => clearInterval(interval);
  }, [demo.isPlaying, demo.speed, nodes.length]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    // Double-tap: zoom to node on mobile
    if (isMobileOrTouch && lastTap.nodeId === node.id && now - lastTap.time < 400) {
      const nw = compact ? 90 : 160;
      const nh = compact ? 64 : 96;
      setCenter(node.position.x + nw / 2, node.position.y + nh / 2, { zoom: 1.3, duration: 400 });
      lastTapRef.current = { time: 0, nodeId: null };
      return;
    }
    lastTapRef.current = { time: now, nodeId: node.id };
    setSelectedEdge(null);
    if (node.id !== "human") onAgentClick?.(node.id);
  }

  function handleNodeMouseDown(_event: React.MouseEvent, node: Node, _nodes: Node[]) {
    if (!isMobileOrTouch) return;
    longPressNodeRef.current = node.id;
    longPressTimerRef.current = setTimeout(() => {
      if (longPressNodeRef.current === node.id && node.id !== "human") onAgentClick?.(node.id);
    }, 500);
  }

  function clearLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressNodeRef.current = null;
  }

  function handleNodeMouseUp(_event: React.MouseEvent, _node: Node, _nodes: Node[]) {
    clearLongPress();
  }

  function handleNodeMouseLeave(_event: React.MouseEvent, _node: Node) {
    clearLongPress();
  }

  function handleEdgeClick(_event: React.MouseEvent, edge: Edge) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      setSelectedEdge({
        source: edge.source,
        target: edge.target,
        sourceLabel: String((sourceNode.data as AgentNodeData).label || edge.source),
        targetLabel: String((targetNode.data as AgentNodeData).label || edge.target),
      });
    }
  }

  const contextValue = useMemo(
    () => ({
      delegations: activeDelegations,
      speed: demo.speed,
      agentActivity,
      edgeMessages,
      agentHealth,
      isMobileOrTouch,
      dimIdle,
    }),
    [
      activeDelegations,
      demo.speed,
      agentActivity,
      edgeMessages,
      agentHealth,
      isMobileOrTouch,
      dimIdle,
    ],
  );

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
          onNodeMouseLeave={handleNodeMouseLeave}
          onEdgeClick={handleEdgeClick}
          edgeTypes={edgeTypes}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2.0}
          panOnDrag
          panOnScroll={false}
          zoomOnPinch
          zoomOnScroll={!isMobileOrTouch}
          zoomOnDoubleClick={false}
          preventScrolling
          nodesDraggable={!isMobileOrTouch}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "taskFlow",
            animated: !isMobileOrTouch,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
            style: { stroke: "#6366f1", strokeWidth: 2 },
          }}
          onNodeDragStart={handleNodeMouseDown}
          onNodeDragStop={handleNodeMouseUp}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--border))"
          />
          {!isMobileOrTouch && (
            <Controls className="!bg-card !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
          )}
        </ReactFlow>

        {isMobileOrTouch && <MobileZoomControls onFitView={handleFitView} />}

        {/* Activity legend */}
        <div
          className={`absolute top-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-2 sm:p-4 text-sm max-w-[140px] sm:max-w-none landscape:hidden lg:landscape:block ${isMobile ? "hidden sm:block" : ""}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground text-xs sm:text-sm">Activity</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDimIdle(!dimIdle)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${dimIdle ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-muted text-muted-foreground border border-border hover:bg-accent"}`}
                title={dimIdle ? "Show all nodes" : "Dim idle nodes"}
              >
                {dimIdle ? "◐" : "◑"}
              </button>
              <button
                onClick={() => setCompact(!compact)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${compact ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-muted text-muted-foreground border border-border hover:bg-accent"}`}
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
                <div
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-muted-foreground/70 hidden sm:inline text-[10px]">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Edge tooltip */}
        <AnimatePresence>
          {selectedEdge && (
            <EdgeTooltip edgeData={selectedEdge} onClose={() => setSelectedEdge(null)} />
          )}
        </AnimatePresence>

        {/* Task Flow Feed (demo mode) */}
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
                    style={{ position: idx === 0 ? "relative" : "absolute", bottom: 0 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="text-zinc-400 truncate max-w-[60px]">
                      {String(fromNode?.data?.label || "") || del.fromId}
                    </span>
                    <span className="text-emerald-500">→</span>
                    <span className="text-zinc-400 truncate max-w-[60px]">
                      {String(toNode?.data?.label || "") || del.toId}
                    </span>
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

// ─── Public export ────────────────────────────────────────────────────────────

export function AgentNetwork({ className, onAgentClick }: AgentNetworkProps) {
  return (
    <ReactFlowProvider>
      <AgentNetworkInner className={className} onAgentClick={onAgentClick} />
    </ReactFlowProvider>
  );
}
