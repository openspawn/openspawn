import { Resolver, Query, Args, Float } from "@nestjs/graphql";
import { TelemetryService } from "../../telemetry";
import { TraceType, TelemetryMetricsType } from "../types/telemetry.type";

@Resolver()
export class TelemetryResolver {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Query(() => [TraceType], {
    description: "Get traces within a time range",
  })
  async traces(
    @Args("startTime", { type: () => Float, nullable: true })
    startTime?: number,
    @Args("endTime", { type: () => Float, nullable: true })
    endTime?: number,
    @Args("limit", { type: () => Float, nullable: true, defaultValue: 100 })
    limit?: number,
  ): Promise<TraceType[]> {
    const traces = this.telemetryService.getTraces(startTime, endTime, limit);
    return traces.map((trace) => ({
      traceId: trace.traceId,
      spanId: trace.spanId,
      parentSpanId: trace.parentSpanId,
      name: trace.name,
      startTime: trace.startTime,
      endTime: trace.endTime,
      duration: trace.duration,
      status: trace.status,
      attributes: trace.attributes,
      events: trace.events.map((event) => ({
        name: event.name,
        timestamp: event.timestamp,
        attributes: event.attributes,
      })),
    }));
  }

  @Query(() => TelemetryMetricsType, {
    description: "Get telemetry metrics summary",
  })
  async telemetryMetrics(): Promise<TelemetryMetricsType> {
    return this.telemetryService.getMetrics();
  }
}
