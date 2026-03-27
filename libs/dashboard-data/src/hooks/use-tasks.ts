import type { TaskFields as _SharedTaskFields } from "@openspawn/shared-types";
import { useTasks as useRestTasks } from "../rest/hooks/use-tasks";

export type { TaskRejection } from "@openspawn/shared-types";

// Derived from shared-types, widening enum fields to string for API compat
export type Task = Omit<_SharedTaskFields, "status" | "priority"> & {
  status: string;
  priority: string;
};

export function useTasks() {
  const rest = useRestTasks();

  const raw = rest.data;
  const tasks: Task[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown> | undefined)?.data)
      ? ((raw as Record<string, unknown>).data as Task[])
      : [];

  return {
    tasks,
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
