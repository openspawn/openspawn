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

  return {
    tasks: Array.isArray(rest.data) ? rest.data : Array.isArray((rest.data as any)?.data) ? (rest.data as any).data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
