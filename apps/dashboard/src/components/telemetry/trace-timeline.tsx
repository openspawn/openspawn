import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: "OK" | "ERROR" | "UNSET";
  attributes: Record<string, string>;
}

interface TraceTimelineProps {
  spans: TraceSpan[];
}

const statusColors: Record<string, string> = {
  OK: "bg-emerald-500",
  ERROR: "bg-red-500",
  UNSET: "bg-muted-foreground",
};

const statusGlow: Record<string, string> = {
  OK: "shadow-emerald-500/30",
  ERROR: "shadow-red-500/30",
  UNSET: "shadow-muted-foreground/20",
};

export function TraceTimeline({ spans }: TraceTimelineProps) {
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);

  if (!spans.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-48 text-muted-foreground text-sm"
      >
        No traces recorded yet
      </motion.div>
    );
  }

  const minTime = Math.min(...spans.map((s) => s.startTime));
  const maxTime = Math.max(...spans.map((s) => s.endTime));
  const totalDuration = maxTime - minTime || 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          Trace Timeline
        </h3>
        <span className="text-xs text-muted-foreground">
          {spans.length} span{spans.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative space-y-1">
        <AnimatePresence>
          {spans.map((span, i) => {
            const left =
              ((span.startTime - minTime) / totalDuration) * 100;
            const width = Math.max(
              (span.durationMs / totalDuration) * 100,
              0.5,
            );

            return (
              <motion.div
                key={span.spanId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="group relative h-8 cursor-pointer"
                onClick={() =>
                  setSelectedSpan(
                    selectedSpan?.spanId === span.spanId ? null : span,
                  )
                }
              >
                <div className="absolute inset-0 rounded bg-muted/50" />
                <motion.div
                  className={`absolute top-1 bottom-1 rounded ${statusColors[span.status]} shadow-lg ${statusGlow[span.status]}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  whileHover={{ scaleY: 1.3 }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
                <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                  <span className="text-xs text-foreground/80 truncate font-mono">
                    {span.operationName}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {span.durationMs}ms
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSpan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 rounded-lg bg-card border border-border p-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Operation</span>
                <p className="text-foreground font-mono">
                  {selectedSpan.operationName}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p
                  className={`font-semibold ${selectedSpan.status === "OK" ? "text-emerald-400" : selectedSpan.status === "ERROR" ? "text-red-400" : "text-muted-foreground"}`}
                >
                  {selectedSpan.status}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="text-foreground tabular-nums">
                  {selectedSpan.durationMs}ms
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Service</span>
                <p className="text-foreground">{selectedSpan.serviceName}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Trace ID</span>
                <p className="text-foreground font-mono text-[10px] break-all">
                  {selectedSpan.traceId}
                </p>
              </div>
              {Object.entries(selectedSpan.attributes).length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Attributes</span>
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(selectedSpan.attributes).map(
                      ([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-violet-400 font-mono">
                            {k}
                          </span>
                          <span className="text-muted-foreground">{v}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
