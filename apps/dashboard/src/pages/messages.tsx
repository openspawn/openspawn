import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { TypingIndicator } from '../components/presence';
import { usePresence, useTeams } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/ui/empty-state';
import { PageHeader } from '../components/ui/page-header';
import { darkenForBackground } from '../lib/avatar-utils';
import { PhaseChip } from '../components/phase-chip';
import { TeamBadge, TeamFilterDropdown } from '../components/team-badge';
import { ThreadView } from '../components/thread-view';
import { useMessages, useAgents, useCurrentPhase, type Message } from '../hooks';
import { isSandboxMode } from '../graphql/fetcher';
import { useSandboxSSE, type SandboxSSEEvent } from '../hooks/use-sandbox-sse';

// Inline emoji avatar for lightweight rendering in message views
function InlineAvatar({ agentId, agents, className = 'w-5 h-5', fontSize = 'text-xs' }: { agentId: string; agents: any[]; className?: string; fontSize?: string }) {
  const agent = agents.find((a: any) => a.id === agentId);
  const avatar = (agent as any)?.avatar;
  const avatarColor = (agent as any)?.avatarColor || '#71717a';
  const avatarUrl = (agent as any)?.avatarUrl;
  if (avatarUrl) {
    return <img src={avatarUrl} alt={agent?.name} className={`rounded-full object-contain p-0.5 ${className}`} style={{ backgroundColor: darkenForBackground(avatarColor) }} />;
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${fontSize} ${className}`}
      style={{ backgroundColor: darkenForBackground(avatarColor) }}
    >
      {avatar || '🤖'}
    </span>
  );
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const typeColors: Record<string, string> = {
  TASK: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  STATUS: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  REPORT: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
  QUESTION: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  ESCALATION: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  GENERAL: 'bg-secondary text-muted-foreground border-border',
};

const typeIcons: Record<string, string> = {
  TASK: '📋',
  STATUS: '✅',
  REPORT: '📊',
  QUESTION: '❓',
  ESCALATION: '🚨',
  GENERAL: '💬',
};

// ACP message rendering for sandbox mode
const acpTypeRenderers: Record<string, (msg: Message) => { label: string; className: string; compact?: boolean }> = {
  ack: () => ({ label: '👍 Acknowledged', className: 'bg-muted/60 text-muted-foreground text-[10px] rounded-full px-2 py-0.5 inline-block', compact: true }),
  delegation: (msg) => ({ label: `📋 Delegated: ${msg.taskRef || 'task'}`, className: 'border-l-4 border-l-blue-500 bg-blue-500/5 pl-2' }),
  progress: (msg) => ({ label: `📊 ${msg.content}`, className: 'bg-muted/30' }),
  escalation: (msg) => ({ label: `⚠️ Escalated: ${(msg as any).reason || 'unknown'} — ${msg.content}`, className: 'bg-red-500/10 border border-red-500/20' }),
  completion: (msg) => ({ label: `✅ Completed: ${(msg as any).summary || msg.content}`, className: 'bg-emerald-500/10 border border-emerald-500/20' }),
};

// ============================================================
// VIEW 1: Communication Graph (Mobile-Responsive)
// ============================================================
function CommunicationGraph({ messages, agents }: { messages: Message[]; agents: any[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pulsingEdges, setPulsingEdges] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (agents.length === 0) return;

    // Responsive layout - smaller radius and center on mobile
    const radius = isMobile ? 120 : 200;
    const centerX = isMobile ? 180 : 300;
    const centerY = isMobile ? 180 : 250;
    const maxAgents = isMobile ? 6 : 8;

    // Create nodes from agents
    const agentNodes: Node[] = agents.slice(0, maxAgents).map((agent, i) => {
      const angle = (i / Math.min(agents.length, maxAgents)) * 2 * Math.PI - Math.PI / 2;
      return {
        id: agent.id,
        position: { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) },
        data: { 
          label: (
            <div className="flex flex-col items-center gap-0.5 p-1 md:p-2">
              <InlineAvatar agentId={agent.id} agents={agents} className="w-8 h-8 md:w-10 md:h-10" fontSize="text-base md:text-lg" />
              <span className="text-[10px] md:text-xs font-medium truncate max-w-[60px] md:max-w-[80px]">{agent.name}</span>
              <Badge variant="outline" className="text-[8px] md:text-[10px] px-1">L{agent.level}</Badge>
            </div>
          ),
        },
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          padding: '2px',
        },
      };
    });

    // Create edges from message pairs (only between agents visible in the graph)
    const visibleAgentIds = new Set(agentNodes.map(n => n.id));
    const messagePairs = new Map<string, number>();
    messages.forEach((msg) => {
      if (!visibleAgentIds.has(msg.fromAgentId) || !visibleAgentIds.has(msg.toAgentId)) return;
      if (msg.fromAgentId === msg.toAgentId) return;
      const key = [msg.fromAgentId, msg.toAgentId].sort().join('::');
      messagePairs.set(key, (messagePairs.get(key) || 0) + 1);
    });

    const edgeList: Edge[] = Array.from(messagePairs.entries()).map(([key, count]) => {
      const [source, target] = key.split('::');
      return {
        id: key,
        source,
        target,
        animated: pulsingEdges.has(key),
        style: { 
          stroke: pulsingEdges.has(key) ? '#22c55e' : 'hsl(var(--primary))', 
          strokeWidth: Math.min(count, 4),
          opacity: pulsingEdges.has(key) ? 1 : 0.6,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
      };
    });

    setNodes(agentNodes);
    setEdges(edgeList);
  }, [agents, messages, pulsingEdges, isMobile, setNodes, setEdges]);

  // In sandbox mode: pulse edges from real SSE events
  useSandboxSSE(useCallback((event: SandboxSSEEvent) => {
    if (!isSandboxMode) return;
    if (event.agentId) {
      // Try to find fromAgentId/toAgentId from event data
      const fromId = event.agentId;
      // Look for a matching agent in the message about delegation/communication
      // The SSE event has agentId but not always toAgentId, so we pulse any edge involving this agent
      const relevantEdge = edges.find(e => e.source === fromId || e.target === fromId);
      if (relevantEdge) {
        const key = [relevantEdge.source, relevantEdge.target].sort().join('::');
        setPulsingEdges(new Set([key]));
        setTimeout(() => setPulsingEdges(new Set()), 1000);
      }
    }
  }, [edges]));

  // Simulate live message flow (non-sandbox/demo mode only)
  useEffect(() => {
    if (isSandboxMode) return;
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const key = [randomMsg.fromAgentId, randomMsg.toAgentId].sort().join('::');
      setPulsingEdges(new Set([key]));
      setTimeout(() => setPulsingEdges(new Set()), 1000);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  const selectedMessages = selectedEdge
    ? messages.filter((m) => {
        const key = [m.fromAgentId, m.toAgentId].sort().join('::');
        return key === selectedEdge;
      })
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedEdge(null)}>✕</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] md:h-[380px]">
                <div className="space-y-2">
                  {selectedMessages.slice(0, 20).map((msg) => {
                    const sender = msg.fromAgent;
                    return (
                      <div key={msg.id} className="p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <InlineAvatar agentId={msg.fromAgentId} agents={agents} className="w-5 h-5" />
                          <span className="text-xs font-medium">{sender?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// VIEW 2: Mission Control Feed (Mobile-Optimized)
// ============================================================
function FeedVirtualList({ filtered, allMessages, onViewThread, agents }: { filtered: Message[]; allMessages: Message[]; onViewThread: (convoKey: string) => void; agents: any[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-30" />
      <ScrollArea className="h-[600px]">
        <div className="space-y-0">
          <AnimatePresence mode="popLayout">
            {filtered.map((msg) => {
              const sender = msg.fromAgent;
              const receiver = msg.toAgent;
              const convoKey = [msg.fromAgentId, msg.toAgentId].sort().join('::');
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 md:gap-4 pb-3 pl-8 md:pl-12 relative"
                >
                  <div className="absolute left-2 md:left-4 w-3 h-3 md:w-4 md:h-4 rounded-full bg-card border-2 border-primary top-3" />
                  
                  <Card className={cn(
                    "flex-1 border-l-4",
                    // ACP-specific styling in sandbox mode
                    isSandboxMode && (msg as any).acpType === 'delegation' && 'border-l-blue-500',
                    isSandboxMode && (msg as any).acpType === 'escalation' && 'border-l-red-500 bg-red-500/5',
                    isSandboxMode && (msg as any).acpType === 'completion' && 'border-l-emerald-500 bg-emerald-500/5',
                    isSandboxMode && (msg as any).acpType === 'progress' && 'border-l-slate-400',
                    isSandboxMode && (msg as any).acpType === 'ack' && 'border-l-transparent',
                    // Default styling for non-sandbox
                    !isSandboxMode && msg.type === 'TASK' && 'border-l-blue-500',
                    !isSandboxMode && msg.type === 'STATUS' && 'border-l-green-500',
                    !isSandboxMode && msg.type === 'REPORT' && 'border-l-purple-500',
                    !isSandboxMode && msg.type === 'QUESTION' && 'border-l-yellow-500',
                    !isSandboxMode && msg.type === 'ESCALATION' && 'border-l-red-500',
                  )}>
                    <CardContent className="p-2 md:p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <InlineAvatar agentId={msg.fromAgentId} agents={agents} className="w-5 h-5 md:w-6 md:h-6" />
                          <span className="font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{sender?.name || 'Unknown'}</span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <InlineAvatar agentId={msg.toAgentId} agents={agents} className="w-5 h-5 md:w-6 md:h-6" />
                          <span className="font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{receiver?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[9px] md:text-[10px]", typeColors[msg.type] || typeColors.GENERAL)}>
                            {typeIcons[msg.type] || '💬'}
                          </Badge>
                          <span className="text-[10px] md:text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {msg.taskRef && (
                          <Badge variant="outline" className="text-[9px] md:text-[10px]">
                            🔗 {msg.taskRef}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] md:text-[10px] text-primary hover:text-primary/80 ml-auto"
                          onClick={() => onViewThread(convoKey)}
                        >
                          View thread →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function ComposingIndicators() {
  const { presenceMap } = usePresence();
  const composing = Array.from(presenceMap.values()).filter((p) => p.isComposing);
  if (composing.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-2 py-1.5 border-t border-border/40">
      {composing.slice(0, 3).map((p) => (
        <TypingIndicator key={p.agentId} agentName={p.agentId} />
      ))}
    </div>
  );
}

function MissionControlFeed({ messages, onViewThread }: { messages: Message[]; onViewThread: (convoKey: string) => void }) {
  const [filter, setFilter] = useState<string | null>(null);
  const { teams: allTeams } = useTeams();
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const { agents } = useAgents();

  const filtered = useMemo(() => {
    let result = messages;
    if (filter) result = result.filter((m) => m.type === filter);
    if (teamFilter !== 'all') {
      const teamAgentIds = new Set(
        agents
          .filter((a) => a.teamId === teamFilter)
          .map((a) => a.id),
      );
      result = result.filter(
        (m) => teamAgentIds.has(m.fromAgentId) || teamAgentIds.has(m.toAgentId),
      );
    }
    return result;
  }, [messages, filter, teamFilter, agents]);

  return (
    <div className="space-y-4">
      {/* Horizontally scrollable filters on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide items-center">
        <Button
          variant={filter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(null)}
          className="shrink-0"
        >
          All
        </Button>
        {Object.keys(typeColors).map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className="shrink-0"
          >
            {typeIcons[type]} <span className="hidden sm:inline ml-1">{type.toLowerCase()}</span>
          </Button>
        ))}
        <div className="w-px h-6 bg-border shrink-0" />
        <TeamFilterDropdown
          value={teamFilter}
          onChange={setTeamFilter}
          teams={allTeams.filter((t) => !t.parentTeamId)}
          className="shrink-0 h-8 text-xs min-h-0"
        />
      </div>

      <FeedVirtualList filtered={filtered} allMessages={messages} onViewThread={onViewThread} agents={agents} />
      <ComposingIndicators />
    </div>
  );
}

// ============================================================
// VIEW 3: Conversation Cards (Responsive Grid)
// ============================================================
function ConversationCards({ messages, agents, onViewThread }: { messages: Message[]; agents: any[]; onViewThread: (convoKey: string) => void }) {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  // Build a lookup map from agent id → agent data for reliable name resolution
  const agentMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; level: number; teamId?: string }>();
    agents.forEach((a) => map.set(a.id, { id: a.id, name: a.name, level: a.level, teamId: a.teamId }));
    return map;
  }, [agents]);

  // Group messages by conversation
  const conversations = useMemo(() => {
    const groups = messages.reduce((acc, msg) => {
      const key = [msg.fromAgentId, msg.toAgentId].sort().join('::');
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
      return acc;
    }, {} as Record<string, Message[]>);

    return Object.entries(groups).sort((a, b) => {
      const aLatest = Math.max(...a[1].map((m) => new Date(m.createdAt).getTime()));
      const bLatest = Math.max(...b[1].map((m) => new Date(m.createdAt).getTime()));
      return bLatest - aLatest;
    });
  }, [messages]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {conversations.slice(0, 12).map(([key, msgs]) => {
        const [agent1Id, agent2Id] = key.split('::');
        // Look up from the agents list first, fall back to message-embedded data
        const agent1 = agentMap.get(agent1Id) || msgs.find(m => m.fromAgentId === agent1Id)?.fromAgent || msgs.find(m => m.toAgentId === agent1Id)?.toAgent;
        const agent2 = agentMap.get(agent2Id) || msgs.find(m => m.fromAgentId === agent2Id)?.fromAgent || msgs.find(m => m.toAgentId === agent2Id)?.toAgent;
        const latestMsg = [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isExpanded = selectedConvo === key;

        return (
          <motion.div key={key} layout>
            <Card
              className={cn(
                "cursor-pointer transition-all active:scale-[0.98]",
                "hover:border-primary/50",
                isExpanded && "sm:col-span-2 lg:col-span-2 border-primary"
              )}
              onClick={() => setSelectedConvo(isExpanded ? null : key)}
            >
              <CardHeader className="pb-2 p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex -space-x-2 shrink-0">
                      <InlineAvatar agentId={agent1Id} agents={agents} className="w-7 h-7 md:w-8 md:h-8 border-2 border-card" fontSize="text-sm md:text-base" />
                      <InlineAvatar agentId={agent2Id} agents={agents} className="w-7 h-7 md:w-8 md:h-8 border-2 border-card" fontSize="text-sm md:text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">
                        {agent1?.name || 'Unknown'} ↔ {agent2?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] md:text-xs text-muted-foreground">{msgs.length} messages</p>
                        {(agent1 as any)?.teamId && <TeamBadge teamId={(agent1 as any).teamId} compact className="text-[8px]" />}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] md:text-[10px] shrink-0">
                    {formatTime(latestMsg.createdAt)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 md:p-4 pt-0">
                {!isExpanded ? (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {latestMsg.content}
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-48 md:h-64 mt-2">
                      <div className="space-y-2">
                        {[...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-10).map((msg) => {
                          const sender = msg.fromAgent;
                          const isAgent1 = msg.fromAgentId === agent1Id;
                          const acpType = (msg as any).acpType as string | undefined;
                          const acpRenderer = acpType && isSandboxMode ? acpTypeRenderers[acpType] : undefined;
                          const acpResult = acpRenderer?.(msg);

                          // Compact ack chip
                          if (acpResult?.compact) {
                            return (
                              <div key={msg.id} className="flex justify-center my-0.5">
                                <span className={acpResult.className}>{acpResult.label}</span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex gap-2",
                                isAgent1 ? "flex-row" : "flex-row-reverse"
                              )}
                            >
                              <InlineAvatar agentId={msg.fromAgentId} agents={agents} className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                              <div
                                className={cn(
                                  "max-w-[80%] p-2 rounded-lg text-xs md:text-sm",
                                  acpResult
                                    ? acpResult.className
                                    : isAgent1 ? "bg-muted" : "bg-primary/10"
                                )}
                              >
                                {acpResult ? acpResult.label : msg.content}
                                <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">{formatTime(msg.createdAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs text-primary"
                      onClick={(e) => { e.stopPropagation(); onViewThread(key); }}
                    >
                      Open full thread →
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// VIEW 4: Context-Linked Messages (Compact Horizontal Filters)
// ============================================================
function ContextLinkedMessages({ messages, agents, onViewThread }: { messages: Message[]; agents: any[]; onViewThread: (convoKey: string) => void }) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const { teams: allTeams } = useTeams();
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Get unique task refs from messages
  const tasks = useMemo(() => {
    const refs = new Set<string>();
    messages.forEach(m => { if (m.taskRef) refs.add(m.taskRef); });
    return Array.from(refs);
  }, [messages]);

  const teamAgentIds = useMemo(() => {
    if (teamFilter === 'all') return null;
    return new Set(
      agents
        .filter((a: any) => a.teamId === teamFilter)
        .map((a: any) => a.id),
    );
  }, [agents, teamFilter]);

  const filteredMessages = messages.filter((msg) => {
    if (selectedAgent && msg.fromAgentId !== selectedAgent && msg.toAgentId !== selectedAgent) return false;
    if (selectedTask && msg.taskRef !== selectedTask) return false;
    if (teamAgentIds && !teamAgentIds.has(msg.fromAgentId) && !teamAgentIds.has(msg.toAgentId)) return false;
    return true;
  });

  const hasFilters = selectedAgent || selectedTask || teamFilter !== 'all';
  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-3">
      {/* Compact horizontal filter bar */}
      <motion.div
        initial={false}
        animate={{ height: filtersExpanded ? 'auto' : '40px' }}
        className={filtersExpanded ? 'overflow-visible' : 'overflow-hidden'}
      >
        <div className="flex items-center gap-2 flex-wrap bg-muted/50 border border-border rounded-lg p-2 overflow-visible">
          {/* Toggle filters button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="h-7 px-2 text-xs"
          >
            {filtersExpanded ? '▼' : '▶'} Filters
          </Button>

          <AnimatePresence mode="wait">
            {filtersExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 flex-wrap flex-1"
              >
                {/* Agent filter dropdown */}
                <div className="relative">
                  <Button
                    variant={selectedAgent ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setShowAgentDropdown(!showAgentDropdown);
                      setShowTaskDropdown(false);
                    }}
                    className="h-7 px-2 text-xs gap-1.5"
                  >
                    {selectedAgentData ? (
                      <>
                        <InlineAvatar agentId={selectedAgent!} agents={agents} className="w-4 h-4" fontSize="text-[8px]" />
                        <span className="max-w-[100px] truncate">{selectedAgentData.name}</span>
                      </>
                    ) : (
                      <>👤 Agent</>
                    )}
                    {showAgentDropdown ? '▲' : '▼'}
                  </Button>
                  
                  <AnimatePresence>
                    {showAgentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl min-w-[200px] max-h-[280px] overflow-hidden"
                      >
                        <ScrollArea className="max-h-[280px]">
                          <div className="p-1">
                            <Button
                              variant={selectedAgent === null ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs h-8"
                              onClick={() => {
                                setSelectedAgent(null);
                                setShowAgentDropdown(false);
                              }}
                            >
                              All Agents
                            </Button>
                            {agents.map((agent) => (
                              <Button
                                key={agent.id}
                                variant={selectedAgent === agent.id ? 'secondary' : 'ghost'}
                                size="sm"
                                className="w-full justify-start gap-2 text-xs h-8"
                                onClick={() => {
                                  setSelectedAgent(agent.id);
                                  setShowAgentDropdown(false);
                                }}
                              >
                                <InlineAvatar agentId={agent.id} agents={agents} className="w-4 h-4" fontSize="text-[8px]" />
                                <span className="truncate">{agent.name}</span>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Task filter dropdown */}
                {tasks.length > 0 && (
                  <div className="relative">
                    <Button
                      variant={selectedTask ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setShowTaskDropdown(!showTaskDropdown);
                        setShowAgentDropdown(false);
                      }}
                      className="h-7 px-2 text-xs gap-1.5"
                    >
                      {selectedTask ? (
                        <>
                          📋 <span className="max-w-[100px] truncate">{selectedTask}</span>
                        </>
                      ) : (
                        <>📋 Task</>
                      )}
                      {showTaskDropdown ? '▲' : '▼'}
                    </Button>
                    
                    <AnimatePresence>
                      {showTaskDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl min-w-[200px] max-h-[280px] overflow-hidden"
                        >
                          <ScrollArea className="max-h-[280px]">
                            <div className="p-1">
                              <Button
                                variant={selectedTask === null ? 'secondary' : 'ghost'}
                                size="sm"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => {
                                  setSelectedTask(null);
                                  setShowTaskDropdown(false);
                                }}
                              >
                                All Tasks
                              </Button>
                              {tasks.map((task) => (
                                <Button
                                  key={task}
                                  variant={selectedTask === task ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className="w-full justify-start text-xs h-8"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskDropdown(false);
                                  }}
                                >
                                  📋 {task}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Team filter */}
                <TeamFilterDropdown
                  value={teamFilter}
                  onChange={setTeamFilter}
                  teams={allTeams.filter((t) => !t.parentTeamId)}
                  className="h-7 text-xs min-h-0"
                />

                {/* Clear filters */}
                {hasFilters && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(null);
                        setSelectedTask(null);
                        setTeamFilter('all');
                      }}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      ✕ Clear
                    </Button>
                  </motion.div>
                )}

                {/* Message count */}
                <span className="text-xs text-muted-foreground ml-auto">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Messages - Now gets majority of vertical space */}
      <div className="space-y-2 md:space-y-3">
        {filteredMessages.length === 0 ? (
          <Card className="p-6 md:p-8 text-center">
            <p className="text-muted-foreground text-sm">No messages match the current filters</p>
          </Card>
        ) : (
          filteredMessages.slice(0, 20).map((msg) => {
            const sender = msg.fromAgent;
            const receiver = msg.toAgent;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:border-muted-foreground/30 transition-colors">
                  <CardContent className="p-2 md:p-3">
                    <div className="flex items-start gap-2 md:gap-3">
                      <InlineAvatar agentId={msg.fromAgentId} agents={agents} className="w-8 h-8 md:w-10 md:h-10 shrink-0" fontSize="text-lg md:text-xl" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-xs md:text-sm">{sender?.name || 'Unknown'}</span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="font-medium text-xs md:text-sm">{receiver?.name || 'Unknown'}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground ml-auto">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">{msg.content}</p>
                        <div className="flex gap-1 md:gap-2 mt-2 flex-wrap items-center">
                          <Badge variant="outline" className={cn("text-[9px] md:text-[10px]", typeColors[msg.type] || typeColors.GENERAL)}>
                            {typeIcons[msg.type] || '💬'} {msg.type?.toLowerCase()}
                          </Badge>
                          {msg.taskRef && (
                            <Badge
                              variant="outline"
                              className="text-[9px] md:text-[10px] cursor-pointer hover:bg-muted transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(msg.taskRef!);
                              }}
                            >
                              🔗 {msg.taskRef}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[9px] md:text-[10px] text-primary hover:text-primary/80 ml-auto"
                            onClick={() => onViewThread([msg.fromAgentId, msg.toAgentId].sort().join('::'))}
                          >
                            View thread →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function MessagesPage() {
  const { messages, loading: messagesLoading } = useMessages(100);
  const { agents, loading: agentsLoading } = useAgents();
  const { currentPhase } = useCurrentPhase();
  const [threadConvoKey, setThreadConvoKey] = useState<string | null>(null);

  const loading = messagesLoading || agentsLoading;

  // Get messages for the selected thread
  const threadMessages = useMemo(() => {
    if (!threadConvoKey) return [];
    return messages.filter((m) => {
      const key = [m.fromAgentId, m.toAgentId].sort().join('::');
      return key === threadConvoKey;
    });
  }, [messages, threadConvoKey]);

  const handleViewThread = useCallback((convoKey: string) => {
    setThreadConvoKey(convoKey);
  }, []);

  if (!loading && messages.length === 0) {
    return (
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <PageHeader
          title="Agent Communications"
          description="Watch your agents coordinate in real-time"
        />
        <Card>
          <CardContent>
            <EmptyState
              variant="messages"
              title="No messages yet"
              description="Agents will communicate here once tasks begin. Start a task to see real-time coordination."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        title="Agent Communications"
        description="Watch your agents coordinate in real-time"
        actions={
          <div className="flex items-center gap-3">
            {currentPhase && <PhaseChip phase={currentPhase} className="hidden sm:inline-flex" />}
            <Badge variant="outline">{messages.length} messages</Badge>
          </div>
        }
      />

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6 h-9 md:h-10">
          <TabsTrigger value="graph" className="text-xs md:text-sm px-1 md:px-3">🕸️ <span className="hidden sm:inline ml-1">Graph</span></TabsTrigger>
          <TabsTrigger value="feed" className="text-xs md:text-sm px-1 md:px-3">📡 <span className="hidden sm:inline ml-1">Feed</span></TabsTrigger>
          <TabsTrigger value="cards" className="text-xs md:text-sm px-1 md:px-3">💬 <span className="hidden sm:inline ml-1">Cards</span></TabsTrigger>
          <TabsTrigger value="context" className="text-xs md:text-sm px-1 md:px-3">🎯 <span className="hidden sm:inline ml-1">Context</span></TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <Card className="p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              <strong>Communication Graph:</strong> Tap edges to see conversations. Edges pulse green when messages flow.
            </p>
            <CommunicationGraph messages={messages} agents={agents} />
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card className="p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              <strong>Mission Control:</strong> Real-time stream of all agent communications. Click "View thread" to see the full conversation.
            </p>
            <MissionControlFeed messages={messages} onViewThread={handleViewThread} />
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card className="p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              <strong>Conversations:</strong> Tap a card to expand the full thread.
            </p>
            <ConversationCards messages={messages} agents={agents} onViewThread={handleViewThread} />
          </Card>
        </TabsContent>

        <TabsContent value="context">
          <Card className="p-3 md:p-4 relative overflow-visible">
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              <strong>Context-Linked:</strong> Filter by agent, task, or team to see related discussions.
            </p>
            <ContextLinkedMessages messages={messages} agents={agents} onViewThread={handleViewThread} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Thread View Modal */}
      <AnimatePresence>
        {threadConvoKey && threadMessages.length > 0 && (
          <ThreadView
            messages={threadMessages}
            onClose={() => setThreadConvoKey(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MessagesPage;
