export interface MetricCardData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}

/**
 * Shared mock metrics data for telemetry/dashboard tests.
 */
export const mockMetrics: MetricCardData[] = [
  { label: "Avg Latency", value: "987ms", unit: "ms", trend: "down", trendValue: "-12%" },
  { label: "Throughput", value: 3.2, unit: "tasks/min", trend: "up", trendValue: "+8%" },
  { label: "Error Rate", value: "4.8%", unit: "%", trend: "down", trendValue: "-2%" },
  { label: "Completed", value: 142, unit: "tasks", trend: "up", trendValue: "+15" },
  { label: "Credit Burn", value: 3.7, unit: "credits/min", trend: "stable" },
  { label: "Success Rate", value: "95.2%", unit: "%", trend: "up", trendValue: "+3%" },
];
