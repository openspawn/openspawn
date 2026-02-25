import { Field, InputType, Int } from "@nestjs/graphql";
import { WebhookHookType } from "./webhook.type";

@InputType()
export class CreateWebhookInput {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  secret?: string;

  @Field(() => [String])
  events!: string[];

  @Field(() => WebhookHookType, { nullable: true })
  hookType?: WebhookHookType;

  @Field(() => Boolean, { nullable: true })
  canBlock?: boolean;

  @Field(() => Int, { nullable: true })
  timeoutMs?: number;
}

@InputType()
export class UpdateWebhookInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  url?: string;

  @Field(() => String, { nullable: true })
  secret?: string;

  @Field(() => [String], { nullable: true })
  events?: string[];

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;

  @Field(() => WebhookHookType, { nullable: true })
  hookType?: WebhookHookType;

  @Field(() => Boolean, { nullable: true })
  canBlock?: boolean;

  @Field(() => Int, { nullable: true })
  timeoutMs?: number;
}
