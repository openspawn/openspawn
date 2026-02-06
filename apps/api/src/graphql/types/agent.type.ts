import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { AgentRole, AgentStatus } from "@openspawn/shared-types";

// Register enums
registerEnumType(AgentRole, { name: "AgentRole" });
registerEnumType(AgentStatus, { name: "AgentStatus" });

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

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
