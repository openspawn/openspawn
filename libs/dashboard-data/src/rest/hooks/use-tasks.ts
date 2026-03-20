import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useTasks(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await api.GET("/tasks");
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId],
    queryFn: async () => {
      const { data, error } = await api.GET("/tasks/{task_id}", {
        params: { path: { task_id: taskId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "comments"],
    queryFn: async () => {
      const { data, error } = await api.GET("/tasks/{task_id}/comments", {
        params: { path: { task_id: taskId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useTaskEscalations(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "escalations"],
    queryFn: async () => {
      const { data, error } = await api.GET("/tasks/{task_id}/escalations", {
        params: { path: { task_id: taskId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}
