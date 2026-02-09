import { Field, ID, Int, ObjectType, InputType } from "@nestjs/graphql";
import { MessageType as MsgType } from "@openspawn/shared-types";

@ObjectType()
export class DirectMessageAgentType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  level!: number;
}

@ObjectType()
export class DirectMessageType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  fromAgentId!: string;

  @Field(() => DirectMessageAgentType, { nullable: true })
  fromAgent?: DirectMessageAgentType | null;

  @Field(() => ID)
  toAgentId!: string;

  @Field(() => DirectMessageAgentType, { nullable: true })
  toAgent?: DirectMessageAgentType | null;

  @Field()
  body!: string;

  @Field(() => String)
  type!: MsgType;

  @Field()
  read!: boolean;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class ConversationType {
  @Field(() => ID)
  channelId!: string;

  @Field(() => ID)
  otherAgentId!: string;

  @Field()
  otherAgentName!: string;

  @Field(() => Int)
  otherAgentLevel!: number;

  @Field()
  lastMessage!: string;

  @Field()
  lastMessageAt!: Date;

  @Field(() => Int)
  unreadCount!: number;
}

@InputType()
export class SendDirectMessageInput {
  @Field(() => ID)
  fromAgentId!: string;

  @Field(() => ID)
  toAgentId!: string;

  @Field()
  body!: string;

  @Field(() => String, { nullable: true })
  type?: MsgType;
}
