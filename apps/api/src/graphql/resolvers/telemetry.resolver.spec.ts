import { TelemetryResolver } from "./telemetry.resolver";
import { TelemetryService } from "../../telemetry";

describe("TelemetryResolver", () => {
  let resolver: TelemetryResolver;
  let service: TelemetryService;

  beforeEach(() => {
    service = new TelemetryService();
    resolver = new TelemetryResolver(service);
  });

  afterEach(() => {
    service.clearAll();
  });

  it("should return traces with JSON-encoded attributes", async () => {
    service.recordTaskLifecycle("t1", "created");
    const traces = await resolver.traces(50);
    expect(traces).toHaveLength(1);
    expect(traces[0].operationName).toBe("task.created");
    expect(typeof traces[0].attributes).toBe("string");
    expect(JSON.parse(traces[0].attributes)).toHaveProperty("task.id", "t1");
  });

  it("should return metrics with JSON-encoded labels", async () => {
    service.recordLatency("GET /test", 100);
    const metrics = await resolver.metrics(100);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(100);
    expect(typeof metrics[0].labels).toBe("string");
  });

  it("should filter traces by operation", async () => {
    service.recordTaskLifecycle("t1", "created");
    service.recordAgentActivity("a1", "heartbeat");
    const traces = await resolver.tracesByOperation("task.created");
    expect(traces).toHaveLength(1);
  });

  it("should filter metrics by name", async () => {
    service.recordLatency("op1", 50);
    service.recordThroughput("op1");
    const metrics = await resolver.metricsByName("http.request.duration");
    expect(metrics).toHaveLength(1);
  });

  it("should report telemetry enabled status", async () => {
    const enabled = await resolver.telemetryEnabled();
    expect(typeof enabled).toBe("boolean");
  });
});
