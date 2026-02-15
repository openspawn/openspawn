import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AGENTS } from './replay-data';

export interface FeedMessage {
  id: string;
  tick: number;
  agentId: string;
  text: string;
  type: 'message' | 'delegation' | 'escalation' | 'completion' | 'reassign';
}

interface LiveFeedProps {
  messages: FeedMessage[];
}

function formatTick(tick: number): string {
  const secs = Math.floor(tick * 0.5);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LiveFeed({ messages }: LiveFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Live Feed</span>
        <span className="text-[10px] text-white/30 ml-auto">{messages.length} events</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {messages.length === 0 && (
          <div className="text-xs text-white/20 italic p-4 text-center">Waiting for events…</div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const agent = AGENTS[msg.agentId];
            const borderClass =
              msg.type === 'escalation' ? 'border-l-2 border-l-red-500' :
              msg.type === 'completion' ? 'border-l-2 border-l-emerald-500' :
              msg.type === 'reassign' ? 'border-l-2 border-l-amber-500' :
              'border-l-2 border-l-transparent';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-2 text-xs py-1.5 px-2 rounded ${borderClass} hover:bg-white/[0.02]`}
              >
                <span className="text-base shrink-0">{agent?.emoji ?? '🐟'}</span>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-white/80">{agent?.name ?? msg.agentId}</span>
                  <span className="text-white/50 ml-2">{msg.text}</span>
                </div>
                <span className="text-white/20 font-mono shrink-0 text-[10px]">{formatTick(msg.tick)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
