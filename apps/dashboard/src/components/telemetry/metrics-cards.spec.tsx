import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricsCards } from "./metrics-cards";

describe("MetricsCards", () => {
  const mockMetrics = {
    avgTaskLatency: 987.4,
    taskThroughput: 3.2,
    errorRate: 4.8,
    totalTasksCreated: 156,
    totalTasksCompleted: 142,
    totalTasksFailed: 8,
    avgCreditBurnRate: 3.7,
  };

  it("renders all metric cards", () => {
    render(<MetricsCards metrics={mockMetrics} />);

    expect(screen.getByText("Avg Latency")).toBeInTheDocument();
    expect(screen.getByText("Throughput")).toBeInTheDocument();
    expect(screen.getByText("Error Rate")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Credit Burn")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
  });

  it("displays correct metric values", () => {
    render(<MetricsCards metrics={mockMetrics} />);

    expect(screen.getByText("987ms")).toBeInTheDocument();
    expect(screen.getByText("3.2")).toBeInTheDocument();
    expect(screen.getByText("4.8%")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("3.7")).toBeInTheDocument();
  });

  it("calculates success rate correctly", () => {
    render(<MetricsCards metrics={mockMetrics} />);

    // Success rate = 100 - error rate = 95.2%
    expect(screen.getByText("95.2%")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    render(<MetricsCards metrics={mockMetrics} loading={true} />);

    // Should show 6 loading cards
    const loadingCards = screen.getAllByRole("generic", {
      hidden: true,
    }).filter((el) => el.classList.contains("animate-pulse"));

    expect(loadingCards.length).toBeGreaterThan(0);
  });

  it("displays subtitles for each metric", () => {
    render(<MetricsCards metrics={mockMetrics} />);

    expect(screen.getByText("Task completion time")).toBeInTheDocument();
    expect(screen.getByText("Tasks per minute")).toBeInTheDocument();
    expect(screen.getByText("Failed tasks")).toBeInTheDocument();
    expect(screen.getByText("Total tasks completed")).toBeInTheDocument();
    expect(screen.getByText("Credits per minute")).toBeInTheDocument();
    expect(screen.getByText("Task completion rate")).toBeInTheDocument();
  });

  it("handles zero values", () => {
    const zeroMetrics = {
      avgTaskLatency: 0,
      taskThroughput: 0,
      errorRate: 0,
      totalTasksCreated: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      avgCreditBurnRate: 0,
    };

    render(<MetricsCards metrics={zeroMetrics} />);

    expect(screen.getByText("0ms")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("handles high error rate", () => {
    const highErrorMetrics = {
      ...mockMetrics,
      errorRate: 25.5,
    };

    render(<MetricsCards metrics={highErrorMetrics} />);

    expect(screen.getByText("25.5%")).toBeInTheDocument();
    expect(screen.getByText("74.5%")).toBeInTheDocument(); // Success rate
  });

  it("handles large latency values", () => {
    const highLatencyMetrics = {
      ...mockMetrics,
      avgTaskLatency: 5432.1,
    };

    render(<MetricsCards metrics={highLatencyMetrics} />);

    expect(screen.getByText("5432ms")).toBeInTheDocument();
  });
});
