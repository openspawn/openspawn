import { useTasks as useRestTasks } from "../rest/hooks/use-tasks";

export type TaskRejection = {
  feedback: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionCount: number;
};

export type Task = {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; level: number } | null;
  creatorId?: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  completedAt?: string | null;
  source?: string | null;
  approvalRequired?: boolean;
  rejection?: TaskRejection | null;
};

export function useTasks() {
  const rest = useRestTasks();

  return {
    tasks: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
