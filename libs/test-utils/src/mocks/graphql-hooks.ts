/**
 * Mock implementations for GraphQL hooks.
 * Usage:
 *   import { graphqlHooksMock } from "@openspawn/test-utils";
 *   vi.mock("../graphql/generated/hooks", () => graphqlHooksMock);
 */
export const graphqlHooksMock = {
  useAgentsQuery: () => ({
    data: { agents: [] },
    isLoading: false,
    error: null,
  }),
  useTasksQuery: () => ({
    data: { tasks: [] },
    isLoading: false,
    error: null,
  }),
  useCreditHistoryQuery: () => ({
    data: { creditHistory: [] },
    isLoading: false,
    error: null,
  }),
  useEventsQuery: () => ({
    data: { events: [] },
    isLoading: false,
    error: null,
  }),
};
