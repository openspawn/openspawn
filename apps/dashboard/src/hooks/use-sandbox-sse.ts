/**
 * Shared hook for connecting to the sandbox SSE stream.
 * Only connects when isSandboxMode is true.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { isSandboxMode } from '../graphql/fetcher';

export interface SandboxSSEEvent {
  type: string;
  agentId?: string;
  taskId?: string;
  message?: string;
  timestamp?: number;
  agentName?: string;
  fromAgentId?: string;
  toAgentId?: string;
}

type SSECallback = (event: SandboxSSEEvent) => void;

/**
 * Subscribe to sandbox SSE events. Returns nothing — call the provided
 * callback whenever an event arrives. Auto-reconnects on disconnect.
 * Only connects when `isSandboxMode` is true.
 */
export function useSandboxSSE(callback: SSECallback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!isSandboxMode) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;
      es = new EventSource('http://localhost:3333/api/stream');

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as SandboxSSEEvent;
          cbRef.current(data);
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es?.close();
        if (!disposed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);
}
