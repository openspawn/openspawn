/**
 * ThreadView — displays a conversation thread between two agents
 * with a visual timeline showing message flow direction.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { getAgentAvatarUrl } from '../lib/avatar';
import type { Message } from '../hooks';

interface ThreadViewProps {
  /** All messages in this conversation (between two agents) */
  messages: Message[];
  /** Called when the user closes the thread */
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  TASK: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  STATUS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REPORT: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  QUESTION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ESCALATION: 'bg-red-500/20 text-red-400 border-red-500/30',
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

function formatThreadTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' +
    date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ThreadView({ messages, onClose }: ThreadViewProps) {
  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  // Determine the two participant agents
  const participants = useMemo(() => {
    const ids = new Set<string>();
    const agentMap = new Map<string, { id: string; name: string; level: number }>();
    sorted.forEach((m) => {
      if (m.fromAgent) {
        ids.add(m.fromAgentId);
        agentMap.set(m.fromAgentId, m.fromAgent);
      }
      if (m.toAgent) {
        ids.add(m.toAgentId);
        agentMap.set(m.toAgentId, m.toAgent);
      }
    });
    return Array.from(ids).map((id) => agentMap.get(id)).filter(Boolean) as {
      id: string;
      name: string;
      level: number;
    }[];
  }, [sorted]);

  const leftId = participants[0]?.id;

  if (sorted.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">
                {participants.map((p) => p.name).join(' ↔ ') || 'Thread'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {sorted.length} message{sorted.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-1">
            {sorted.map((msg, idx) => {
              const isLeft = msg.fromAgentId === leftId;
              const sender = msg.fromAgent;
              const showAvatar =
                idx === 0 || sorted[idx - 1].fromAgentId !== msg.fromAgentId;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn('flex gap-2', isLeft ? 'flex-row' : 'flex-row-reverse')}
                >
                  {/* Avatar (only when sender changes) */}
                  <div className="w-7 shrink-0">
                    {showAvatar && sender && (
                      <img
                        src={getAgentAvatarUrl(msg.fromAgentId, sender.level)}
                        className="w-7 h-7 rounded-full"
                        alt={sender.name}
                      />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-xl px-3 py-2',
                      isLeft
                        ? 'bg-muted rounded-tl-sm'
                        : 'bg-primary/10 rounded-tr-sm',
                    )}
                  >
                    {showAvatar && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-semibold">
                          {sender?.name || 'Unknown'}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px] px-1 py-0 h-3.5',
                            typeColors[msg.type] || typeColors.GENERAL,
                          )}
                        >
                          {typeIcons[msg.type] || '💬'}
                        </Badge>
                      </div>
                    )}
                    <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                      {msg.content}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {formatThreadTime(msg.createdAt)}
                    </p>
                    {msg.taskRef && (
                      <Badge variant="outline" className="text-[8px] mt-1 px-1">
                        🔗 {msg.taskRef}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}
