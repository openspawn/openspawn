/**
 * LiveTickerFeed — auto-scrolling live activity ticker for the landing page.
 *
 * NOTE: All animations use plain CSS — no motion/react.
 */

import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export interface TickerMessage {
  id: string;
  agentEmoji: string;
  agentName: string;
  text: string;
  type: 'message' | 'escalation' | 'completion' | 'delegation';
}

const TYPE_STYLE: Record<TickerMessage['type'], string> = {
  message:    'text-[#B8E4F7]',
  escalation: 'text-[#FF6B6B]',
  completion: 'text-[#4AE88A]',
  delegation: 'text-[#F4C542]',
};

const BORDER_STYLE: Record<TickerMessage['type'], string> = {
  message:    '',
  escalation: 'border-l-2 border-l-[#FF6B6B] !pl-3',
  completion: 'border-l-2 border-l-[#4AE88A] !pl-3',
  delegation: 'border-l-2 border-l-[#F4C542] !pl-3',
};

interface LiveTickerFeedProps {
  messages: TickerMessage[];
  onJoinWatch?: () => void;
}

export function LiveTickerFeed({ messages, onJoinWatch }: LiveTickerFeedProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="relative bg-[rgba(6,42,69,0.85)] border border-[rgba(74,174,217,0.2)] rounded-2xl overflow-hidden backdrop-blur-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(74,174,217,0.15)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4757] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4757]" />
          </span>
          <span className="text-[#B8E4F7] font-['Baloo_2'] font-bold text-sm tracking-wide">
            LIVE FEED
          </span>
        </div>
        {onJoinWatch && (
          <button
            onClick={onJoinWatch}
            className="text-[#F4C542] text-xs font-['Nunito'] font-semibold hover:text-[#FDE68A] transition-colors flex items-center gap-1"
          >
            Watch Live <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="h-48 overflow-y-auto scrollbar-none px-0 py-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`
              flex items-start gap-2 px-4 py-2
              border-b border-[rgba(74,174,217,0.06)]
              ${BORDER_STYLE[msg.type]}
            `}
          >
            <span className="shrink-0 text-base leading-none mt-0.5">{msg.agentEmoji}</span>
            <div className="min-w-0">
              <span className="text-[#4AAED9] text-[11px] font-['Nunito'] font-semibold mr-1.5">
                {msg.agentName}:
              </span>
              <span className={`text-[11px] font-['Nunito'] ${TYPE_STYLE[msg.type]}`}>
                {msg.text}
              </span>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#4AAED9]/50 text-sm font-['Nunito'] italic">
              The kitchen hasn't opened yet. SpongeBob is ready though 🧽
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
