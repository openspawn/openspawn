// Browser API mocks (side-effect: auto-runs on import)
export { setupBrowserMocks } from "./setup";

// Mock factories
export { rechartsMock } from "./mocks/recharts";
export { graphqlHooksMock } from "./mocks/graphql-hooks";

// Render helpers
export { renderWithProviders, TestProviders } from "./render";

// Fixtures
export { createMockAgent, mockAgents } from "./fixtures/agents";
export type { MockAgent } from "./fixtures/agents";
export { mockMetrics } from "./fixtures/metrics";
export type { MetricCardData } from "./fixtures/metrics";
