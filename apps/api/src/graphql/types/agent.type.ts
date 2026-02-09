import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

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
