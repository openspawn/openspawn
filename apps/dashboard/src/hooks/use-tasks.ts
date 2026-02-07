import { useTasksQuery, type TaskStatus } from "../graphql/generated/hooks";
import { DEFAULT_ORG_ID } from "../lib/constants";

export type { TaskType as Task } from "../graphql/generated/hooks";

export function useTasks(orgId: string = DEFAULT_ORG_ID, status?: TaskStatus) {
  const { data, isLoading, error, refetch } = useTasksQuery({ orgId, status });

  return {
    tasks: data?.tasks ?? [],
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
