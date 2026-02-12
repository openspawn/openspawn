import { useTasksQuery, type TaskStatus, type TasksQuery } from "../graphql/generated/hooks";
import { DEFAULT_ORG_ID } from "../lib/constants";

/** Task as returned by the Tasks list query (subset of full TaskType) */
export type Task = TasksQuery['tasks'][number];

export function useTasks(orgId: string = DEFAULT_ORG_ID, status?: TaskStatus) {
  const { data, isLoading, error, refetch } = useTasksQuery({ orgId, status });

  return {
    tasks: data?.tasks ?? [],
    loading: isLoading,
    error: error ?? null,
    refetch,
  };
}
