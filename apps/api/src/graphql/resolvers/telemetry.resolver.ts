import { Args, Int, Query, Resolver } from "@nestjs/graphql";

import { TelemetryService } from "../../telemetry";
import { TraceSpanType, MetricPointType } from "../types/telemetry.type";

@Resolver()
export class TelemetryResolver {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Query(() => [TraceSpanType], { description: "Fetch recent trace spans" })
  async traces(
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
  ): Promise<TraceSpanType[]> {
    return this.telemetryService.getTraces(limit);
  }

  @Query(() => [MetricPointType], { description: "Fetch recent metrics" })
  async metrics(
    @Args("limit", { type: () => Int, defaultValue: 100 }) limit: number,
  ): Promise<MetricPointType[]> {
    return this.telemetryService.getMetrics(limit);
  }

  @Query(() => [TraceSpanType], {
    description: "Fetch traces filtered by operation name",
  })
  async tracesByOperation(
    @Args("operationName") operationName: string,
  ): Promise<TraceSpanType[]> {
    return this.telemetryService.getTracesByOperation(operationName);
  }

  @Query(() => [MetricPointType], {
    description: "Fetch metrics filtered by metric name",
  })
  async metricsByName(
    @Args("name") name: string,
  ): Promise<MetricPointType[]> {
    return this.telemetryService.getMetricsByName(name);
  }

  @Query(() => Boolean, { description: "Check if telemetry is enabled" })
  async telemetryEnabled(): Promise<boolean> {
    return this.telemetryService.isEnabled;
  }
}
