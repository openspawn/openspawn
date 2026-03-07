import { TelemetryService } from "./telemetry.service";

describe("TelemetryService", () => {
  let service: TelemetryService;

  beforeEach(() => {
    process.env["OTEL_ENABLED"] = "true";
    process.env["OTEL_SERVICE_NAME"] = "test-service";
    service = new TelemetryService();
  });

  afterEach(() => {
    service.clearAll();
  });

  it("should be enabled by default", () => {
    expect(service.isEnabled).toBe(true);
  });

  it("should return config with correct service name", () => {
    const config = service.getConfig();
    expect(config.serviceName).toBe("test-service");
  });

  it("should start and end a span", () => {
    const span = service.startSpan("test.operation", { key: "value" });
    expect(span.operationName).toBe("test.operation");
    expect(span.status).toBe("UNSET");

    const ended = service.endSpan(span);
    expect(ended.status).toBe("OK");
    expect(ended.durationMs).toBeGreaterThanOrEqual(0);
    expect(ended.endTime).toBeGreaterThanOrEqual(ended.startTime);
  });

  it("should end a span with ERROR status", () => {
    const span = service.startSpan("failing.op");
    const ended = service.endSpan(span, "ERROR");
    expect(ended.status).toBe("ERROR");
  });

  it("should record task lifecycle phases", () => {
    const span = service.recordTaskLifecycle("task-1", "created");
    expect(span.operationName).toBe("task.created");
    expect(span.attributes["task.id"]).toBe("task-1");
    expect(span.status).toBe("OK");
  });

  it("should record failed task lifecycle with ERROR status", () => {
    const span = service.recordTaskLifecycle("task-2", "failed", "agent-1");
    expect(span.status).toBe("ERROR");
    expect(span.attributes["agent.id"]).toBe("agent-1");
  });

  it("should record agent activity", () => {
    const span = service.recordAgentActivity("agent-1", "heartbeat", {
      extra: "data",
    });
    expect(span.operationName).toBe("agent.heartbeat");
    expect(span.attributes["agent.id"]).toBe("agent-1");
    expect(span.attributes["extra"]).toBe("data");
  });

  it("should record and retrieve metrics", () => {
    service.recordMetric("test.metric", 42, "count", { env: "test" });
    const metrics = service.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe("test.metric");
    expect(metrics[0].value).toBe(42);
  });

  it("should record latency metrics", () => {
    service.recordLatency("GET /api/test", 150);
    const metrics = service.getMetricsByName("http.request.duration");
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(150);
    expect(metrics[0].labels["operation"]).toBe("GET /api/test");
  });

  it("should record throughput and error metrics", () => {
    service.recordThroughput("POST /api/tasks");
    service.recordError("POST /api/tasks", "HTTP_500");

    const throughput = service.getMetricsByName("http.request.count");
    expect(throughput).toHaveLength(1);

    const errors = service.getMetricsByName("http.request.error");
    expect(errors).toHaveLength(1);
    expect(errors[0].labels["error_type"]).toBe("HTTP_500");
  });

  it("should retrieve traces by operation name", () => {
    service.recordTaskLifecycle("t1", "created");
    service.recordTaskLifecycle("t2", "assigned");
    service.recordAgentActivity("a1", "heartbeat");

    const taskTraces = service.getTracesByOperation("task.created");
    expect(taskTraces).toHaveLength(1);
    expect(taskTraces[0].attributes["task.id"]).toBe("t1");
  });

  it("should clear all spans and metrics", () => {
    service.recordTaskLifecycle("t1", "created");
    service.recordMetric("m1", 1, "count");
    service.clearAll();
    expect(service.getTraces()).toHaveLength(0);
    expect(service.getMetrics()).toHaveLength(0);
  });

  it("should respect limit parameter on getTraces", () => {
    for (let i = 0; i < 10; i++) {
      service.recordTaskLifecycle(`t${i}`, "created");
    }
    expect(service.getTraces(3)).toHaveLength(3);
  });
});
