import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../client";

export function useEvents(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await api.GET("/events");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export interface EventStreamItem {
  id: string;
  org_id?: string;
  type: string;
  actor_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  data?: Record<string, unknown> | null;
  severity?: string;
  created_at: string;
}

/**
 * Real-time event stream hook.
 * Connects to SSE via /events/stream?token=<jwt> for live updates.
 * Falls back to polling GET /events every 30s if SSE fails.
 */
export function useEventStream(options?: { maxEvents?: number; enabled?: boolean }) {
  const maxEvents = options?.maxEvents ?? 50;
  const enabled = options?.enabled ?? true;
  const [events, setEvents] = useState<EventStreamItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const disposedRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseFailedRef = useRef(false);

  // Fetch initial events
  const loadInitial = useCallback(async () => {
    try {
      const { data, error: fetchErr } = await api.GET("/events");
      if (fetchErr) throw fetchErr;
      const items = (data as { data?: EventStreamItem[] })?.data ?? [];
      setEvents(items.slice(0, maxEvents));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [maxEvents]);

  // Get SSE token
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error: tokenErr } = await api.POST("/events/token");
      if (tokenErr) throw tokenErr;
      const token = (data as { data?: { token?: string } })?.data?.token;
      return token ?? null;
    } catch {
      return null;
    }
  }, []);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (disposedRef.current) return;
    const poll = async () => {
      if (disposedRef.current) return;
      try {
        const { data } = await api.GET("/events");
        const items = (data as { data?: EventStreamItem[] })?.data ?? [];
        setEvents(items.slice(0, maxEvents));
      } catch {
        // ignore polling errors
      }
      if (!disposedRef.current) {
        pollTimerRef.current = setTimeout(poll, 30_000);
      }
    };
    pollTimerRef.current = setTimeout(poll, 30_000);
  }, [maxEvents]);

  // Connect to SSE
  const connectSSE = useCallback(async () => {
    if (disposedRef.current) return;

    const token = await getToken();
    if (!token || disposedRef.current) {
      sseFailedRef.current = true;
      startPolling();
      return;
    }

    // Derive SSE URL from API base
    const baseUrl = (api as unknown as { clientOptions?: { baseUrl?: string } }).clientOptions
      ?.baseUrl;
    const sseBase = baseUrl ?? "";
    const es = new EventSource(`${sseBase}/events/stream?token=${token}`);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as EventStreamItem;
        setEvents((prev) => {
          const next = [event, ...prev.filter((e) => e.id !== event.id)];
          return next.slice(0, maxEvents);
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setConnected(false);

      if (!disposedRef.current) {
        // Try reconnecting after 5s, fall back to polling after 3 failures
        sseFailedRef.current = true;
        startPolling();
        // Also try to reconnect SSE after a delay
        reconnectTimerRef.current = setTimeout(connectSSE, 30_000);
      }
    };
  }, [getToken, maxEvents, startPolling]);

  useEffect(() => {
    if (!enabled) return;
    disposedRef.current = false;

    // Load initial events, then connect SSE
    loadInitial().then(() => {
      if (!disposedRef.current) {
        connectSSE();
      }
    });

    return () => {
      disposedRef.current = true;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      setConnected(false);
    };
  }, [enabled, loadInitial, connectSSE]);

  return { events, connected, error };
}
