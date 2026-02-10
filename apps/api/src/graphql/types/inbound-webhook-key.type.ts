import { Field, ID, ObjectType, InputType, registerEnumType } from "@nestjs/graphql";
import { TaskPriority } from "@openspawn/shared-types";

registerEnumType(TaskPriority, {
  name: "TaskPriority",
  description: "Task priority level",
});

@ObjectType()
export class InboundWebhookKeyType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  key!: string;

  @Field()
  secret!: string;

  @Field(() => ID, { nullable: true })
  defaultAgentId?: string | null;

  @Field(() => TaskPriority, { nullable: true })
  defaultPriority?: TaskPriority | null;

  @Field(() => [String])
  defaultTags!: string[];

  @Field()
  enabled!: boolean;

  @Field({ nullable: true })
  lastUsedAt?: Date | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@InputType()
export class CreateInboundWebhookKeyInput {
  @Field()
  name!: string;

  @Field(() => ID, { nullable: true })
  defaultAgentId?: string;

  @Field(() => TaskPriority, { nullable: true })
  defaultPriority?: TaskPriority;

  @Field(() => [String], { nullable: true })
  defaultTags?: string[];
}

@InputType()
export class UpdateInboundWebhookKeyInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => ID, { nullable: true })
  defaultAgentId?: string;

  @Field(() => TaskPriority, { nullable: true })
  defaultPriority?: TaskPriority;

  @Field(() => [String], { nullable: true })
  defaultTags?: string[];

  @Field({ nullable: true })
  enabled?: boolean;
}
