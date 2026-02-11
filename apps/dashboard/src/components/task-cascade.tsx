/**
 * Task Cascade Timeline — shows the ACP message chain for a task.
 * Vertical timeline with color-coded entries and staggered animations.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { isSandboxMode } from '../graphql/fetcher';
import { SANDBOX_URL } from '../lib/sandbox-url';

interface ACPMessage {
  id: string;
  type: 'ack' | 'delegation' | 'progress' | 'escalation' | 'completion';
  from: string;
  to: string;
  taskId: string;
  body?: string;
  reason?: string;
  summary?: string;
  timestamp: number;
  agentName?: string;
}

const typeConfig: Record<string, { icon: string; color: string; label: string; borderColor: string }> = {
  delegation:  { icon: '📋', color: 'text-blue-400',    label: 'Delegation',  borderColor: 'border-blue-500/40' },
  ack:         { icon: '👍', color: 'text-zinc-400',    label: 'Acknowledged', borderColor: 'border-zinc-500/40' },
  progress:    { icon: '📊', color: 'text-foreground',  label: 'Progress',    borderColor: 'border-zinc-600/40' },
  escalation:  { icon: '⚠️', color: 'text-orange-400', label: 'Escalation',  borderColor: 'border-orange-500/40' },
  completion:  { icon: '✅', color: 'text-emerald-400', label: 'Completed',   borderColor: 'border-emerald-500/40' },
};

const dotColors: Record<string, string> = {
  delegation: 'bg-blue-500',
  ack: 'bg-zinc-500',
  progress: 'bg-zinc-400',
  escalation: 'bg-orange-500',
  completion: 'bg-emerald-500',
};

interface TaskCascadeProps {
  taskId: string;
}

export function TaskCascade({ taskId }: TaskCascadeProps) {
  const [events, setEvents] = useState<ACPMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSandboxMode || !taskId) {
      setLoading(false);
      return;
    }

    fetch(`${SANDBOX_URL}/api/task/${taskId}/activity`)
      .then(r => r.json())
      .then((data: ACPMessage[]) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!isSandboxMode) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Task activity tracking available in sandbox mode
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse py-4 text-center">
        Loading activity…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">No cascade activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        ACP Message Cascade
      </h4>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

        {events.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.progress;
          const dotColor = dotColors[event.type] || 'bg-zinc-500';
          const body = event.body || event.summary || event.reason || '';

          return (
            <motion.div
              key={event.id || `${event.timestamp}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="relative mb-3 last:mb-0"
            >
              {/* Dot on timeline */}
              <div className={`absolute -left-6 top-1.5 w-[10px] h-[10px] rounded-full border-2 border-background ${dotColor}`} />

              <div className={`rounded-lg border ${config.borderColor} bg-muted/30 px-3 py-2`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{config.icon}</span>
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  {event.agentName && (
                    <span className="text-xs text-cyan-400 font-medium">{event.agentName}</span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
                {body && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
