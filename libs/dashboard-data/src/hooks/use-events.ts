import { useEvents as useRestEvents } from "../rest/hooks/use-events";

export type Event = {
  id: string;
  type: string;
  severity: string;
  message: string;
  agentId?: string | null;
  taskId?: string | null;
  createdAt: string;
};

export function useEvents() {
  const rest = useRestEvents();

  return {
    events: Array.isArray(rest.data?.data) ? rest.data.data : Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
