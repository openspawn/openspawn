import { Injectable, Logger } from "@nestjs/common";
import { loadTelemetryConfig, TelemetryConfig } from "./telemetry.config";

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

export interface MetricPoint {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: Record<string, string>;
}

type TaskLifecyclePhase =
  | "created"
  | "assigned"
  | "in_progress"
  | "completed"
  | "failed";

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly config: TelemetryConfig;
  private readonly spans: TraceSpan[] = [];
  private readonly metrics: MetricPoint[] = [];
  private spanCounter = 0;

  constructor() {
    this.config = loadTelemetryConfig();
    this.logger.log(
      `Telemetry initialized: service=${this.config.serviceName}, endpoint=${this.config.otlpEndpoint}, enabled=${this.config.enabled}`,
    );
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): TelemetryConfig {
    return { ...this.config };
  }

  private generateId(): string {
    this.spanCounter++;
    return `${Date.now().toString(16)}${this.spanCounter.toString(16).padStart(8, "0")}`;
  }

  startSpan(
    operationName: string,
    attributes: Record<string, string> = {},
    parentSpanId?: string,
  ): TraceSpan {
    const span: TraceSpan = {
      traceId: this.generateId(),
      spanId: this.generateId(),
      parentSpanId,
      operationName,
      serviceName: this.config.serviceName,
      startTime: Date.now(),
      endTime: 0,
      durationMs: 0,
      status: "UNSET",
      attributes,
    };
    return span;
  }

  endSpan(span: TraceSpan, status: "OK" | "ERROR" = "OK"): TraceSpan {
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    this.spans.push(span);
    return span;
  }

  recordTaskLifecycle(
    taskId: string,
    phase: TaskLifecyclePhase,
    agentId?: string,
  ): TraceSpan {
    const span = this.startSpan(`task.${phase}`, {
      "task.id": taskId,
      "task.phase": phase,
      ...(agentId ? { "agent.id": agentId } : {}),
    });
    return this.endSpan(span, phase === "failed" ? "ERROR" : "OK");
  }

  recordAgentActivity(
    agentId: string,
    action: string,
    metadata: Record<string, string> = {},
  ): TraceSpan {
    const span = this.startSpan(`agent.${action}`, {
      "agent.id": agentId,
      "agent.action": action,
      ...metadata,
    });
    return this.endSpan(span);
  }

  recordMetric(
    name: string,
    value: number,
    unit: string,
    labels: Record<string, string> = {},
  ): MetricPoint {
    const point: MetricPoint = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      labels,
    };
    this.metrics.push(point);
    return point;
  }

  recordLatency(operationName: string, durationMs: number): MetricPoint {
    return this.recordMetric("http.request.duration", durationMs, "ms", {
      operation: operationName,
    });
  }

  recordThroughput(operationName: string): MetricPoint {
    return this.recordMetric("http.request.count", 1, "count", {
      operation: operationName,
    });
  }

  recordError(operationName: string, errorType: string): MetricPoint {
    return this.recordMetric("http.request.error", 1, "count", {
      operation: operationName,
      error_type: errorType,
    });
  }

  getTraces(limit = 50): TraceSpan[] {
    return this.spans.slice(-limit);
  }

  getMetrics(limit = 100): MetricPoint[] {
    return this.metrics.slice(-limit);
  }

  getTracesByOperation(operationName: string): TraceSpan[] {
    return this.spans.filter((s) => s.operationName === operationName);
  }

  getMetricsByName(name: string): MetricPoint[] {
    return this.metrics.filter((m) => m.name === name);
  }

  clearAll(): void {
    this.spans.length = 0;
    this.metrics.length = 0;
  }
}
