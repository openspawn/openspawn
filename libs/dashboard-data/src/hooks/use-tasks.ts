import { isDemoMode, isSandboxMode } from "../lib/mode";
import { useTasksQuery, type TaskStatus, type TasksQuery } from "../graphql/generated/hooks";
import { useTasks as useRestTasks } from "../rest/hooks/use-tasks";
import { DEFAULT_ORG_ID } from "../lib/constants";

/** Task as returned by the Tasks list query (subset of full TaskType) */
export type Task = TasksQuery["tasks"][number];

const isLiveMode = !isDemoMode && !isSandboxMode;

export function useTasks(orgId: string = DEFAULT_ORG_ID, status?: TaskStatus) {
  const rest = useRestTasks({ enabled: isLiveMode });
  const gql = useTasksQuery({ orgId, status }, { enabled: !isLiveMode });

  if (!isLiveMode) {
    return {
      tasks: gql.data?.tasks ?? [],
      loading: gql.isLoading,
      error: gql.error ?? null,
      refetch: gql.refetch,
    };
  }

  return {
    tasks: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
