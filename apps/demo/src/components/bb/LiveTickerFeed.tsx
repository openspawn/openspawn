/**
 * LiveTickerFeed — auto-scrolling live activity ticker for the landing page.
 *
 * NOTE: All animations use plain CSS — no motion/react.
 */

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

export interface TickerMessage {
  id: string;
  agentEmoji: string;
  agentName: string;
  text: string;
  type: "message" | "escalation" | "completion" | "delegation";
}

const TYPE_STYLE: Record<TickerMessage["type"], string> = {
  message: "text-bb-ocean-200",
  escalation: "text-bb-coral-400",
  completion: "text-bb-kelp-400",
  delegation: "text-bb-sandy-400",
};

const BORDER_STYLE: Record<TickerMessage["type"], string> = {
  message: "",
  escalation: "border-l-2 border-l-bb-coral-400 !pl-3",
  completion: "border-l-2 border-l-bb-kelp-400 !pl-3",
  delegation: "border-l-2 border-l-bb-sandy-400 !pl-3",
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
    <div className="relative bg-bb-ocean-900/85 border border-bb-ocean-400/20 rounded-2xl overflow-hidden backdrop-blur-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bb-ocean-400/15">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bb-coral-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-bb-coral-500" />
          </span>
          <span className="text-bb-ocean-200 font-display font-bold text-sm tracking-wide">
            LIVE FEED
          </span>
        </div>
        {onJoinWatch && (
          <button
            onClick={onJoinWatch}
            className="text-bb-sandy-400 text-xs font-body font-semibold hover:text-bb-sandy-200 transition-colors flex items-center gap-1"
          >
            Watch Live <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="h-48 overflow-y-auto scrollbar-none px-0 py-1"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`
              flex items-start gap-2 px-4 py-2
              border-b border-bb-ocean-400/[0.06]
              ${BORDER_STYLE[msg.type]}
            `}
          >
            <span className="shrink-0 text-base leading-none mt-0.5">{msg.agentEmoji}</span>
            <div className="min-w-0">
              <span className="text-bb-ocean-400 text-[11px] font-body font-semibold mr-1.5">
                {msg.agentName}:
              </span>
              <span className={`text-[11px] font-body ${TYPE_STYLE[msg.type]}`}>{msg.text}</span>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-bb-ocean-400/50 text-sm font-body italic">
              The kitchen hasn't opened yet. SpongeBob is ready though 🧽
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
