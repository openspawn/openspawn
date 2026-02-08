import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDemo } from "../demo";

/**
 * Hook to enable real-time updates for queries
 * 
 * In demo mode: Listens to simulation engine events
 * In prod mode: Sets up polling (WebSocket support coming later)
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const demo = useDemo();
  const isDemo = demo.isDemo;

  // Invalidate queries when simulation events occur
  const handleDemoEvent = useCallback(
    (event: { type: string; payload: unknown }) => {
      // Invalidate relevant queries based on event type
      if (event.type.startsWith("agent")) {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
      }
      if (event.type.startsWith("task")) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
      if (event.type.startsWith("credit")) {
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        queryClient.invalidateQueries({ queryKey: ["agents"] }); // Balance updates
      }
      if (event.type.startsWith("event") || event.type === "system.started") {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!isDemo) {
      // In production mode, set up polling for real-time updates
      // Polling interval: 30 seconds
      const interval = setInterval(() => {
        queryClient.invalidateQueries();
      }, 30000);

      return () => clearInterval(interval);
    }

    // In demo mode, listen to simulation events
    // The demo provider handles this via its own state updates
    // We just need to ensure queries refetch when state changes
  }, [isDemo, queryClient]);

  // Subscribe to demo events for more granular updates
  useEffect(() => {
    if (!isDemo || !demo.recentEvents) return;

    // When recentEvents changes, invalidate relevant queries
    const latestEvent = demo.recentEvents[0];
    if (latestEvent) {
      handleDemoEvent(latestEvent);
    }
  }, [isDemo, demo.recentEvents, handleDemoEvent]);
}

/**
 * Hook to set up auto-refresh for a specific query
 */
export function useAutoRefresh(queryKey: string[], intervalMs = 10000) {
  const queryClient = useQueryClient();
  const demo = useDemo();

  useEffect(() => {
    // In demo mode, simulation handles updates
    if (demo.isDemo) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [queryClient, queryKey, intervalMs, demo.isDemo]);
}

/**
 * Hook that returns whether real-time updates are active
 */
export function useIsRealtime(): boolean {
  const demo = useDemo();
  // In demo mode, real-time = simulation is playing
  // In prod mode, real-time = always true (via polling)
  return demo.isDemo ? demo.isPlaying : true;
}
