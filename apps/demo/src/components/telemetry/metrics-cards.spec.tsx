import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricsCards } from "./metrics-cards";
import type { MetricCardData } from "./metrics-cards";

describe("MetricsCards", () => {
  const mockMetrics: MetricCardData[] = [
    { label: "Avg Latency", value: "987ms", unit: "ms", trend: "down", trendValue: "-12%" },
    { label: "Throughput", value: 3.2, unit: "tasks/min", trend: "up", trendValue: "+8%" },
    { label: "Error Rate", value: "4.8%", unit: "%", trend: "down", trendValue: "-2%" },
    { label: "Completed", value: 142, unit: "tasks", trend: "up", trendValue: "+15" },
    { label: "Credit Burn", value: 3.7, unit: "credits/min", trend: "stable" },
    { label: "Success Rate", value: "95.2%", unit: "%", trend: "up", trendValue: "+3%" },
  ];

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
    expect(screen.getByText("95.2%")).toBeInTheDocument();
  });

  it("renders empty state with no metrics", () => {
    render(<MetricsCards metrics={[]} />);
    // Should render without crashing
    expect(document.querySelector(".grid")).toBeInTheDocument();
  });

  it("renders single metric card", () => {
    const single: MetricCardData[] = [
      { label: "Test Metric", value: 42, unit: "units" },
    ];
    render(<MetricsCards metrics={single} />);
    expect(screen.getByText("Test Metric")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
