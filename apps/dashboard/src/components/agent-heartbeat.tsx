import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { darkenForBackground } from '../lib/avatar-utils';

interface AgentHeartbeatProps {
  agentId: string;
  level: number;
  status: 'ACTIVE' | 'IDLE' | 'PENDING' | 'SUSPENDED';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  avatar?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
}

export function AgentHeartbeat({ agentId, level, status, size = 'md', showPulse = true, avatar, avatarColor, avatarUrl }: AgentHeartbeatProps) {
  const [isWorking, setIsWorking] = useState(status === 'ACTIVE');

  // Simulate activity changes in demo mode (not sandbox mode)
  useEffect(() => {
    const href = window.location.href;
    const isDemo = href.includes('demo=true');
    const isSandbox = href.includes('sandbox=true');
    
    // In sandbox mode, use actual status directly
    if (isSandbox) {
      setIsWorking(status === 'ACTIVE');
      return;
    }
    
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
    ACTIVE: 'bg-emerald-500',
    IDLE: 'bg-muted-foreground',
    PENDING: 'bg-amber-500',
    SUSPENDED: 'bg-rose-500',
  };

  const ringColors = {
    ACTIVE: 'ring-emerald-500/50',
    IDLE: 'ring-muted-foreground/50',
    PENDING: 'ring-amber-500/50',
    SUSPENDED: 'ring-rose-500/50',
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <motion.span
        className={cn(
          'rounded-full ring-2 transition-all inline-flex items-center justify-center',
          sizeClasses[size],
          size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-2xl',
          isWorking && status === 'ACTIVE' ? ringColors[status] : 'ring-border'
        )}
        style={{ backgroundColor: darkenForBackground(avatarColor || '#71717a') }}
        animate={isWorking && status === 'ACTIVE' ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : (avatar || '🤖')}
      </motion.span>

      {/* Status indicator dot */}
      <span
        className={cn(
          'absolute bottom-0 right-0 block rounded-full ring-2 ring-card',
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
            'border-t-emerald-400 border-r-emerald-400/50'
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
            className="absolute inset-0 rounded-full bg-muted-foreground/30"
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
            className="absolute inset-0 rounded-full border-2 border-muted-foreground"
          />
        </>
      )}
    </div>
  );
}

// Row of agent heartbeats for overview
export function AgentHeartbeatRow({ agents }: { agents: { id: string; level: number; status: string; name: string; avatar?: string; avatarColor?: string; avatarUrl?: string }[] }) {
  return (
    <div className="flex items-center gap-2">
      {agents.map((agent) => (
        <div key={agent.id} className="group relative">
          <AgentHeartbeat
            agentId={agent.id}
            level={agent.level}
            status={agent.status as AgentHeartbeatProps['status']}
            size="sm"
            avatar={agent.avatar}

            avatarUrl={agent.avatarUrl}
            avatarColor={agent.avatarColor}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-muted rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {agent.name}
          </div>
        </div>
      ))}
    </div>
  );
}
