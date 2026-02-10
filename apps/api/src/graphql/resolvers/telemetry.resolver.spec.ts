import { Test, TestingModule } from "@nestjs/testing";
import { TelemetryResolver } from "./telemetry.resolver";
import { TelemetryService } from "../../telemetry";

describe("TelemetryResolver", () => {
  let resolver: TelemetryResolver;
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryResolver, TelemetryService],
    }).compile();

    resolver = module.get<TelemetryResolver>(TelemetryResolver);
    service = module.get<TelemetryService>(TelemetryService);
  });

  afterEach(() => {
    service.clearAll();
  });

  it("should return traces", async () => {
    service.recordTaskLifecycle("t1", "created");
    const traces = await resolver.traces(50);
    expect(traces).toHaveLength(1);
    expect(traces[0].operationName).toBe("task.created");
  });

  it("should return metrics", async () => {
    service.recordLatency("GET /test", 100);
    const metrics = await resolver.metrics(100);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(100);
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
