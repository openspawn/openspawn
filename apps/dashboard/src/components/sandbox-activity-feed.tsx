/**
 * Live activity feed for sandbox mode.
 * Connects to the sandbox SSE stream and shows real-time agent actions.
 * Use in task detail sidebar or agent detail panel.
 */
import { useEffect, useState, useRef } from 'react';
import { isSandboxMode } from '../graphql/fetcher';

import { SANDBOX_URL } from '../lib/sandbox-url';

interface ActivityEvent {
  type: string;
  agentId?: string;
  agentName?: string;
  taskId?: string;
  message: string;
  timestamp: number;
}

interface SandboxActivityFeedProps {
  /** Filter events by task ID */
  taskId?: string;
  /** Filter events by agent ID */
  agentId?: string;
  /** Max events to show */
  maxEvents?: number;
}

export function SandboxActivityFeed({ taskId, agentId, maxEvents = 50 }: SandboxActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch historical events on mount
  useEffect(() => {
    if (!isSandboxMode) return;

    if (taskId) {
      fetch(`${SANDBOX_URL}/api/task/${taskId}/activity`)
        .then(r => r.json())
        .then((history: ActivityEvent[]) => setEvents(history))
        .catch(() => { /* ignore fetch errors */ });
    }
  }, [taskId]);

  // Connect to SSE stream
  useEffect(() => {
    if (!isSandboxMode) return;

    const params = new URLSearchParams();
    if (taskId) params.set('task', taskId);
    if (agentId) params.set('agent', agentId);

    const url = `${SANDBOX_URL}/api/stream?${params}`;
    const source = new EventSource(url);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (e) => {
      try {
        const event: ActivityEvent = JSON.parse(e.data);
        if (event.type === 'connected') {
          setConnected(true);
          return;
        }
        setEvents(prev => [...prev, event].slice(-maxEvents));
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [taskId, agentId, maxEvents]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (!isSandboxMode) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        Live Activity Stream
        {events.length > 0 && (
          <span className="text-muted-foreground/60">({events.length} events)</span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="bg-gray-950 rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto space-y-1 border border-border"
      >
        {events.length === 0 ? (
          <div className="text-muted-foreground/50 text-center py-4">
            {connected ? 'Waiting for agent activity...' : 'Connecting to sandbox...'}
          </div>
        ) : (
          events.map((event, i) => (
            <div key={`${event.timestamp}-${i}`} className="flex gap-2 leading-relaxed">
              <span className="text-muted-foreground/40 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
              {event.agentName && (
                <span className="text-cyan-400 shrink-0">[{event.agentName}]</span>
              )}
              {(event.type.startsWith('a2a') || event.message.includes('A2A')) && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">A2A</span>
              )}
              {(event.type.startsWith('mcp') || event.message.includes('MCP')) && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30">MCP</span>
              )}
              {event.type === 'router_decision' && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400/70 border border-amber-500/20">SIM</span>
              )}
              <span className="text-gray-300">{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
