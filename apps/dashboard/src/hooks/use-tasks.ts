import { useQuery, useSubscription } from "urql";

import { TASKS_QUERY } from "../graphql/queries";
import { TASK_UPDATED_SUBSCRIPTION } from "../graphql/subscriptions";

export interface Task {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  creatorId: string;
  approvalRequired: boolean;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export function useTasks(orgId: string, status?: string) {
  const [result, reexecute] = useQuery<{ tasks: Task[] }>({
    query: TASKS_QUERY,
    variables: { orgId, status },
  });

  // Subscribe to updates
  useSubscription<{ taskUpdated: Task }>(
    { query: TASK_UPDATED_SUBSCRIPTION, variables: { orgId } },
    (_prev, data) => {
      // Trigger refetch on update
      reexecute({ requestPolicy: "network-only" });
      return data;
    },
  );

  return {
    tasks: result.data?.tasks || [],
    loading: result.fetching,
    error: result.error,
    refetch: () => reexecute({ requestPolicy: "network-only" }),
  };
}
