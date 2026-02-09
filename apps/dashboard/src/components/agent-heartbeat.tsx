import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getAgentAvatarUrl } from '../lib/avatar';

interface AgentHeartbeatProps {
  agentId: string;
  level: number;
  status: 'ACTIVE' | 'IDLE' | 'PENDING' | 'SUSPENDED';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function AgentHeartbeat({ agentId, level, status, size = 'md', showPulse = true }: AgentHeartbeatProps) {
  const [isWorking, setIsWorking] = useState(status === 'ACTIVE');

  // Simulate activity changes in demo mode
  useEffect(() => {
    const isDemo = window.location.search.includes('demo=true');
    if (!isDemo || status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setIsWorking((prev) => Math.random() > 0.3 ? true : !prev);
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [status]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const pulseColors = {
    ACTIVE: 'bg-green-500',
    IDLE: 'bg-emerald-400',  // Brighter for availability
    PENDING: 'bg-blue-500',
    SUSPENDED: 'bg-red-500',
  };

  const ringColors = {
    ACTIVE: 'ring-green-500/50',
    IDLE: 'ring-emerald-400/60',  // Brighter for availability
    PENDING: 'ring-blue-500/50',
    SUSPENDED: 'ring-red-500/50',
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <motion.img
        src={getAgentAvatarUrl(agentId, level)}
        alt=""
        className={cn(
          'rounded-full ring-2 transition-all',
          sizeClasses[size],
          isWorking && status === 'ACTIVE' ? ringColors[status] : 'ring-slate-600'
        )}
        animate={isWorking && status === 'ACTIVE' ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Status indicator dot */}
      <span
        className={cn(
          'absolute bottom-0 right-0 block rounded-full ring-2 ring-slate-800',
          size === 'sm' && 'w-2.5 h-2.5',
          size === 'md' && 'w-3 h-3',
          size === 'lg' && 'w-4 h-4',
          pulseColors[status]
        )}
      />

      {/* Pulse animation for active working agents */}
      <AnimatePresence>
        {showPulse && isWorking && status === 'ACTIVE' && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={cn(
              'absolute inset-0 rounded-full',
              pulseColors[status]
            )}
          />
        )}
      </AnimatePresence>

      {/* Activity indicator ring for working agents */}
      {isWorking && status === 'ACTIVE' && (
        <motion.span
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            'border-t-green-400 border-r-green-400/50'
          )}
        />
      )}

      {/* Special idle pulse - subtle glow to show agent is available */}
      {showPulse && status === 'IDLE' && (
        <>
          <motion.span
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-emerald-400/30"
          />
          <motion.span
            animate={{
              scale: [1, 1.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full border-2 border-emerald-400"
          />
        </>
      )}
    </div>
  );
}

// Row of agent heartbeats for overview
export function AgentHeartbeatRow({ agents }: { agents: { id: string; level: number; status: string; name: string }[] }) {
  return (
    <div className="flex items-center gap-2">
      {agents.map((agent) => (
        <div key={agent.id} className="group relative">
          <AgentHeartbeat
            agentId={agent.id}
            level={agent.level}
            status={agent.status as AgentHeartbeatProps['status']}
            size="sm"
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {agent.name}
          </div>
        </div>
      ))}
    </div>
  );
}
