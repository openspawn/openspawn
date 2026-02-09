import { Args, ID, Int, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { DirectMessagesService } from "../../messages";
import { PubSubProvider } from "../pubsub.provider";
import { DirectMessageType, ConversationType, SendDirectMessageInput } from "../types";

export const DIRECT_MESSAGE_CREATED = "directMessageCreated";

@Resolver(() => DirectMessageType)
export class DirectMessageResolver {
  constructor(
    private readonly directMessagesService: DirectMessagesService,
    private readonly pubSub: PubSubProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.eventEmitter.on("message.direct", async (payload: { message: DirectMessageType }) => {
      await this.pubSub.publish(DIRECT_MESSAGE_CREATED, { directMessageCreated: payload.message });
    });
  }

  @Query(() => [ConversationType])
  async conversations(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() authOrgId?: string,
  ): Promise<ConversationType[]> {
    validateOrgAccess(orgId, authOrgId);
    return this.directMessagesService.getConversations(orgId, agentId);
  }

  @Query(() => [DirectMessageType])
  async directMessages(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agent1Id", { type: () => ID }) agent1Id: string,
    @Args("agent2Id", { type: () => ID }) agent2Id: string,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("before", { type: () => ID, nullable: true }) before?: string,
    @OrgFromContext() authOrgId?: string,
  ): Promise<DirectMessageType[]> {
    validateOrgAccess(orgId, authOrgId);
    const msgs = await this.directMessagesService.getDirectMessages(orgId, agent1Id, agent2Id, limit, before);
    return msgs.map(m => ({
      id: m.id, fromAgentId: m.fromAgentId,
      fromAgent: { id: m.fromAgentId, name: m.fromAgentName, level: 5 },
      toAgentId: m.toAgentId, toAgent: { id: m.toAgentId, name: m.toAgentName, level: 5 },
      body: m.body, type: m.type, read: m.read, createdAt: m.createdAt,
    }));
  }

  @Query(() => Int)
  async unreadMessageCount(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() authOrgId?: string,
  ): Promise<number> {
    validateOrgAccess(orgId, authOrgId);
    return this.directMessagesService.getUnreadCount(orgId, agentId);
  }

  @Mutation(() => DirectMessageType)
  async sendDirectMessage(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("input") input: SendDirectMessageInput,
    @OrgFromContext() authOrgId?: string,
  ): Promise<DirectMessageType> {
    validateOrgAccess(orgId, authOrgId);
    const msg = await this.directMessagesService.sendDirectMessage(orgId, input.fromAgentId, {
      toAgentId: input.toAgentId, body: input.body, type: input.type,
    });
    const result = {
      id: msg.id, fromAgentId: msg.senderId, fromAgent: null,
      toAgentId: input.toAgentId, toAgent: null,
      body: msg.body, type: msg.type, read: false, createdAt: msg.createdAt,
    };
    this.eventEmitter.emit("message.direct", { message: result });
    return result;
  }

  @Mutation(() => Int)
  async markMessagesAsRead(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @Args("otherAgentId", { type: () => ID }) otherAgentId: string,
    @OrgFromContext() authOrgId?: string,
  ): Promise<number> {
    validateOrgAccess(orgId, authOrgId);
    return this.directMessagesService.markAsRead(orgId, agentId, otherAgentId);
  }

  @Subscription(() => DirectMessageType, {
    filter: (payload, vars) => {
      const m = payload.directMessageCreated;
      return m.toAgentId === vars.agentId || m.fromAgentId === vars.agentId;
    },
  })
  directMessageCreated(
    @Args("orgId", { type: () => ID }) _orgId: string,
    @Args("agentId", { type: () => ID }) _agentId: string,
  ): AsyncIterator<DirectMessageType> {
    return this.pubSub.asyncIterableIterator(DIRECT_MESSAGE_CREATED);
  }
}
