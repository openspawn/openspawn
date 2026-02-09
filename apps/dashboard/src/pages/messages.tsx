import { useState, useEffect, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import { getAgentAvatarUrl } from '../lib/avatar';
import { useMessages, useConversations, useAgents, type Message } from '../hooks';

// Helper to get agent by ID from messages
const getAgentFromMessage = (msg: Message, which: 'from' | 'to') => {
  return which === 'from' ? msg.fromAgent : msg.toAgent;
};

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
// VIEW 1: Communication Graph
// ============================================================
function CommunicationGraph({ messages, agents }: { messages: Message[]; agents: any[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pulsingEdges, setPulsingEdges] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (agents.length === 0) return;

    // Create nodes from agents
    const agentNodes: Node[] = agents.slice(0, 8).map((agent, i) => {
      const angle = (i / Math.min(agents.length, 8)) * 2 * Math.PI;
      const radius = 200;
      return {
        id: agent.id,
        position: { x: 300 + radius * Math.cos(angle), y: 250 + radius * Math.sin(angle) },
        data: { 
          label: (
            <div className="flex flex-col items-center gap-1 p-2">
              <img 
                src={getAgentAvatarUrl(agent.id, agent.level)} 
                alt={agent.name}
                className="w-10 h-10 rounded-full"
              />
              <span className="text-xs font-medium">{agent.name}</span>
              <Badge variant="outline" className="text-[10px] px-1">L{agent.level}</Badge>
            </div>
          ),
        },
        style: {
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '4px',
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
          strokeWidth: Math.min(count * 2, 6),
          opacity: pulsingEdges.has(key) ? 1 : 0.6,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      };
    });

    setNodes(agentNodes);
    setEdges(edgeList);
  }, [agents, messages, pulsingEdges, setNodes, setEdges]);

  // Simulate live message flow
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const key = [randomMsg.fromAgentId, randomMsg.toAgentId].sort().join('-');
      setPulsingEdges(new Set([key]));
      setTimeout(() => setPulsingEdges(new Set()), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages]);

  const selectedMessages = selectedEdge
    ? messages.filter((m) => {
        const key = [m.fromAgentId, m.toAgentId].sort().join('-');
        return key === selectedEdge;
      })
    : [];

  return (
    <div className="h-[600px] flex gap-4">
      <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
          fitView
        >
          <Background color="#334155" gap={20} />
          <Controls className="bg-slate-800 border-slate-700" />
        </ReactFlow>
      </div>
      
      {selectedEdge && (
        <Card className="w-80 bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Conversation
              <Button variant="ghost" size="sm" onClick={() => setSelectedEdge(null)}>✕</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[480px]">
              <div className="space-y-3">
                {selectedMessages.map((msg) => {
                  const sender = msg.fromAgent;
                  return (
                    <div key={msg.id} className="p-2 rounded-lg bg-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-5 h-5 rounded-full" />
                        <span className="text-xs font-medium">{sender?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300">{msg.content}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// VIEW 2: Mission Control Feed
// ============================================================
function MissionControlFeed({ messages }: { messages: Message[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? messages.filter((m) => m.type === filter) : messages;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(null)}
        >
          All
        </Button>
        {Object.keys(typeColors).map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
          >
            {typeIcons[type]} {type.toLowerCase()}
          </Button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-30" />
        
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, 20).map((msg, i) => {
            const sender = msg.fromAgent;
            const receiver = msg.toAgent;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex gap-4 mb-4 pl-12 relative"
              >
                <div className="absolute left-4 w-4 h-4 rounded-full bg-slate-800 border-2 border-indigo-500 top-2" />
                
                <Card className={cn(
                  "flex-1 bg-slate-800/50 border-l-4",
                  msg.type === 'TASK' && 'border-l-blue-500',
                  msg.type === 'STATUS' && 'border-l-green-500',
                  msg.type === 'REPORT' && 'border-l-purple-500',
                  msg.type === 'QUESTION' && 'border-l-yellow-500',
                  msg.type === 'ESCALATION' && 'border-l-red-500',
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-sm">{sender?.name || 'Unknown'}</span>
                        <span className="text-slate-500">→</span>
                        <img src={getAgentAvatarUrl(msg.toAgentId, receiver?.level || 5)} className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-sm">{receiver?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", typeColors[msg.type] || typeColors.GENERAL)}>
                          {typeIcons[msg.type] || '💬'} {msg.type?.toLowerCase()}
                        </Badge>
                        <span className="text-xs text-slate-500">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{msg.content}</p>
                    {msg.taskRef && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
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
// VIEW 3: Conversation Cards
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {conversations.map(([key, msgs]) => {
        const [agent1Id, agent2Id] = key.split('-');
        const agent1 = msgs.find(m => m.fromAgentId === agent1Id)?.fromAgent || msgs.find(m => m.toAgentId === agent1Id)?.toAgent;
        const agent2 = msgs.find(m => m.fromAgentId === agent2Id)?.fromAgent || msgs.find(m => m.toAgentId === agent2Id)?.toAgent;
        const latestMsg = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isExpanded = selectedConvo === key;

        return (
          <motion.div key={key} layout>
            <Card
              className={cn(
                "bg-slate-800/50 border-slate-700 cursor-pointer transition-all hover:border-indigo-500/50",
                isExpanded && "col-span-full border-indigo-500"
              )}
              onClick={() => setSelectedConvo(isExpanded ? null : key)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <img src={getAgentAvatarUrl(agent1Id, agent1?.level || 5)} className="w-8 h-8 rounded-full border-2 border-slate-800" />
                      <img src={getAgentAvatarUrl(agent2Id, agent2?.level || 5)} className="w-8 h-8 rounded-full border-2 border-slate-800" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent1?.name || 'Unknown'} ↔ {agent2?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{msgs.length} messages</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {formatTime(latestMsg.createdAt)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {!isExpanded ? (
                  <p className="text-sm text-slate-400 truncate">
                    {latestMsg.content}
                  </p>
                ) : (
                  <ScrollArea className="h-64 mt-2">
                    <div className="space-y-3">
                      {msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg) => {
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
                            <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-6 h-6 rounded-full" />
                            <div
                              className={cn(
                                "max-w-[80%] p-2 rounded-lg text-sm",
                                isAgent1 ? "bg-slate-700" : "bg-indigo-600/30"
                              )}
                            >
                              {msg.content}
                              <p className="text-[10px] text-slate-500 mt-1">{formatTime(msg.createdAt)}</p>
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
// VIEW 4: Context-Linked Messages
// ============================================================
function ContextLinkedMessages({ messages, agents }: { messages: Message[]; agents: any[] }) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

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

  return (
    <div className="flex gap-6">
      {/* Filters sidebar */}
      <div className="w-64 space-y-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Filter by Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              variant={selectedAgent === null ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedAgent(null)}
            >
              All Agents
            </Button>
            {agents.slice(0, 10).map((agent) => (
              <Button
                key={agent.id}
                variant={selectedAgent === agent.id ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setSelectedAgent(agent.id)}
              >
                <img src={getAgentAvatarUrl(agent.id, agent.level)} className="w-5 h-5 rounded-full" />
                {agent.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Filter by Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              variant={selectedTask === null ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedTask(null)}
            >
              All Tasks
            </Button>
            {tasks.map((task) => (
              <Button
                key={task}
                variant={selectedTask === task ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedTask(task)}
              >
                📋 {task}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
          </span>
          {selectedAgent && (
            <Badge variant="outline" className="text-xs">
              Agent: {agents.find(a => a.id === selectedAgent)?.name}
            </Badge>
          )}
          {selectedTask && (
            <Badge variant="outline" className="text-xs">
              Task: {selectedTask}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
              <p className="text-slate-400">No messages match the current filters</p>
            </Card>
          ) : (
            filteredMessages.slice(0, 20).map((msg) => {
              const sender = msg.fromAgent;
              const receiver = msg.toAgent;
              return (
                <Card key={msg.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <img src={getAgentAvatarUrl(msg.fromAgentId, sender?.level || 5)} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{sender?.name || 'Unknown'}</span>
                          <span className="text-slate-500">→</span>
                          <span className="font-medium">{receiver?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-500 ml-auto">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-slate-300">{msg.content}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className={cn("text-[10px]", typeColors[msg.type] || typeColors.GENERAL)}>
                            {typeIcons[msg.type] || '💬'} {msg.type?.toLowerCase()}
                          </Badge>
                          {msg.taskRef && (
                            <Badge
                              variant="outline"
                              className="text-[10px] cursor-pointer hover:bg-slate-700"
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
      <div className="p-6 flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Communications</h1>
          <p className="text-slate-400">Watch your agents coordinate in real-time</p>
        </div>
        <Badge variant="outline">{messages.length} messages</Badge>
      </div>

      <Tabs defaultValue="graph" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4 mb-6">
          <TabsTrigger value="graph">🕸️ Graph</TabsTrigger>
          <TabsTrigger value="feed">📡 Feed</TabsTrigger>
          <TabsTrigger value="cards">💬 Cards</TabsTrigger>
          <TabsTrigger value="context">🎯 Context</TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <Card className="bg-slate-800/30 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-4">
              <strong>Communication Graph:</strong> Click on an edge to see the conversation. Edges pulse green when messages flow.
            </p>
            <CommunicationGraph messages={messages} agents={agents} />
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card className="bg-slate-800/30 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-4">
              <strong>Mission Control Feed:</strong> Real-time stream of all agent communications.
            </p>
            <MissionControlFeed messages={messages} />
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card className="bg-slate-800/30 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-4">
              <strong>Conversation Cards:</strong> Click a card to expand the full conversation thread.
            </p>
            <ConversationCards messages={messages} />
          </Card>
        </TabsContent>

        <TabsContent value="context">
          <Card className="bg-slate-800/30 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-4">
              <strong>Context-Linked:</strong> Filter messages by agent or task to see related discussions.
            </p>
            <ContextLinkedMessages messages={messages} agents={agents} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MessagesPage;
