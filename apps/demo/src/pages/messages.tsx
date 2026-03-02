/**
 * MessagesPage — main agent communications view.
 *
 * Sub-components have been extracted to keep this file manageable:
 *   message-utils.tsx                  – InlineAvatar, formatTime, typeColors, typeIcons, acpTypeRenderers
 *   message-communication-graph.tsx    – CommunicationGraph
 *   message-feed.tsx                   – MissionControlFeed
 *   message-conversation-cards.tsx     – ConversationCards
 *   message-context-filter.tsx         – ContextLinkedMessages
 */
import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { EmptyState } from '../components/ui/empty-state';
import { PageHeader } from '../components/ui/page-header';
import { PhaseChip } from '../components/phase-chip';
import { ThreadView } from '../components/thread-view';
import { useMessages, useAgents, useCurrentPhase } from '../hooks';

// Extracted sub-components
import { CommunicationGraph }   from './message-communication-graph';
import { MissionControlFeed }   from './message-feed';
import { ConversationCards }    from './message-conversation-cards';
import { ContextLinkedMessages } from './message-context-filter';

export function MessagesPage() {
  const { messages, loading: messagesLoading } = useMessages(100);
  const { agents,   loading: agentsLoading }   = useAgents();
  const { currentPhase }                       = useCurrentPhase();
  const [threadConvoKey, setThreadConvoKey]    = useState<string | null>(null);

  const loading = messagesLoading || agentsLoading;

  const threadMessages = useMemo(() => {
    if (!threadConvoKey) return [];
    return messages.filter((m) => [m.fromAgentId, m.toAgentId].sort().join('::') === threadConvoKey);
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
          <TabsTrigger value="graph"   className="text-xs md:text-sm px-1 md:px-3">🕸️ <span className="hidden sm:inline ml-1">Graph</span></TabsTrigger>
          <TabsTrigger value="feed"    className="text-xs md:text-sm px-1 md:px-3">📡 <span className="hidden sm:inline ml-1">Feed</span></TabsTrigger>
          <TabsTrigger value="cards"   className="text-xs md:text-sm px-1 md:px-3">💬 <span className="hidden sm:inline ml-1">Cards</span></TabsTrigger>
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
