import { useEffect, useRef, useState } from 'react';
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

// Full-background chip styling for escalation/completion
const TYPE_BG: Record<FeedMessage['type'], string> = {
  escalation: 'rgba(255,71,87,0.15)',
  completion:  'rgba(74,232,138,0.10)',
  reassign:    'rgba(244,197,66,0.05)',
  delegation:  'rgba(244,197,66,0.04)',
  message:     'rgba(74,174,217,0.03)',
};

const TYPE_BORDER: Record<FeedMessage['type'], string> = {
  escalation: '4px solid #FF4757',
  completion:  '4px solid #4AE88A',
  reassign:    '3px solid #F4C542',
  delegation:  '3px solid #F4C542',
  message:     '2px solid transparent',
};

const TYPE_TEXT: Record<FeedMessage['type'], string> = {
  escalation: '#FF8E8E',
  completion:  '#6EF2A4',
  reassign:    '#FDE68A',
  delegation:  '#FDE68A',
  message:     'rgba(184,228,247,0.70)',
};

const TYPE_PREFIX: Record<FeedMessage['type'], string> = {
  escalation: '🚨 ',
  completion:  '✅ ',
  delegation:  '→ ',
  reassign:    '🔀 ',
  message:     '',
};

// CSS animation class injected once
const FEED_STYLES = `
  @keyframes feed-slide-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes feed-slide-right {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes feed-scale-in {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
  }
  .feed-entry { animation: feed-slide-in 0.2s ease forwards; }
  .feed-entry-escalation { animation: feed-slide-right 0.25s ease forwards; }
  .feed-entry-completion { animation: feed-scale-in 0.3s ease forwards; }
`;

function FeedEntry({ msg, isMobile }: { msg: FeedMessage; isMobile?: boolean }) {
  const agent = AGENTS[msg.agentId];
  const animClass =
    msg.type === 'escalation' ? 'feed-entry-escalation' :
    msg.type === 'completion'  ? 'feed-entry-completion' :
    'feed-entry';

  return (
    <div
      className={`flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg ${animClass}`}
      style={{
        background: TYPE_BG[msg.type],
        borderLeft: TYPE_BORDER[msg.type],
      }}
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
          className="ml-2"
          style={{ color: TYPE_TEXT[msg.type], fontFamily: 'Nunito, sans-serif' }}
        >
          {isMobile ? TYPE_PREFIX[msg.type] : ''}{msg.text}
        </span>
      </div>
      <span
        className="font-mono shrink-0 text-[10px]"
        style={{ color: 'rgba(184,228,247,0.2)', fontFamily: '"JetBrains Mono", monospace' }}
      >
        {formatTick(msg.tick)}
      </span>
    </div>
  );
}

export function LiveFeed({ messages }: LiveFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    if (!isMobile || expanded) {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [messages.length, isMobile, expanded]);

  // On mobile: show last 3 messages in compact mode
  const visibleMessages = isMobile && !expanded ? messages.slice(-3) : messages;
  const hiddenCount = messages.length - 3;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: 'rgba(6,42,69,0.7)',
        borderLeft: '1px solid rgba(74,174,217,0.15)',
        backdropFilter: 'blur(8px)',
        height: '100%',
      }}
    >
      <style>{FEED_STYLES}</style>

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

        {/* Mobile expand/collapse toggle */}
        {isMobile && messages.length > 3 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(74,174,217,0.12)',
              border: '1px solid rgba(74,174,217,0.25)',
              color: '#4AAED9',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
            }}
          >
            {expanded ? '▼ Collapse' : `⬆ All`}
          </button>
        )}
      </div>

      {/* Messages container — compact on mobile, full on desktop */}
      <div
        ref={containerRef}
        className="overflow-y-auto scrollbar-none p-2 space-y-0.5"
        style={{
          flex: isMobile && !expanded ? '0 0 auto' : '1 1 0',
          height: isMobile && !expanded ? '120px' : isMobile && expanded ? '50vh' : undefined,
          transition: 'height 0.3s ease',
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && (
          <div
            className="text-sm italic p-4 text-center"
            style={{ color: 'rgba(74,174,217,0.4)', fontFamily: 'Nunito, sans-serif' }}
          >
            The kitchen hasn't opened yet. SpongeBob is ready though 🧽
          </div>
        )}

        {visibleMessages.map(msg => (
          <FeedEntry key={msg.id} msg={msg} isMobile={isMobile} />
        ))}
      </div>

      {/* Mobile "earlier messages" footer */}
      {isMobile && !expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="shrink-0 py-1.5 text-center text-[11px]"
          style={{
            borderTop: '1px solid rgba(74,174,217,0.1)',
            color: 'rgba(74,174,217,0.6)',
            background: 'rgba(6,42,69,0.6)',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer',
            border: 'none',
            width: '100%',
          }}
        >
          ▲ {hiddenCount} earlier messages
        </button>
      )}
    </div>
  );
}
