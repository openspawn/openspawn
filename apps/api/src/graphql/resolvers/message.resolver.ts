import { Args, ID, Int, Query, Resolver, Subscription } from "@nestjs/graphql";

import { ChannelsService, MessagesService } from "../../messages";
import { MESSAGE_CREATED, PubSubProvider } from "../pubsub.provider";
import { ChannelGqlType, MessageGqlType } from "../types";

@Resolver(() => MessageGqlType)
export class MessageResolver {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService,
    private readonly pubSub: PubSubProvider,
  ) {}

  @Query(() => [ChannelGqlType])
  async channels(@Args("orgId", { type: () => ID }) orgId: string): Promise<ChannelGqlType[]> {
    return this.channelsService.findAll(orgId);
  }

  @Query(() => [MessageGqlType])
  async messages(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("channelId", { type: () => ID }) channelId: string,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("before", { type: () => ID, nullable: true }) before?: string,
  ): Promise<MessageGqlType[]> {
    return this.messagesService.findByChannel(orgId, channelId, limit, before);
  }

  @Subscription(() => MessageGqlType, {
    filter: (payload, variables) =>
      payload.messageCreated.orgId === variables.orgId &&
      (!variables.channelId || payload.messageCreated.channelId === variables.channelId),
  })
  messageCreated(
    @Args("orgId", { type: () => ID }) _orgId: string,
    @Args("channelId", { type: () => ID, nullable: true }) _channelId?: string,
  ): AsyncIterator<MessageGqlType> {
    return this.pubSub.asyncIterableIterator(MESSAGE_CREATED);
  }
}
