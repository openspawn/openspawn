import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDemo } from "../demo";
import type { ClaimNextTaskMutation } from "../graphql/generated/graphql";

export type ClaimResult = ClaimNextTaskMutation["claimNextTask"];
export interface UseSelfClaimOptions { agentId: string; onSuccess?: (r: ClaimResult) => void; onError?: (e: Error) => void; }

export function useSelfClaim({ agentId, onSuccess, onError }: UseSelfClaimOptions) {
  const { isDemo, engine } = useDemo();
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const { data: count, isLoading, refetch } = useQuery({
    queryKey: ["claimableTaskCount", agentId],
    queryFn: () => isDemo && engine ? engine.getTasks().filter(t => !t.assigneeId && (t.status === "backlog" || t.status === "pending")).length : 0,
    enabled: !!agentId, refetchInterval: 5000,
  });

  const mut = useMutation({
    mutationFn: async (): Promise<ClaimResult> => {
      if (isDemo && engine) {
        const r = engine.selfClaimTask(agentId);
        if (!r) return { success: false, message: "No tasks", task: null };
        await new Promise(r => setTimeout(r, 400));
        const t = engine.getTasks().find(t => t.assigneeId === agentId && t.status === "in_progress");
        return t ? { success: true, message: `Claimed ${t.identifier}`, task: { id: t.id, identifier: t.identifier, title: t.title, status: "IN_PROGRESS" as const, priority: t.priority.toUpperCase() as "HIGH", assigneeId: agentId, creatorId: t.creatorId, createdAt: t.createdAt } } : { success: false, message: "Failed", task: null };
      }
      throw new Error("API not connected");
    },
    onSuccess: r => { qc.invalidateQueries({ queryKey: ["claimableTaskCount"] }); qc.invalidateQueries({ queryKey: ["Tasks"] }); onSuccess?.(r); },
    onError: (e: Error) => onError?.(e),
  });

  const claimNextTask = useCallback(async () => { setClaiming(true); try { return await mut.mutateAsync(); } finally { setClaiming(false); } }, [mut]);

  return { claimableCount: count ?? 0, isLoadingCount: isLoading, claimNextTask, isClaiming: claiming || mut.isPending, lastClaimResult: mut.data, claimError: mut.error, refetchCount: refetch };
}
