import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AGENTS } from './replay-data';
import { resolveAvatarUrl } from '../../lib/resolve-avatar-url';

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

// BikiniBottom-themed border colors per event type
const TYPE_BORDER: Record<FeedMessage['type'], string> = {
  escalation: 'border-l-2 border-l-[#FF4757]',
  completion: 'border-l-2 border-l-[#4AE88A]',
  reassign:   'border-l-2 border-l-[#F4C542]',
  delegation: 'border-l-2 border-l-[#F4C542]',
  message:    'border-l-2 border-l-transparent',
};

const TYPE_TEXT: Record<FeedMessage['type'], string> = {
  escalation: 'text-[#FF8E8E]',
  completion: 'text-[#6EF2A4]',
  reassign:   'text-[#FDE68A]',
  delegation: 'text-[#FDE68A]',
  message:    'text-[#B8E4F7]/70',
};

export function LiveFeed({ messages }: LiveFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'rgba(6,42,69,0.7)',
        borderLeft: '1px solid rgba(74,174,217,0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 shrink-0 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(74,174,217,0.12)' }}
      >
        {/* Live ping */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4757] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4757]" />
        </span>
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: '#B8E4F7', fontFamily: '"Baloo 2", cursive' }}
        >
          Live Feed
        </span>
        <span
          className="text-[10px] ml-auto"
          style={{ color: 'rgba(184,228,247,0.3)', fontFamily: 'Nunito, sans-serif' }}
        >
          {messages.length} events
        </span>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-0.5">
        {messages.length === 0 && (
          <div
            className="text-sm italic p-4 text-center"
            style={{ color: 'rgba(74,174,217,0.4)', fontFamily: 'Nunito, sans-serif' }}
          >
            The kitchen hasn't opened yet. SpongeBob is ready though 🧽
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const agent = AGENTS[msg.agentId];

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg ${TYPE_BORDER[msg.type]}`}
                style={{ background: 'rgba(74,174,217,0.03)' }}
              >
                {agent?.avatarUrl ? (
                  <img
                    src={resolveAvatarUrl(agent.avatarUrl)}
                    alt={agent.name}
                    className="w-6 h-6 rounded-full object-contain shrink-0"
                    style={{ background: '#0B3D60' }}
                  />
                ) : (
                  <span className="text-base shrink-0">{agent?.emoji ?? '🐟'}</span>
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className="font-semibold"
                    style={{ color: '#B8E4F7', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {agent?.name ?? msg.agentId}
                  </span>
                  <span
                    className={`ml-2 ${TYPE_TEXT[msg.type]}`}
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {msg.text}
                  </span>
                </div>
                <span
                  className="font-mono shrink-0 text-[10px]"
                  style={{ color: 'rgba(184,228,247,0.2)', fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {formatTick(msg.tick)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
