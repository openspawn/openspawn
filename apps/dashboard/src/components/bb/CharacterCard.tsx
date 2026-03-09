/**
 * CharacterCard — BikiniBottom character display card.
 * Used on landing "Meet the Crew" and dashboard agent roster.
 *
 * NOTE: All animations use plain CSS (bb-tokens.css keyframes) — no motion/react.
 */

import { useState } from "react";

export enum CharacterStatus {
  Idle = "idle",
  Working = "working",
  Busy = "busy",
  Overwhelmed = "overwhelmed",
}

export interface AgentCharacter {
  id: string;
  name: string;
  emoji: string;
  avatarUrl?: string;
  jobTitle: string;
  team: string;
  cardClass?: string;
  accentColor: string;
  status: CharacterStatus;
  lastMessage?: string;
  queueSize?: number;
}

export const STATUS_LABEL: Record<CharacterStatus, string> = {
  [CharacterStatus.Idle]: "Waiting…",
  [CharacterStatus.Working]: "ON IT 🔥",
  [CharacterStatus.Busy]: "SWAMPED 😅",
  [CharacterStatus.Overwhelmed]: "HELP 🚨",
};

const STATUS_STYLE: Record<CharacterStatus, string> = {
  [CharacterStatus.Idle]: "bg-[#4AAED9]/10 text-[#4AAED9] border border-[#4AAED9]/30",
  [CharacterStatus.Working]: "bg-[#F4C542]/15 text-[#F4C542] border border-[#F4C542]/40",
  [CharacterStatus.Busy]: "bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/40",
  [CharacterStatus.Overwhelmed]: "bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]/50",
};

const STATUS_RING: Record<CharacterStatus, string> = {
  [CharacterStatus.Idle]: "border-[#4AAED9]/30",
  [CharacterStatus.Working]: "border-[#F4C542] shadow-[0_0_16px_rgba(244,197,66,0.5)]",
  [CharacterStatus.Busy]: "border-[#FF6B6B] shadow-[0_0_12px_rgba(255,107,107,0.4)]",
  [CharacterStatus.Overwhelmed]: "border-[#FF4757] shadow-[0_0_20px_rgba(255,71,87,0.6)]",
};

const ANIM_CLASS: Record<CharacterStatus, string> = {
  [CharacterStatus.Idle]: "animate-[bb-bob_2.5s_ease-in-out_infinite]",
  [CharacterStatus.Working]: "animate-[bb-bob_1s_ease-in-out_infinite]",
  [CharacterStatus.Busy]: "animate-[bb-bob_1.2s_ease-in-out_infinite]",
  [CharacterStatus.Overwhelmed]: "animate-[bb-bob_0.6s_ease-in-out_infinite]",
};

interface CharacterCardProps {
  agent: AgentCharacter;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function CharacterCard({ agent, onClick, size = "md" }: CharacterCardProps) {
  const isCrisis = agent.status === CharacterStatus.Overwhelmed;
  const isActive =
    agent.status === CharacterStatus.Working || agent.status === CharacterStatus.Busy;

  const sizeClasses = { sm: "p-3 gap-3", md: "p-4 gap-4", lg: "p-6 gap-5" };
  const avatarSizes = {
    sm: "w-12 h-12 text-2xl",
    md: "w-16 h-16 text-3xl",
    lg: "w-24 h-24 text-5xl",
  };

  return (
    <div
      className={`
        relative flex items-start ${sizeClasses[size]}
        bg-[rgba(11,61,96,0.6)] border border-[rgba(74,174,217,0.2)]
        rounded-[1.25rem] cursor-pointer
        backdrop-blur-[12px]
        transition-all duration-200 hover:-translate-y-1 hover:scale-[1.015]
        ${agent.cardClass ?? ""}
      `}
      style={{
        boxShadow: "0 4px 20px rgba(6,42,69,0.5), 0 1px 4px rgba(244,197,66,0.05)",
      }}
      onClick={onClick}
    >
      {/* Crisis overlay flash */}
      {isCrisis && (
        <div
          className="absolute inset-0 rounded-[1.25rem] bg-[#FF4757]/5 pointer-events-none animate-[bb-pulse-ring_1s_ease-in-out_infinite]"
          style={{ "--bb-ring-color": "rgba(255, 71, 87, 0.4)" } as React.CSSProperties}
        />
      )}

      {/* Avatar */}
      <div
        className={`
          relative shrink-0 ${avatarSizes[size]}
          rounded-full border-2 ${STATUS_RING[agent.status]}
          bg-gradient-to-br from-[#0B3D60] to-[#062A45]
          flex items-center justify-center overflow-hidden
          ${ANIM_CLASS[agent.status]}
        `}
      >
        {agent.avatarUrl ? (
          <img
            src={agent.avatarUrl}
            alt={agent.name}
            className="w-full h-full object-contain p-0.5"
          />
        ) : (
          <span className="leading-none select-none">{agent.emoji}</span>
        )}

        {/* Active glow ring */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${agent.accentColor}20 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3
            className="font-['Baloo_2'] font-bold text-[#E8F8FF] leading-tight truncate"
            style={{ fontSize: size === "lg" ? "1.125rem" : "0.9375rem" }}
          >
            {agent.name}
          </h3>
          <span
            className={`
              shrink-0 inline-flex items-center gap-1
              px-2 py-0.5 rounded-full text-[10px] font-['Nunito'] font-semibold
              uppercase tracking-wide
              ${STATUS_STYLE[agent.status]}
            `}
          >
            {STATUS_LABEL[agent.status]}
          </span>
        </div>

        {/* Job title */}
        <p className="text-[#4AAED9] text-xs font-['Nunito'] font-medium mb-0.5">
          {agent.jobTitle}
        </p>

        {/* Team */}
        <p className="text-[#B8E4F7]/50 text-[11px] font-['Nunito']">{agent.team}</p>

        {/* Queue badge */}
        {agent.queueSize != null && agent.queueSize > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[#FF6B6B] text-[11px] font-['Nunito'] font-semibold">
              {agent.queueSize} in queue
            </span>
            {agent.queueSize > 50 && <span className="text-[10px]">🚨</span>}
          </div>
        )}

        {/* Last message */}
        {agent.lastMessage && size !== "sm" && (
          <div className="mt-2 pt-2 border-t border-[rgba(74,174,217,0.1)]">
            <p className="text-[#B8E4F7]/60 text-[11px] font-['Nunito'] italic leading-snug line-clamp-2">
              "{agent.lastMessage}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CharacterCardGrid ─────────────────────────────────────────────────────────

interface CharacterCardGridProps {
  agents: AgentCharacter[];
  maxVisible?: number;
  onAgentClick?: (agent: AgentCharacter) => void;
}

export function CharacterCardGrid({
  agents,
  maxVisible = 6,
  onAgentClick,
}: CharacterCardGridProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? agents : agents.slice(0, maxVisible);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((agent) => (
          <div key={agent.id}>
            <CharacterCard
              agent={agent}
              size="md"
              onClick={onAgentClick ? () => onAgentClick(agent) : undefined}
            />
          </div>
        ))}
      </div>

      {agents.length > maxVisible && (
        <button
          className="mt-6 mx-auto flex items-center gap-2 text-[#4AAED9] font-['Nunito'] font-semibold text-sm hover:text-[#F4C542] transition-colors hover:scale-[1.02]"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? "Show fewer agents ↑"
            : `See all ${agents.length} agents → (${agents.length - maxVisible} more)`}
        </button>
      )}
    </div>
  );
}
