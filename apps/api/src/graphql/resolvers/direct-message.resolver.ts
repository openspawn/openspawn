import {
  Args,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from "@nestjs/graphql";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { DirectMessagesService } from "../../messages";
import { PubSubProvider } from "../pubsub.provider";
import {
  DirectMessageType,
  ConversationType,
  SendDirectMessageInput,
} from "../types";

export const DIRECT_MESSAGE_CREATED = "directMessageCreated";

@Resolver(() => DirectMessageType)
export class DirectMessageResolver {
  constructor(
    private dms: DirectMessagesService,
    private pubSub: PubSubProvider,
    private emitter: EventEmitter2,
  ) {
    this.emitter.on(
      "message.direct",
      async (p: { message: DirectMessageType }) => {
        await this.pubSub.publish(DIRECT_MESSAGE_CREATED, {
          directMessageCreated: p.message,
        });
      },
    );
  }

  @Query(() => [ConversationType])
  async conversations(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() auth?: string,
  ) {
    validateOrgAccess(orgId, auth);
    return this.dms.getConversations(orgId, agentId);
  }

  @Query(() => [DirectMessageType])
  async directMessages(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agent1Id", { type: () => ID }) a1: string,
    @Args("agent2Id", { type: () => ID }) a2: string,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("before", { type: () => ID, nullable: true }) before?: string,
    @OrgFromContext() auth?: string,
  ) {
    validateOrgAccess(orgId, auth);
    const msgs = await this.dms.getDirectMessages(orgId, a1, a2, limit, before);
    return msgs.map((m) => ({
      id: m.id,
      fromAgentId: m.fromAgentId,
      fromAgent: { id: m.fromAgentId, name: m.fromAgentName, level: 5 },
      toAgentId: m.toAgentId,
      toAgent: { id: m.toAgentId, name: m.toAgentName, level: 5 },
      body: m.body,
      type: m.type,
      read: m.read,
      createdAt: m.createdAt,
    }));
  }

  @Query(() => Int)
  async unreadMessageCount(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() auth?: string,
  ) {
    validateOrgAccess(orgId, auth);
    return this.dms.getUnreadCount(orgId, agentId);
  }

  @Mutation(() => DirectMessageType)
  async sendDirectMessage(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("input") input: SendDirectMessageInput,
    @OrgFromContext() auth?: string,
  ) {
    validateOrgAccess(orgId, auth);
    const m = await this.dms.sendDirectMessage(orgId, input.fromAgentId, {
      toAgentId: input.toAgentId,
      body: input.body,
      type: input.type,
    });
    const r = {
      id: m.id,
      fromAgentId: m.senderId,
      fromAgent: null,
      toAgentId: input.toAgentId,
      toAgent: null,
      body: m.body,
      type: m.type,
      read: false,
      createdAt: m.createdAt,
    };
    this.emitter.emit("message.direct", { message: r });
    return r;
  }

  @Mutation(() => Int)
  async markMessagesAsRead(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @Args("otherAgentId", { type: () => ID }) otherId: string,
    @OrgFromContext() auth?: string,
  ) {
    validateOrgAccess(orgId, auth);
    return this.dms.markAsRead(orgId, agentId, otherId);
  }

  @Subscription(() => DirectMessageType, {
    filter: (p, v) =>
      p.directMessageCreated.toAgentId === v.agentId ||
      p.directMessageCreated.fromAgentId === v.agentId,
  })
  directMessageCreated(
    @Args("orgId", { type: () => ID }) _o: string,
    @Args("agentId", { type: () => ID }) _a: string,
  ): AsyncIterator<DirectMessageType> {
    return this.pubSub.asyncIterableIterator(DIRECT_MESSAGE_CREATED);
  }
}
