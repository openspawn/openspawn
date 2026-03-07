import { Field, Float, ObjectType } from "@nestjs/graphql";

@ObjectType({ description: "A single trace span from OpenTelemetry" })
export class TraceSpanType {
  @Field(() => String)
  traceId!: string;

  @Field(() => String)
  spanId!: string;

  @Field(() => String, { nullable: true })
  parentSpanId?: string;

  @Field(() => String)
  operationName!: string;

  @Field(() => String)
  serviceName!: string;

  @Field(() => Float)
  startTime!: number;

  @Field(() => Float)
  endTime!: number;

  @Field(() => Float)
  durationMs!: number;

  @Field(() => String)
  status!: string;

  @Field(() => String, { description: "JSON-encoded attributes" })
  attributes!: string;
}

@ObjectType({ description: "A metric data point" })
export class MetricPointType {
  @Field(() => String)
  name!: string;

  @Field(() => Float)
  value!: number;

  @Field(() => String)
  unit!: string;

  @Field(() => Float)
  timestamp!: number;

  @Field(() => String, { description: "JSON-encoded labels" })
  labels!: string;
}
