/**
 * Hook to fetch real-time metrics from the sandbox API.
 * Returns time-series data for sparklines and charts.
 */
import { useQuery } from '@tanstack/react-query';
import { isSandboxMode } from '../graphql/fetcher';

import { SANDBOX_URL } from '../lib/sandbox-url';

export interface MetricsSnapshot {
  tick: number;
  timestamp: number;
  activeAgents: number;
  totalTasks: number;
  tasksDone: number;
  tasksInProgress: number;
  tasksInReview: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  messageCount: number;
}

async function fetchMetrics(): Promise<MetricsSnapshot[]> {
  const res = await fetch(`${SANDBOX_URL}/api/metrics`);
  if (!res.ok) return [];
  return res.json();
}

export function useSandboxMetrics() {
  return useQuery({
    queryKey: ['sandbox-metrics'],
    queryFn: fetchMetrics,
    enabled: isSandboxMode,
    refetchInterval: 3000,
  });
}

/** Extract sparkline arrays from metrics history */
export function useSparklines() {
  const { data: metrics } = useSandboxMetrics();

  if (!isSandboxMode || !metrics || metrics.length < 2) {
    return null; // Fall back to generated data
  }

  // Take last 12 data points for sparklines
  const recent = metrics.slice(-12);

  return {
    agents: recent.map(m => m.activeAgents),
    tasks: recent.map(m => m.totalTasks),
    completed: recent.map(m => m.tasksDone),
    credits: recent.map(m => m.totalCreditsEarned - m.totalCreditsSpent),
  };
}
