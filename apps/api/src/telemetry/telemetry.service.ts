import { Injectable, Logger } from "@nestjs/common";
import {
  trace,
  context,
  Span,
  SpanStatusCode,
  SpanKind,
  Context,
} from "@opentelemetry/api";
import { getTelemetryConfig } from "./telemetry.config";

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

export interface TraceData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "ok" | "error" | "unset";
  attributes: Record<string, unknown>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
  }>;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly tracer = trace.getTracer("openspawn-api");
  private readonly config = getTelemetryConfig();
  private readonly traces: Map<string, TraceData[]> = new Map();

  /**
   * Start a new span for task lifecycle tracking
   */
  startTaskSpan(
    taskId: string,
    operation: string,
    attributes?: SpanAttributes,
  ): Span {
    if (!this.config.enabled) {
      return trace.getSpan(context.active()) || this.tracer.startSpan("noop");
    }

    const span = this.tracer.startSpan(
      `task.${operation}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          "task.id": taskId,
          "task.operation": operation,
          "service.name": this.config.serviceName,
          ...attributes,
        },
      },
      context.active(),
    );

    this.logger.debug(
      `Started span for task ${taskId}: ${operation}`,
    );

    return span;
  }

  /**
   * Start a generic span with custom name
   */
  startSpan(name: string, attributes?: SpanAttributes): Span {
    if (!this.config.enabled) {
      return trace.getSpan(context.active()) || this.tracer.startSpan("noop");
    }

    return this.tracer.startSpan(
      name,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          "service.name": this.config.serviceName,
          ...attributes,
        },
      },
      context.active(),
    );
  }

  /**
   * Execute function within a span context
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: SpanAttributes,
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    const ctx = trace.setSpan(context.active(), span);

    try {
      const result = await context.with(ctx, async () => fn(span));
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * End a span and record its completion
   */
  endSpan(span: Span, success: boolean = true): void {
    if (!this.config.enabled) return;

    span.setStatus({
      code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR,
    });
    span.end();

    this.logger.debug(`Ended span: ${success ? "success" : "error"}`);
  }

  /**
   * Add an event to a span
   */
  addSpanEvent(
    span: Span,
    name: string,
    attributes?: SpanAttributes,
  ): void {
    if (!this.config.enabled) return;

    span.addEvent(name, attributes);
    this.logger.debug(`Added event to span: ${name}`);
  }

  /**
   * Get current active span
   */
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  /**
   * Get current context
   */
  getCurrentContext(): Context {
    return context.active();
  }

  /**
   * Store trace data for querying (in-memory for demo)
   */
  recordTraceData(data: TraceData): void {
    const key = data.traceId;
    if (!this.traces.has(key)) {
      this.traces.set(key, []);
    }
    this.traces.get(key)?.push(data);
  }

  /**
   * Query traces by time range
   */
  getTraces(startTime?: number, endTime?: number, limit = 100): TraceData[] {
    const allTraces: TraceData[] = [];
    
    for (const spans of this.traces.values()) {
      allTraces.push(...spans);
    }

    let filtered = allTraces;
    
    if (startTime !== undefined) {
      filtered = filtered.filter((t) => t.startTime >= startTime);
    }
    
    if (endTime !== undefined) {
      filtered = filtered.filter((t) => t.startTime <= endTime);
    }

    return filtered
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Get metrics summary
   */
  getMetrics(): {
    totalTraces: number;
    totalSpans: number;
    averageDuration: number;
    errorRate: number;
  } {
    let totalSpans = 0;
    let totalDuration = 0;
    let errorCount = 0;

    for (const spans of this.traces.values()) {
      for (const span of spans) {
        totalSpans++;
        if (span.duration) {
          totalDuration += span.duration;
        }
        if (span.status === "error") {
          errorCount++;
        }
      }
    }

    return {
      totalTraces: this.traces.size,
      totalSpans,
      averageDuration: totalSpans > 0 ? totalDuration / totalSpans : 0,
      errorRate: totalSpans > 0 ? errorCount / totalSpans : 0,
    };
  }

  /**
   * Clear trace data (for testing)
   */
  clearTraces(): void {
    this.traces.clear();
  }
}
