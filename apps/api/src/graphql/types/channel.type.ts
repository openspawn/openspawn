import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

import { ChannelType as ChannelTypeEnum } from "@openspawn/shared-types";

registerEnumType(ChannelTypeEnum, { name: "ChannelType" });

@ObjectType()
export class ChannelGqlType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => ChannelTypeEnum)
  type!: ChannelTypeEnum;

  @Field(() => ID, { nullable: true })
  taskId?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
