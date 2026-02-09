import { Field, Float, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { AgentRole, AgentStatus, ReputationLevel } from "@openspawn/shared-types";

// Register enums
registerEnumType(AgentRole, { name: "AgentRole" });
registerEnumType(AgentStatus, { name: "AgentStatus" });
registerEnumType(ReputationLevel, { name: "ReputationLevel" });

@ObjectType()
export class AgentType {
  @Field(() => ID)
  id!: string;

  @Field()
  agentId!: string;

  @Field()
  name!: string;

  @Field(() => AgentRole)
  role!: AgentRole;

  @Field(() => AgentStatus)
  status!: AgentStatus;

  @Field(() => Int)
  level!: number;

  @Field()
  model!: string;

  @Field(() => Int)
  currentBalance!: number;

  @Field(() => Int, { nullable: true })
  budgetPeriodLimit?: number | null;

  @Field(() => Int)
  budgetPeriodSpent!: number;

  @Field(() => Int)
  managementFeePct!: number;

  // Trust & Reputation
  @Field(() => Int)
  trustScore!: number;

  // reputationLevel is computed via @ResolveField in AgentResolver

  @Field(() => Int)
  tasksCompleted!: number;

  @Field(() => Int)
  tasksSuccessful!: number;

  @Field({ nullable: true })
  lastActivityAt?: Date | null;

  @Field({ nullable: true })
  lastPromotionAt?: Date | null;

  @Field(() => ID, { nullable: true })
  parentId?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

// Promotion progress toward next level
@ObjectType()
export class PromotionProgressType {
  @Field(() => Int)
  currentLevel!: number;

  @Field(() => Int)
  nextLevel!: number;

  @Field(() => Int)
  trustScoreRequired!: number;

  @Field(() => Int)
  tasksRequired!: number;

  @Field(() => Int)
  trustScoreProgress!: number;

  @Field(() => Int)
  tasksProgress!: number;
}

// Aggregated reputation info
@ObjectType()
export class AgentReputationType {
  @Field(() => Int)
  trustScore!: number;

  @Field(() => ReputationLevel)
  reputationLevel!: ReputationLevel;

  @Field(() => Int)
  tasksCompleted!: number;

  @Field(() => Int)
  tasksSuccessful!: number;

  @Field(() => Float)
  successRate!: number;

  @Field({ nullable: true })
  lastActivityAt?: Date | null;

  @Field(() => PromotionProgressType, { nullable: true })
  promotionProgress?: PromotionProgressType | null;
}

// Reputation history entry
@ObjectType()
export class ReputationHistoryEntryType {
  @Field(() => ID)
  id!: string;

  @Field()
  eventType!: string;

  @Field(() => Int)
  delta!: number;

  @Field(() => Int)
  previousScore!: number;

  @Field(() => Int)
  newScore!: number;

  @Field()
  reason!: string;

  @Field()
  createdAt!: Date;
}

// Leaderboard entry
@ObjectType()
export class LeaderboardEntryType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  agentId!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  level!: number;

  @Field(() => Int)
  trustScore!: number;

  @Field(() => ReputationLevel)
  reputationLevel!: ReputationLevel;

  @Field(() => Int)
  tasksCompleted!: number;
}
