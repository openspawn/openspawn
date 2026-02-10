import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { GraphQLJSON } from "graphql-type-json";

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

  @Field(() => GraphQLJSON)
  attributes!: Record<string, string>;
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

  @Field(() => GraphQLJSON)
  labels!: Record<string, string>;
}
