import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await api.GET("/tasks");
      if (error) throw error;
      return data;
    },
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
