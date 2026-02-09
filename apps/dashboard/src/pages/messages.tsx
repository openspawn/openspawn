import { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import { getAgentAvatarUrl } from '../lib/avatar';
import { useMessages, useAgents, type Message } from '../hooks';

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const typeColors: Record<string, string> = {
  TASK: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  STATUS: 'bg-green-500/20 text-green-400 border-green-500/30',
  REPORT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  QUESTION: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ESCALATION: 'bg-red-500/20 text-red-400 border-red-500/30',
  GENERAL: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const typeIcons: Record<string, string> = {
  TASK: '📋',
  STATUS: '✅',
  REPORT: '📊',
  QUESTION: '❓',
  ESCALATION: '🚨',
  GENERAL: '💬',
};

// ============================================================
// VIEW 1: Communication Graph (Mobile-Responsive)
// ============================================================
function CommunicationGraph({ messages, agents }: { messages: Message[]; agents: any[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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
              <img 
                src={getAgentAvatarUrl(agent.id, agent.level)} 
                alt={agent.name}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full"
              />
              <span className="text-[10px] md:text-xs font-medium truncate max-w-[60px] md:max-w-[80px]">{agent.name}</span>
              <Badge variant="outline" className="text-[8px] md:text-[10px] px-1">L{agent.level}</Badge>
            </div>
          ),
        },
        style: {
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '2px',
        },
      };
    });

    // Create edges from message pairs
    const messagePairs = new Map<string, number>();
    messages.forEach((msg) => {
      const key = [msg.fromAgentId, msg.toAgentId].sort().join('-');
      messagePairs.set(key, (messagePairs.get(key) || 0) + 1);
    });

    const edgeList: Edge[] = Array.from(messagePairs.entries()).map(([key, count]) => {
      const [source, target] = key.split('-');
      return {
        id: key,
        source,
        target,
        animated: pulsingEdges.has(key),
        style: { 
          stroke: pulsingEdges.has(key) ? '#22c55e' : '#6366f1', 
          strokeWidth: Math.min(count, 4),
          opacity: pulsingEdges.has(key) ? 1 : 0.6,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      };
    });

    setNodes(agentNodes);
    setEdges(edgeList);
  }, [agents, messages, pulsingEdges, isMobile, setNodes, setEdges]);

  // Simulate live message flow
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const key = [randomMsg.fromAgentId, randomMsg.toAgentId].sort().join('-');
      setPulsingEdges(new Set([key]));
      setTimeout(() => setPulsingEdges(new Set()), 1000);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  const selectedMessages = selectedEdge
    ? messages.filter((m) => {
        const key = [m.fromAgentId, m.toAgentId].sort().join('-');
        return key === selectedEdge;
      })
    : [];

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 h-[350px] md:h-[500px] bg-slate-900/50 rounded-lg border border-slate-700">
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
          <Background color="#334155" gap={20} />
          <Controls className="bg-slate-800 border-slate-700" />
        </ReactFlow>
      </div>
      
      {selectedEdge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:w-72"
        >
          <Card className="bg-slate-800/80 border-slate-700">
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
                      <div key={msg.id} className="p-2 rounded-lg bg-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-5 h-5 rounded-full" />
                          <span className="text-xs font-medium">{sender?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-500 ml-auto">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-300">{msg.content}</p>
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
function MissionControlFeed({ messages }: { messages: Message[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? messages.filter((m) => m.type === filter) : messages;

  return (
    <div className="space-y-4">
      {/* Horizontally scrollable filters on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
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
      </div>

      <div className="relative">
        <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-30" />
        
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, 15).map((msg) => {
            const sender = msg.fromAgent;
            const receiver = msg.toAgent;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex gap-3 md:gap-4 mb-3 pl-8 md:pl-12 relative"
              >
                <div className="absolute left-2 md:left-4 w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-800 border-2 border-indigo-500 top-3" />
                
                <Card className={cn(
                  "flex-1 bg-slate-800/50 border-l-4",
                  msg.type === 'TASK' && 'border-l-blue-500',
                  msg.type === 'STATUS' && 'border-l-green-500',
                  msg.type === 'REPORT' && 'border-l-purple-500',
                  msg.type === 'QUESTION' && 'border-l-yellow-500',
                  msg.type === 'ESCALATION' && 'border-l-red-500',
                )}>
                  <CardContent className="p-2 md:p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
                        <span className="font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{sender?.name || 'Unknown'}</span>
                        <span className="text-slate-500 text-xs">→</span>
                        <img src={getAgentAvatarUrl(msg.toAgentId, receiver?.level || 5)} className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
                        <span className="font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{receiver?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[9px] md:text-[10px]", typeColors[msg.type] || typeColors.GENERAL)}>
                          {typeIcons[msg.type] || '💬'}
                        </Badge>
                        <span className="text-[10px] md:text-xs text-slate-500">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-300">{msg.content}</p>
                    {msg.taskRef && (
                      <Badge variant="outline" className="mt-2 text-[9px] md:text-[10px]">
                        🔗 {msg.taskRef}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// VIEW 3: Conversation Cards (Responsive Grid)
// ============================================================
function ConversationCards({ messages }: { messages: Message[] }) {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  // Group messages by conversation
  const conversations = useMemo(() => {
    const groups = messages.reduce((acc, msg) => {
      const key = [msg.fromAgentId, msg.toAgentId].sort().join('-');
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
        const [agent1Id, agent2Id] = key.split('-');
        const agent1 = msgs.find(m => m.fromAgentId === agent1Id)?.fromAgent || msgs.find(m => m.toAgentId === agent1Id)?.toAgent;
        const agent2 = msgs.find(m => m.fromAgentId === agent2Id)?.fromAgent || msgs.find(m => m.toAgentId === agent2Id)?.toAgent;
        const latestMsg = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isExpanded = selectedConvo === key;

        return (
          <motion.div key={key} layout>
            <Card
              className={cn(
                "bg-slate-800/50 border-slate-700 cursor-pointer transition-all active:scale-[0.98]",
                "hover:border-indigo-500/50",
                isExpanded && "sm:col-span-2 lg:col-span-2 border-indigo-500"
              )}
              onClick={() => setSelectedConvo(isExpanded ? null : key)}
            >
              <CardHeader className="pb-2 p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex -space-x-2 shrink-0">
                      <img src={getAgentAvatarUrl(agent1Id, agent1?.level || 5)} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-slate-800" />
                      <img src={getAgentAvatarUrl(agent2Id, agent2?.level || 5)} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-slate-800" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">
                        {agent1?.name || 'Unknown'} ↔ {agent2?.name || 'Unknown'}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500">{msgs.length} messages</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] md:text-[10px] shrink-0">
                    {formatTime(latestMsg.createdAt)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 md:p-4 pt-0">
                {!isExpanded ? (
                  <p className="text-xs md:text-sm text-slate-400 line-clamp-2">
                    {latestMsg.content}
                  </p>
                ) : (
                  <ScrollArea className="h-48 md:h-64 mt-2">
                    <div className="space-y-2">
                      {msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-10).map((msg) => {
                        const sender = msg.fromAgent;
                        const isAgent1 = msg.fromAgentId === agent1Id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2",
                              isAgent1 ? "flex-row" : "flex-row-reverse"
                            )}
                          >
                            <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-5 h-5 md:w-6 md:h-6 rounded-full shrink-0" />
                            <div
                              className={cn(
                                "max-w-[80%] p-2 rounded-lg text-xs md:text-sm",
                                isAgent1 ? "bg-slate-700" : "bg-indigo-600/30"
                              )}
                            >
                              {msg.content}
                              <p className="text-[9px] md:text-[10px] text-slate-500 mt-1">{formatTime(msg.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
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
// VIEW 4: Context-Linked Messages (Collapsible Sidebar)
// ============================================================
function ContextLinkedMessages({ messages, agents }: { messages: Message[]; agents: any[] }) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique task refs from messages
  const tasks = useMemo(() => {
    const refs = new Set<string>();
    messages.forEach(m => { if (m.taskRef) refs.add(m.taskRef); });
    return Array.from(refs);
  }, [messages]);

  const filteredMessages = messages.filter((msg) => {
    if (selectedAgent && msg.fromAgentId !== selectedAgent && msg.toAgentId !== selectedAgent) return false;
    if (selectedTask && msg.taskRef !== selectedTask) return false;
    return true;
  });

  const hasFilters = selectedAgent || selectedTask;

  return (
    <div className="space-y-4">
      {/* Mobile filter toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden"
        >
          🔍 Filters {hasFilters && `(${(selectedAgent ? 1 : 0) + (selectedTask ? 1 : 0)})`}
        </Button>
        
        {/* Active filter badges */}
        {selectedAgent && (
          <Badge variant="secondary" className="text-xs gap-1">
            👤 {agents.find(a => a.id === selectedAgent)?.name}
            <button onClick={() => setSelectedAgent(null)} className="ml-1 hover:text-red-400">✕</button>
          </Badge>
        )}
        {selectedTask && (
          <Badge variant="secondary" className="text-xs gap-1">
            📋 {selectedTask}
            <button onClick={() => setSelectedTask(null)} className="ml-1 hover:text-red-400">✕</button>
          </Badge>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSelectedAgent(null); setSelectedTask(null); }}>
            Clear all
          </Button>
        )}
        
        <span className="text-xs text-slate-400 ml-auto">
          {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-4">
        {/* Filters sidebar - collapsible on mobile */}
        <AnimatePresence>
          {(showFilters || window.innerWidth >= 768) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden md:block w-56 lg:w-64 space-y-3 shrink-0"
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2 p-3">
                  <CardTitle className="text-xs md:text-sm">Filter by Agent</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      <Button
                        variant={selectedAgent === null ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setSelectedAgent(null)}
                      >
                        All Agents
                      </Button>
                      {agents.slice(0, 8).map((agent) => (
                        <Button
                          key={agent.id}
                          variant={selectedAgent === agent.id ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start gap-2 text-xs"
                          onClick={() => setSelectedAgent(agent.id)}
                        >
                          <img src={getAgentAvatarUrl(agent.id, agent.level)} className="w-4 h-4 rounded-full" />
                          <span className="truncate">{agent.name}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {tasks.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-xs md:text-sm">Filter by Task</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        <Button
                          variant={selectedTask === null ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => setSelectedTask(null)}
                        >
                          All Tasks
                        </Button>
                        {tasks.slice(0, 6).map((task) => (
                          <Button
                            key={task}
                            variant={selectedTask === task ? 'default' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => setSelectedTask(task)}
                          >
                            📋 {task}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile filter sheet */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden w-full absolute left-0 right-0 top-12 z-10 bg-slate-900 border border-slate-700 rounded-lg p-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium mb-2">Agents</p>
                  <div className="space-y-1">
                    {agents.slice(0, 5).map((agent) => (
                      <Button
                        key={agent.id}
                        variant={selectedAgent === agent.id ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-1 text-xs"
                        onClick={() => { setSelectedAgent(agent.id); setShowFilters(false); }}
                      >
                        <img src={getAgentAvatarUrl(agent.id, agent.level)} className="w-4 h-4 rounded-full" />
                        <span className="truncate">{agent.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                {tasks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2">Tasks</p>
                    <div className="space-y-1">
                      {tasks.slice(0, 5).map((task) => (
                        <Button
                          key={task}
                          variant={selectedTask === task ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => { setSelectedTask(task); setShowFilters(false); }}
                        >
                          {task}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2 md:space-y-3">
            {filteredMessages.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 p-6 md:p-8 text-center">
                <p className="text-slate-400 text-sm">No messages match the current filters</p>
              </Card>
            ) : (
              filteredMessages.slice(0, 15).map((msg) => {
                const sender = msg.fromAgent;
                const receiver = msg.toAgent;
                return (
                  <Card key={msg.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-2 md:p-3">
                      <div className="flex items-start gap-2 md:gap-3">
                        <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 md:gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-xs md:text-sm">{sender?.name || 'Unknown'}</span>
                            <span className="text-slate-500 text-xs">→</span>
                            <span className="font-medium text-xs md:text-sm">{receiver?.name || 'Unknown'}</span>
                            <span className="text-[10px] md:text-xs text-slate-500 ml-auto">{formatTime(msg.createdAt)}</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-300">{msg.content}</p>
                          <div className="flex gap-1 md:gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-[9px] md:text-[10px]", typeColors[msg.type] || typeColors.GENERAL)}>
                              {typeIcons[msg.type] || '💬'} {msg.type?.toLowerCase()}
                            </Badge>
                            {msg.taskRef && (
                              <Badge
                                variant="outline"
                                className="text-[9px] md:text-[10px] cursor-pointer hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(msg.taskRef!);
                                }}
                              >
                                🔗 {msg.taskRef}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
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

  const loading = messagesLoading || agentsLoading;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Agent Communications</h1>
          <p className="text-slate-400 text-xs md:text-sm">Watch your agents coordinate in real-time</p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto">{messages.length} messages</Badge>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6 h-9 md:h-10">
          <TabsTrigger value="graph" className="text-xs md:text-sm px-1 md:px-3">🕸️ <span className="hidden sm:inline ml-1">Graph</span></TabsTrigger>
          <TabsTrigger value="feed" className="text-xs md:text-sm px-1 md:px-3">📡 <span className="hidden sm:inline ml-1">Feed</span></TabsTrigger>
          <TabsTrigger value="cards" className="text-xs md:text-sm px-1 md:px-3">💬 <span className="hidden sm:inline ml-1">Cards</span></TabsTrigger>
          <TabsTrigger value="context" className="text-xs md:text-sm px-1 md:px-3">🎯 <span className="hidden sm:inline ml-1">Context</span></TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <Card className="bg-slate-800/30 border-slate-700 p-3 md:p-4">
            <p className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4">
              <strong>Communication Graph:</strong> Tap edges to see conversations. Edges pulse green when messages flow.
            </p>
            <CommunicationGraph messages={messages} agents={agents} />
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card className="bg-slate-800/30 border-slate-700 p-3 md:p-4">
            <p className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4">
              <strong>Mission Control:</strong> Real-time stream of all agent communications.
            </p>
            <MissionControlFeed messages={messages} />
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card className="bg-slate-800/30 border-slate-700 p-3 md:p-4">
            <p className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4">
              <strong>Conversations:</strong> Tap a card to expand the full thread.
            </p>
            <ConversationCards messages={messages} />
          </Card>
        </TabsContent>

        <TabsContent value="context">
          <Card className="bg-slate-800/30 border-slate-700 p-3 md:p-4 relative">
            <p className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4">
              <strong>Context-Linked:</strong> Filter by agent or task to see related discussions.
            </p>
            <ContextLinkedMessages messages={messages} agents={agents} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MessagesPage;
