/**
 * AgentControlPanel — slides in when an agent is selected.
 * Shows status, pause/resume, reassign, fire, model tier controls.
 * CSS animations only, no motion/react.
 */

import { useState } from "react";
import { resolveAvatarUrl } from "../../lib/resolve-avatar-url";
import { cn } from "../../lib/utils";
import {
  DEPARTMENTS,
  type AgentControlState,
  type AgentControlStatus,
  type Department,
} from "./types";
import { ConfirmModal } from "./ConfirmModal";
import { StatusBadge } from "../ui/status-badge";
import { ActionButton } from "../ui/action-button";

const STATUS_BORDER: Record<AgentControlStatus, string> = {
  idle: "border-bb-ocean-400",
  working: "border-bb-sandy-400",
  busy: "border-bb-coral-400",
  overwhelmed: "border-bb-coral-500",
  paused: "border-slate-400",
};

interface AgentControlPanelProps {
  agent: AgentControlState;
  onClose: () => void;
  onPauseResume: (agentId: string) => void;
  onReassign: (agentId: string, department: Department) => void;
  onFire: (agentId: string) => void;
  onModelChange: (agentId: string, tier: "sonnet" | "opus") => void;
}

export function AgentControlPanel({
  agent,
  onClose,
  onPauseResume,
  onReassign,
  onFire,
  onModelChange,
}: AgentControlPanelProps) {
  const [showReassign, setShowReassign] = useState(false);
  const [showFireConfirm, setShowFireConfirm] = useState(false);
  const isPaused = agent.status === "paused";

  return (
    <>
      <div
        className="fixed inset-y-0 right-0 w-80 max-w-[90vw] z-50 flex flex-col
          bg-gradient-to-b from-bb-ocean-900/[0.97] to-bb-ocean-abyss/[0.98]
          border-l border-bb-ocean-400/20 backdrop-blur-2xl
          animate-[slide-in-right_0.25s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-bb-ocean-400/[0.12]">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 transition-opacity duration-300",
              "bg-gradient-to-br from-bb-ocean-800 to-bb-ocean-900",
              STATUS_BORDER[agent.status],
              isPaused && "opacity-50",
            )}
          >
            {agent.avatarUrl ? (
              <img
                src={resolveAvatarUrl(agent.avatarUrl)}
                alt={agent.name}
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              <span className="text-xl">{agent.emoji}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate text-bb-ocean-200 font-display">
              {agent.name}
            </div>
            <div className="text-[11px] text-bb-ocean-200/50 font-body">{agent.department}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-bb-ocean-200/40 hover:text-bb-ocean-200 hover:bg-bb-ocean-400/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status badge */}
        <div className="px-4 pt-4">
          <StatusBadge status={agent.status} label={agent.status.toUpperCase()} />
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Pause/Resume */}
          <ActionButton
            intent={isPaused ? "kelp" : undefined}
            size="lg"
            fullWidth
            className={cn(
              "hover:scale-[1.01]",
              !isPaused && "bg-slate-400/10 border-slate-400/20 text-slate-400",
            )}
            onClick={() => {
              console.log(`[AgentControl] ${isPaused ? "resume" : "pause"}: ${agent.id}`);
              onPauseResume(agent.id);
            }}
          >
            <span className="text-lg">{isPaused ? "▶️" : "⏸️"}</span>
            {isPaused ? "Resume Agent" : "Pause Agent"}
          </ActionButton>

          {/* Reassign */}
          <div className="relative">
            <ActionButton
              intent="ocean"
              size="lg"
              fullWidth
              className="hover:scale-[1.01]"
              onClick={() => setShowReassign(!showReassign)}
            >
              <span className="text-lg">🔄</span>
              Reassign Department
              <span className="ml-auto text-xs">{showReassign ? "▲" : "▼"}</span>
            </ActionButton>

            {showReassign && (
              <div className="mt-1 rounded-xl overflow-hidden bg-bb-ocean-900/95 border border-bb-ocean-400/15 animate-[fade-in-down_0.15s_ease-out]">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    disabled={dept === agent.department}
                    onClick={() => {
                      console.log(`[AgentControl] reassign: ${agent.id} → ${dept}`);
                      onReassign(agent.id, dept);
                      setShowReassign(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-medium font-body transition-colors border-b border-bb-ocean-400/[0.06] disabled:opacity-30",
                      dept === agent.department
                        ? "text-bb-ocean-200/30"
                        : "text-bb-ocean-200 hover:bg-bb-ocean-400/[0.08]",
                    )}
                  >
                    {dept === agent.department ? `${dept} (current)` : dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Tier */}
          <div className="px-4 py-3 rounded-xl bg-indigo-400/[0.08] border border-indigo-400/20">
            <div className="text-[11px] font-semibold mb-2 text-bb-ocean-200/50 font-body">
              MODEL TIER
            </div>
            <div className="flex gap-2">
              {(["sonnet", "opus"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    console.log(`[AgentControl] model-change: ${agent.id} → ${tier}`);
                    onModelChange(agent.id, tier);
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold font-body transition-all duration-200 border",
                    agent.modelTier === tier
                      ? "bg-indigo-400/25 border-indigo-400/50 text-indigo-400"
                      : "bg-transparent border-indigo-400/15 text-bb-ocean-200/40",
                  )}
                >
                  {tier === "sonnet" ? "⚡ Sonnet" : "🧠 Opus"}
                </button>
              ))}
            </div>
          </div>

          {/* Fire */}
          <ActionButton
            intent="coral"
            size="lg"
            fullWidth
            className="hover:scale-[1.01]"
            onClick={() => setShowFireConfirm(true)}
          >
            <span className="text-lg">🔥</span>
            Fire Agent
          </ActionButton>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-bb-ocean-abyss/40 animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Fire confirmation */}
      {showFireConfirm && (
        <ConfirmModal
          title={`Fire ${agent.name}?`}
          message={`This will remove ${agent.name} from the organization. This action cannot be undone.`}
          confirmLabel="Fire Agent"
          onConfirm={() => {
            console.log(`[AgentControl] fire: ${agent.id}`);
            onFire(agent.id);
            setShowFireConfirm(false);
          }}
          onCancel={() => setShowFireConfirm(false)}
        />
      )}
    </>
  );
}
