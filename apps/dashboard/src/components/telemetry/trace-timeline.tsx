import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface TraceEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, unknown>;
}

interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: string;
  attributes: Record<string, unknown>;
  events: TraceEvent[];
}

interface TraceTimelineProps {
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export function TraceTimeline({
  startTime,
  endTime,
  limit = 100,
}: TraceTimelineProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["traces", startTime, endTime, limit],
    queryFn: async () => {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetTraces($startTime: Float, $endTime: Float, $limit: Float) {
              traces(startTime: $startTime, endTime: $endTime, limit: $limit) {
                traceId
                spanId
                parentSpanId
                name
                startTime
                endTime
                duration
                status
                attributes
                events {
                  name
                  timestamp
                  attributes
                }
              }
            }
          `,
          variables: { startTime, endTime, limit },
        }),
      });
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 5000,
  });

  const traces: Trace[] = useMemo(() => data?.traces || [], [data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading traces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">Error loading traces</div>
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">No traces found</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trace Timeline</h3>
        <div className="text-sm text-muted-foreground">
          {traces.length} trace{traces.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="space-y-2">
        {traces.map((trace, index) => (
          <motion.div
            key={trace.traceId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${getStatusColor(trace.status)}`}
                />
                <div>
                  <div className="font-medium">{trace.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {trace.traceId.slice(0, 8)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">
                  {formatDuration(trace.duration)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(trace.startTime).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {trace.events.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 space-y-1 border-t pt-2"
              >
                {trace.events.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>{event.name}</span>
                    <span className="ml-auto font-mono">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
