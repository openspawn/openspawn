import { Args, ID, Int, Query, Resolver, Subscription } from "@nestjs/graphql";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { ChannelsService, MessagesService } from "../../messages";
import { MESSAGE_CREATED, PubSubProvider } from "../pubsub.provider";
import { ChannelGqlType, MessageGqlType } from "../types";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * All queries validate that the requested orgId matches the authenticated context
 * to prevent cross-organization data access.
 */
@Resolver(() => MessageGqlType)
export class MessageResolver {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService,
    private readonly pubSub: PubSubProvider,
  ) {}

  @Query(() => [ChannelGqlType])
  async channels(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<ChannelGqlType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.channelsService.findAll(orgId);
  }

  @Query(() => [MessageGqlType])
  async messages(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("channelId", { type: () => ID }) channelId: string,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("before", { type: () => ID, nullable: true }) before?: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<MessageGqlType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
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
    // Note: Subscription authorization is handled in the filter function above.
    // The subscription only emits events matching the requested orgId.
    // Full subscription auth should be implemented via connection params.
    // TODO: Validate orgId against connection-level auth context
    return this.pubSub.asyncIterableIterator(MESSAGE_CREATED);
  }
}
