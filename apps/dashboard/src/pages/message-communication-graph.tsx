/**
 * CommunicationGraph — ReactFlow-based view of agent-to-agent message links.
 * Extracted from messages.tsx to reduce file size.
 */
import { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "motion/react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { isSandboxMode } from "../graphql/fetcher";
import { useSandboxSSE, type SandboxSSEEvent } from "../hooks/use-sandbox-sse";
import type { Message } from "../hooks";
import { InlineAvatar, formatTime } from "./message-utils";

interface CommunicationGraphProps {
  messages: Message[];
  agents: any[];
}

export function CommunicationGraph({ messages, agents }: CommunicationGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pulsingEdges, setPulsingEdges] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (agents.length === 0) return;

    const radius = isMobile ? 120 : 200;
    const centerX = isMobile ? 180 : 300;
    const centerY = isMobile ? 180 : 250;
    const maxAgents = isMobile ? 6 : 8;

    const agentNodes: Node[] = agents.slice(0, maxAgents).map((agent, i) => {
      const angle = (i / Math.min(agents.length, maxAgents)) * 2 * Math.PI - Math.PI / 2;
      return {
        id: agent.id,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: {
          label: (
            <div className="flex flex-col items-center gap-0.5 p-1 md:p-2">
              <InlineAvatar
                agentId={agent.id}
                agents={agents}
                className="w-8 h-8 md:w-10 md:h-10"
                fontSize="text-base md:text-lg"
              />
              <span className="text-[10px] md:text-xs font-medium truncate max-w-[60px] md:max-w-[80px]">
                {agent.name}
              </span>
              <Badge variant="outline" className="text-[8px] md:text-[10px] px-1">
                L{agent.level}
              </Badge>
            </div>
          ),
        },
        style: {
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "12px",
          padding: "2px",
        },
      };
    });

    const visibleAgentIds = new Set(agentNodes.map((n) => n.id));
    const messagePairs = new Map<string, number>();
    messages.forEach((msg) => {
      if (!visibleAgentIds.has(msg.fromAgentId) || !visibleAgentIds.has(msg.toAgentId)) return;
      if (msg.fromAgentId === msg.toAgentId) return;
      const key = [msg.fromAgentId, msg.toAgentId].sort().join("::");
      messagePairs.set(key, (messagePairs.get(key) || 0) + 1);
    });

    const edgeList: Edge[] = Array.from(messagePairs.entries()).map(([key, count]) => {
      const [source, target] = key.split("::");
      return {
        id: key,
        source,
        target,
        animated: pulsingEdges.has(key),
        style: {
          stroke: pulsingEdges.has(key) ? "#22c55e" : "hsl(var(--primary))",
          strokeWidth: Math.min(count, 4),
          opacity: pulsingEdges.has(key) ? 1 : 0.6,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
      };
    });

    setNodes(agentNodes);
    setEdges(edgeList);
  }, [agents, messages, pulsingEdges, isMobile, setNodes, setEdges]);

  // Sandbox mode: pulse edges from real SSE events
  useSandboxSSE(
    useCallback(
      (event: SandboxSSEEvent) => {
        if (!isSandboxMode) return;
        if (event.agentId) {
          const relevantEdge = edges.find(
            (e) => e.source === event.agentId || e.target === event.agentId,
          );
          if (relevantEdge) {
            const key = [relevantEdge.source, relevantEdge.target].sort().join("::");
            setPulsingEdges(new Set([key]));
            setTimeout(() => setPulsingEdges(new Set()), 1000);
          }
        }
      },
      [edges],
    ),
  );

  // Demo mode: simulate live message flow
  useEffect(() => {
    if (isSandboxMode) return;
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const key = [randomMsg.fromAgentId, randomMsg.toAgentId].sort().join("::");
      setPulsingEdges(new Set([key]));
      setTimeout(() => setPulsingEdges(new Set()), 1000);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  const selectedMessages = selectedEdge
    ? messages.filter((m) => [m.fromAgentId, m.toAgentId].sort().join("::") === selectedEdge)
    : [];

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 h-[350px] md:h-[500px] bg-muted/50 rounded-lg border border-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="hsl(var(--border))" gap={20} />
          <Controls className="bg-card border-border" />
        </ReactFlow>
      </div>

      {selectedEdge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:w-72"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                💬 Conversation ({selectedMessages.length})
                <Button variant="ghost" size="sm" onClick={() => setSelectedEdge(null)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] md:h-[380px]">
                <div className="space-y-2">
                  {selectedMessages.slice(0, 20).map((msg) => (
                    <div key={msg.id} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <InlineAvatar
                          agentId={msg.fromAgentId}
                          agents={agents}
                          className="w-5 h-5"
                        />
                        <span className="text-xs font-medium">
                          {msg.fromAgent?.name || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
