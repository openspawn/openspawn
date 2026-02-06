import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

import { MessageType as MessageTypeEnum } from "@openspawn/shared-types";

registerEnumType(MessageTypeEnum, { name: "MessageType" });

@ObjectType()
export class MessageGqlType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  channelId!: string;

  @Field(() => ID)
  senderId!: string;

  @Field(() => MessageTypeEnum)
  type!: MessageTypeEnum;

  @Field()
  body!: string;

  @Field(() => ID, { nullable: true })
  parentMessageId?: string | null;

  @Field()
  createdAt!: Date;
}
