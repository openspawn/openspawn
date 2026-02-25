import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

export enum WebhookHookType {
  PRE = "pre",
  POST = "post",
}

registerEnumType(WebhookHookType, { name: "WebhookHookType" });

@ObjectType()
export class WebhookType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orgId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  secret?: string | null;

  @Field(() => [String])
  events!: string[];

  @Field(() => Boolean)
  enabled!: boolean;

  @Field(() => WebhookHookType)
  hookType!: WebhookHookType;

  @Field(() => Boolean)
  canBlock!: boolean;

  @Field(() => Number)
  timeoutMs!: number;

  @Field(() => Number)
  failureCount!: number;

  @Field(() => Date, { nullable: true })
  lastTriggeredAt?: Date | null;

  @Field(() => String, { nullable: true })
  lastError?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
