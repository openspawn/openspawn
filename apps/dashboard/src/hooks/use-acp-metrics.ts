/**
 * Hook to fetch ACP-specific metrics from the sandbox API.
 * Polls /api/metrics/acp every 3s when in sandbox mode.
 */
import { useQuery } from '@tanstack/react-query';
import { isSandboxMode } from '../graphql/fetcher';
import { SANDBOX_URL } from '../lib/sandbox-url';

export interface ACPMetrics {
  ackLatencyMs: number;
  escalationRate: number;
  avgDelegationDepth: number;
  completionRate: number;
  totalAcks: number;
  totalEscalations: number;
  totalCompletions: number;
  totalDelegations: number;
  escalationsByReason: Record<string, number>;
}

async function fetchACPMetrics(): Promise<ACPMetrics> {
  const res = await fetch(`${SANDBOX_URL}/api/metrics/acp`);
  if (!res.ok) throw new Error('Failed to fetch ACP metrics');
  return res.json();
}

export function useACPMetrics() {
  return useQuery({
    queryKey: ['acp-metrics'],
    queryFn: fetchACPMetrics,
    enabled: isSandboxMode,
    refetchInterval: 3000,
  });
}
