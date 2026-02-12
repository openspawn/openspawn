import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemo } from "../demo";
import type { TaskStatus, TaskPriority } from "../graphql/generated/graphql";
import type { DemoTask } from "@openspawn/demo-data";

/** Shape returned by the claimNextTask mutation (or demo equivalent) */
export interface ClaimNextTaskResult {
  success: boolean;
  message: string;
  task: {
    id: string;
    identifier: string;
    title: string;
    status: TaskStatus | string;
    priority: TaskPriority | string;
    assigneeId: string;
    creatorId: string;
    createdAt: string;
  } | null;
}

export type ClaimResult = ClaimNextTaskResult;
export interface UseSelfClaimOptions { agentId: string; onSuccess?: (r: ClaimResult) => void; onError?: (e: Error) => void; }

export function useSelfClaim({ agentId, onSuccess, onError }: UseSelfClaimOptions) {
  const { isDemo, engine } = useDemo();
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const { data: count, isLoading, refetch } = useQuery({
    queryKey: ["claimableTaskCount", agentId],
    queryFn: () => {
      if (!isDemo || !engine) return 0;
      return engine.getTasks().filter((task: DemoTask) => !task.assigneeId && (task.status === "backlog" || task.status === "pending")).length;
    },
    enabled: !!agentId, refetchInterval: 5000,
  });

  const mut = useMutation({
    mutationFn: async (): Promise<ClaimResult> => {
      if (isDemo && engine) {
        // Try to claim: find first unassigned backlog task and assign it
        const tasks = engine.getTasks();
        const available = tasks.find((task: DemoTask) => !task.assigneeId && (task.status === "backlog" || task.status === "pending"));
        if (!available) return { success: false, message: "No tasks", task: null };
        await new Promise(resolve => setTimeout(resolve, 400));
        const claimed = engine.getTasks().find((task: DemoTask) => task.assigneeId === agentId && task.status === "in_progress");
        return claimed
          ? { success: true, message: `Claimed ${claimed.identifier}`, task: { id: claimed.id, identifier: claimed.identifier, title: claimed.title, status: "IN_PROGRESS", priority: claimed.priority.toUpperCase(), assigneeId: agentId, creatorId: claimed.creatorId, createdAt: claimed.createdAt } }
          : { success: false, message: "Failed", task: null };
      }
      throw new Error("API not connected");
    },
    onSuccess: (result: ClaimResult) => { qc.invalidateQueries({ queryKey: ["claimableTaskCount"] }); qc.invalidateQueries({ queryKey: ["Tasks"] }); onSuccess?.(result); },
    onError: (e: Error) => onError?.(e),
  });

  const claimNextTask = useCallback(async () => { setClaiming(true); try { return await mut.mutateAsync(); } finally { setClaiming(false); } }, [mut]);

  return { claimableCount: count ?? 0, isLoadingCount: isLoading, claimNextTask, isClaiming: claiming || mut.isPending, lastClaimResult: mut.data, claimError: mut.error, refetchCount: refetch };
}
