import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock recharts to avoid canvas issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: ReactNode }) => <>{children}</>,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// Mock TanStack Query hooks
vi.mock("../graphql/generated/hooks", () => ({
  useAgentsQuery: () => ({ data: { agents: [] }, isLoading: false, error: null }),
  useTasksQuery: () => ({ data: { tasks: [] }, isLoading: false, error: null }),
  useCreditHistoryQuery: () => ({
    data: { creditHistory: [] },
    isLoading: false,
    error: null,
  }),
  useEventsQuery: () => ({ data: { events: [] }, isLoading: false, error: null }),
}));

/**
 * Light smoke tests for the App module.
 *
 * Full integration tests with Layout + Router require extensive provider
 * nesting (Auth, SidePanel, Onboarding, Demo, SSE, etc.) — those are
 * better covered by Playwright E2E tests. These unit tests verify that
 * the App module exports correctly and key components render in isolation.
 */
describe("App", () => {
  it("exports App as default", async () => {
    const mod = await import("./app");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("App component is named App", async () => {
    const mod = await import("./app");
    expect(mod.App).toBeDefined();
    expect(mod.App.name).toBe("App");
  });

  it("router is configured with /app basepath", async () => {
    const { router } = await import("../routes");
    expect(router.basepath).toBe("/app");
  });
});

/**
 * Test that key page components render without crashing when given a
 * QueryClientProvider (they use TanStack Query hooks).
 */
describe("Pages (isolated)", () => {
  function withQuery(ui: ReactNode) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  it("IntroPage renders pineapple and CTA", async () => {
    const { IntroPage } = await import("../pages/intro");
    withQuery(<IntroPage />);
    expect(screen.getByText("🍍")).toBeInTheDocument();
    expect(screen.getByText(/dive in/i)).toBeInTheDocument();
  });
});
