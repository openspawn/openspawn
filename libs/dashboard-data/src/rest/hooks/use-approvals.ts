import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";

export function useApprovals(status?: string, actionType?: string) {
  return useQuery({
    queryKey: ["approvals", status, actionType],
    queryFn: async () => {
      const { data, error } = await api.GET("/approvals", {
        params: { query: { status, action_type: actionType } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveApproval(approvalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notes?: string) => {
      const { data, error } = await api.POST("/approvals/{approval_id}/approve", {
        params: { path: { approval_id: approvalId } },
        body: notes ? { notes } : undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useRejectApproval(approvalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notes: string) => {
      const { data, error } = await api.POST("/approvals/{approval_id}/reject", {
        params: { path: { approval_id: approvalId } },
        body: { notes },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateTaskAutonomy(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (autonomyLevel: number | null) => {
      const { data, error } = await api.PATCH("/tasks/{task_id}/autonomy", {
        params: { path: { task_id: taskId } },
        body: { autonomy_level: autonomyLevel },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
