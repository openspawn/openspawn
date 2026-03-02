import type { ReactNode } from "react";

/**
 * Recharts mock components for use with vi.mock("recharts", ...).
 * Usage:
 *   import { rechartsMock } from "@openspawn/test-utils";
 *   vi.mock("recharts", () => rechartsMock);
 */
export const rechartsMock = {
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
};
