import { Field, ID, ObjectType, InputType } from "@nestjs/graphql";

@ObjectType()
export class GitHubSyncConfigInboundType {
  @Field(() => Boolean)
  createTaskOnIssue!: boolean;

  @Field(() => Boolean)
  createTaskOnPR!: boolean;

  @Field(() => Boolean)
  createTaskOnCheckFailure!: boolean;

  @Field(() => String, { nullable: true })
  requiredLabel?: string;
}

@ObjectType()
export class GitHubSyncConfigOutboundType {
  @Field(() => Boolean)
  closeIssueOnComplete!: boolean;

  @Field(() => Boolean)
  commentOnStatusChange!: boolean;

  @Field(() => Boolean)
  updateLabels!: boolean;
}

@ObjectType()
export class GitHubSyncConfigType {
  @Field(() => GitHubSyncConfigInboundType)
  inbound!: GitHubSyncConfigInboundType;

  @Field(() => GitHubSyncConfigOutboundType)
  outbound!: GitHubSyncConfigOutboundType;
}

@ObjectType()
export class GitHubConnectionType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orgId!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  installationId!: string;

  @Field(() => String)
  webhookSecret!: string;

  @Field(() => [String])
  repoFilter!: string[];

  @Field(() => GitHubSyncConfigType)
  syncConfig!: GitHubSyncConfigType;

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
export class CreateGitHubConnectionInput {
  @Field(() => String)
  name!: string;

  @Field(() => String)
  installationId!: string;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => [String], { nullable: true })
  repoFilter?: string[];

  @Field(() => Boolean, { nullable: true })
  createTaskOnIssue?: boolean;

  @Field(() => Boolean, { nullable: true })
  createTaskOnPR?: boolean;

  @Field(() => Boolean, { nullable: true })
  closeIssueOnComplete?: boolean;

  @Field(() => Boolean, { nullable: true })
  commentOnStatusChange?: boolean;
}

@InputType()
export class UpdateGitHubConnectionInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => [String], { nullable: true })
  repoFilter?: string[];

  @Field(() => Boolean, { nullable: true })
  enabled?: boolean;

  @Field(() => Boolean, { nullable: true })
  createTaskOnIssue?: boolean;

  @Field(() => Boolean, { nullable: true })
  createTaskOnPR?: boolean;

  @Field(() => Boolean, { nullable: true })
  closeIssueOnComplete?: boolean;

  @Field(() => Boolean, { nullable: true })
  commentOnStatusChange?: boolean;
}
