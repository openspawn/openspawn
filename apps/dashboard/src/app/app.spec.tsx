import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./app";

// Mock recharts to avoid canvas issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe("App", () => {
  it("renders the dashboard with OpenSpawn branding", () => {
    render(<App />);
    // Multiple OpenSpawn elements exist (desktop + mobile header)
    const openSpawnElements = screen.getAllByText("OpenSpawn");
    expect(openSpawnElements.length).toBeGreaterThan(0);
  });

  it("renders navigation links", () => {
    render(<App />);
    // Navigation appears in both desktop sidebar and mobile nav
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tasks").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agents").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Credits").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Events").length).toBeGreaterThan(0);
  });

  it("renders dashboard stats cards", () => {
    render(<App />);
    expect(screen.getByText("Active Agents")).toBeInTheDocument();
    expect(screen.getByText("Tasks In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed This Week")).toBeInTheDocument();
    expect(screen.getByText("Credits Earned")).toBeInTheDocument();
  });
});
