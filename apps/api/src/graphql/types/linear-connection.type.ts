import { Field, ID, ObjectType, InputType } from "@nestjs/graphql";

@ObjectType()
export class LinearSyncConfigInboundType {
  @Field(() => Boolean)
  createTaskOnIssue!: boolean;

  @Field(() => Boolean)
  createTaskOnComment!: boolean;

  @Field(() => Boolean)
  syncStatusChanges!: boolean;

  @Field(() => String, { nullable: true })
  requiredLabel?: string;
}

@ObjectType()
export class LinearSyncConfigOutboundType {
  @Field(() => Boolean)
  closeIssueOnComplete!: boolean;

  @Field(() => Boolean)
  commentOnStatusChange!: boolean;

  @Field(() => Boolean)
  updateLabels!: boolean;

  @Field(() => Boolean)
  syncAssignee!: boolean;
}

@ObjectType()
export class LinearSyncConfigType {
  @Field(() => LinearSyncConfigInboundType)
  inbound!: LinearSyncConfigInboundType;

  @Field(() => LinearSyncConfigOutboundType)
  outbound!: LinearSyncConfigOutboundType;
}

@ObjectType()
export class LinearConnectionType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orgId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  teamId!: string;

  @Field(() => String)
  webhookSecret!: string;

  @Field(() => [String])
  teamFilter!: string[];

  @Field(() => LinearSyncConfigType)
  syncConfig!: LinearSyncConfigType;

  @Field(() => Boolean)
  enabled!: boolean;

  @Field(() => Date, { nullable: true })
  lastSyncAt?: Date | null;

  @Field(() => String, { nullable: true })
  lastError?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateLinearConnectionInput {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  teamId!: string;

  @Field(() => String, { nullable: true })
  apiKey?: string;

  @Field(() => [String], { nullable: true })
  teamFilter?: string[];

  @Field(() => Boolean, { nullable: true })
  createTaskOnIssue?: boolean;

  @Field(() => Boolean, { nullable: true })
  createTaskOnComment?: boolean;

  @Field(() => Boolean, { nullable: true })
  closeIssueOnComplete?: boolean;

  @Field(() => Boolean, { nullable: true })
  commentOnStatusChange?: boolean;

  @Field(() => Boolean, { nullable: true })
  syncAssignee?: boolean;
}

@InputType()
export class UpdateLinearConnectionInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  apiKey?: string;

  @Field(() => [String], { nullable: true })
  teamFilter?: string[];

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;

  @Field(() => Boolean, { nullable: true })
  createTaskOnIssue?: boolean;

  @Field(() => Boolean, { nullable: true })
  createTaskOnComment?: boolean;

  @Field(() => Boolean, { nullable: true })
  closeIssueOnComplete?: boolean;

  @Field(() => Boolean, { nullable: true })
  commentOnStatusChange?: boolean;

  @Field(() => Boolean, { nullable: true })
  syncAssignee?: boolean;
}
