import { useEvents as useRestEvents } from "../rest/hooks/use-events";

export type Event = {
  id: string;
  type: string;
  severity: string;
  message: string;
  agentId?: string | null;
  taskId?: string | null;
  actor?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  reasoning?: string | null;
  createdAt: string;
};

export function useEvents() {
  const rest = useRestEvents();

  const raw = rest.data;
  const events: Event[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown> | undefined)?.data)
      ? ((raw as Record<string, unknown>).data as Event[])
      : [];

  return {
    events,
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
