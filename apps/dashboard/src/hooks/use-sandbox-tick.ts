/**
 * SSE-driven query invalidation.
 *
 * Instead of polling every 3s, we listen for `tick_complete` events from the
 * sandbox SSE stream and invalidate TanStack Query caches only when data
 * actually changes. This reduces network traffic from ~12 KB/s to near-zero
 * between ticks.
 *
 * Mount this ONCE near the app root (e.g. in App or Layout).
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSandboxSSE, type SandboxSSEEvent } from './use-sandbox-sse';

/**
 * Query keys to invalidate when a tick completes.
 * These match the keys used by useAgentsQuery, useTasksQuery, etc.
 */
const TICK_INVALIDATION_KEYS = [
  ['agents'],
  ['tasks'],
  ['creditHistory'],
  ['sandbox-metrics'],
  ['acp-metrics'],
  ['messages'],
  ['threads'],
  ['unread'],
  ['conversations'],
  ['conversationMessages'],
  ['scenario-status'],
  ['claimableTaskCount'],
  ['router-metrics'],
  ['router-decisions'],
  ['router-decisions-full'],
  ['router-config'],
] as const;

export function useSandboxTickInvalidation() {
  const queryClient = useQueryClient();

  useSandboxSSE(
    useCallback(
      (event: SandboxSSEEvent) => {
        if (event.type === 'tick_complete') {
          // Invalidate all data queries — TanStack Query will refetch
          // only the ones that are currently observed (mounted).
          for (const key of TICK_INVALIDATION_KEYS) {
            queryClient.invalidateQueries({ queryKey: [...key] });
          }
        }
      },
      [queryClient],
    ),
  );
}
