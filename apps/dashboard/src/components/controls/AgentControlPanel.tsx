/**
 * AgentControlPanel — slides in when an agent is selected.
 * Shows status, pause/resume, reassign, fire, model tier controls.
 * CSS animations only, no motion/react.
 */

import { useState } from 'react';
import { resolveAvatarUrl } from '../../lib/resolve-avatar-url';
import { DEPARTMENTS, type AgentControlState, type AgentControlStatus, type Department } from './types';
import { ConfirmModal } from './ConfirmModal';

const STATUS_COLORS: Record<AgentControlStatus, { bg: string; text: string; label: string }> = {
  idle:        { bg: 'rgba(74,174,217,0.15)', text: '#4AAED9', label: 'IDLE' },
  working:     { bg: 'rgba(244,197,66,0.15)', text: '#F4C542', label: 'WORKING' },
  busy:        { bg: 'rgba(255,107,107,0.15)', text: '#FF6B6B', label: 'BUSY' },
  overwhelmed: { bg: 'rgba(255,71,87,0.2)',   text: '#FF4757', label: 'OVERWHELMED' },
  paused:      { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8', label: 'PAUSED' },
};

interface AgentControlPanelProps {
  agent: AgentControlState;
  onClose: () => void;
  onPauseResume: (agentId: string) => void;
  onReassign: (agentId: string, department: Department) => void;
  onFire: (agentId: string) => void;
  onModelChange: (agentId: string, tier: 'sonnet' | 'opus') => void;
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
  const statusInfo = STATUS_COLORS[agent.status];
  const isPaused = agent.status === 'paused';

  return (
    <>
      <div
        className="fixed inset-y-0 right-0 w-80 max-w-[90vw] z-50 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(6,42,69,0.97) 0%, rgba(3,14,26,0.98) 100%)',
          borderLeft: '1px solid rgba(74,174,217,0.2)',
          backdropFilter: 'blur(16px)',
          animation: 'slide-in-right 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgba(74,174,217,0.12)]">
          <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'radial-gradient(circle, #0B3D60, #062A45)',
              border: `2px solid ${statusInfo.text}`,
              opacity: isPaused ? 0.5 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            {agent.avatarUrl ? (
              <img src={resolveAvatarUrl(agent.avatarUrl)} alt={agent.name} className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="text-xl">{agent.emoji}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: '#B8E4F7', fontFamily: '"Baloo 2", cursive' }}>
              {agent.name}
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(184,228,247,0.5)', fontFamily: 'Nunito, sans-serif' }}>
              {agent.department}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[rgba(184,228,247,0.4)] hover:text-[#B8E4F7] hover:bg-[rgba(74,174,217,0.1)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status badge */}
        <div className="px-4 pt-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: statusInfo.bg,
              color: statusInfo.text,
              fontFamily: 'Nunito, sans-serif',
              transition: 'all 0.3s',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{
              background: statusInfo.text,
              animation: isPaused ? 'none' : 'status-pulse 2s ease-in-out infinite',
            }} />
            {statusInfo.label}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Pause/Resume */}
          <button
            onClick={() => {
              console.log(`[AgentControl] ${isPaused ? 'resume' : 'pause'}: ${agent.id}`);
              onPauseResume(agent.id);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: isPaused ? 'rgba(74,232,138,0.12)' : 'rgba(148,163,184,0.1)',
              border: `1px solid ${isPaused ? 'rgba(74,232,138,0.3)' : 'rgba(148,163,184,0.2)'}`,
              color: isPaused ? '#4AE88A' : '#94A3B8',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <span className="text-lg">{isPaused ? '▶️' : '⏸️'}</span>
            {isPaused ? 'Resume Agent' : 'Pause Agent'}
          </button>

          {/* Reassign */}
          <div className="relative">
            <button
              onClick={() => setShowReassign(!showReassign)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(74,174,217,0.1)',
                border: '1px solid rgba(74,174,217,0.2)',
                color: '#4AAED9',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <span className="text-lg">🔄</span>
              Reassign Department
              <span className="ml-auto text-xs">{showReassign ? '▲' : '▼'}</span>
            </button>

            {showReassign && (
              <div
                className="mt-1 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(6,42,69,0.95)',
                  border: '1px solid rgba(74,174,217,0.15)',
                  animation: 'fade-in-down 0.15s ease-out',
                }}
              >
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    disabled={dept === agent.department}
                    onClick={() => {
                      console.log(`[AgentControl] reassign: ${agent.id} → ${dept}`);
                      onReassign(agent.id, dept);
                      setShowReassign(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-30"
                    style={{
                      color: dept === agent.department ? 'rgba(184,228,247,0.3)' : '#B8E4F7',
                      fontFamily: 'Nunito, sans-serif',
                      borderBottom: '1px solid rgba(74,174,217,0.06)',
                      background: dept === agent.department ? 'transparent' : undefined,
                    }}
                    onMouseEnter={e => { if (dept !== agent.department) (e.target as HTMLElement).style.background = 'rgba(74,174,217,0.08)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = ''; }}
                  >
                    {dept === agent.department ? `${dept} (current)` : dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Tier */}
          <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="text-[11px] font-semibold mb-2" style={{ color: 'rgba(184,228,247,0.5)', fontFamily: 'Nunito, sans-serif' }}>
              MODEL TIER
            </div>
            <div className="flex gap-2">
              {(['sonnet', 'opus'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => {
                    console.log(`[AgentControl] model-change: ${agent.id} → ${tier}`);
                    onModelChange(agent.id, tier);
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    background: agent.modelTier === tier ? 'rgba(99,102,241,0.25)' : 'transparent',
                    border: `1px solid ${agent.modelTier === tier ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.15)'}`,
                    color: agent.modelTier === tier ? '#818CF8' : 'rgba(184,228,247,0.4)',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  {tier === 'sonnet' ? '⚡ Sonnet' : '🧠 Opus'}
                </button>
              ))}
            </div>
          </div>

          {/* Fire */}
          <button
            onClick={() => setShowFireConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: 'rgba(255,71,87,0.08)',
              border: '1px solid rgba(255,71,87,0.2)',
              color: '#FF4757',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <span className="text-lg">🔥</span>
            Fire Agent
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(3,14,26,0.4)', animation: 'fade-in 0.2s ease-out' }}
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
