import { Field, ObjectType, Float, Int } from "@nestjs/graphql";
import { GraphQLJSON } from "graphql-type-json";

@ObjectType("TraceEvent")
export class TraceEventType {
  @Field()
  name!: string;

  @Field(() => Float)
  timestamp!: number;

  @Field(() => GraphQLJSON, { nullable: true })
  attributes?: Record<string, unknown>;
}

@ObjectType("Trace")
export class TraceType {
  @Field()
  traceId!: string;

  @Field()
  spanId!: string;

  @Field({ nullable: true })
  parentSpanId?: string;

  @Field()
  name!: string;

  @Field(() => Float)
  startTime!: number;

  @Field(() => Float, { nullable: true })
  endTime?: number;

  @Field(() => Float, { nullable: true })
  duration?: number;

  @Field()
  status!: string;

  @Field(() => GraphQLJSON)
  attributes!: Record<string, unknown>;

  @Field(() => [TraceEventType])
  events!: TraceEventType[];
}

@ObjectType("TelemetryMetrics")
export class TelemetryMetricsType {
  @Field(() => Int)
  totalTraces!: number;

  @Field(() => Int)
  totalSpans!: number;

  @Field(() => Float)
  averageDuration!: number;

  @Field(() => Float)
  errorRate!: number;
}
