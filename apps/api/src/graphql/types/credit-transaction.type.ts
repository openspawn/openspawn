import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { CreditType } from "@openspawn/shared-types";

registerEnumType(CreditType, { name: "CreditType" });

@ObjectType()
export class CreditTransactionType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  agentId!: string;

  @Field(() => CreditType)
  type!: CreditType;

  @Field(() => Int)
  amount!: number;

  @Field(() => Int)
  balanceAfter!: number;

  @Field(() => String)
  reason!: string;

  @Field(() => String, { nullable: true })
  triggerType?: string | null;

  @Field(() => ID, { nullable: true })
  sourceTaskId?: string | null;

  @Field(() => Date)
  createdAt!: Date;
}
