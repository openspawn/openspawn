import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { Agent, Channel, Message } from "@openspawn/database";
import { AgentStatus, ChannelType, MessageType } from "@openspawn/shared-types";

import { EventsService } from "../events";

import { DirectMessagesService } from "./direct-messages.service";

describe("DirectMessagesService", () => {
  let service: DirectMessagesService;
  let agentRepo: Partial<Repository<Agent>>;
  let channelRepo: Partial<Repository<Channel>>;
  let messageRepo: Partial<Repository<Message>>;
  let eventsService: Partial<EventsService>;

  const orgId = "org-123";

  const createMockAgent = (overrides: Partial<Agent> = {}): Agent =>
    ({
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      agentId: "test-agent",
      name: "Test Agent",
      level: 5,
      status: AgentStatus.ACTIVE,
      role: "worker",
      trustScore: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Agent;

  const createMockChannel = (overrides: Partial<Channel> = {}): Channel =>
    ({
      id: `channel-${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      name: "test-channel",
      type: ChannelType.AGENT,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Channel;

  const createMockMessage = (overrides: Partial<Message> = {}): Message =>
    ({
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      channelId: "channel-1",
      senderId: "agent-1",
      recipientId: "agent-2",
      type: MessageType.TEXT,
      body: "Test message",
      metadata: { read: false },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Message;

  beforeEach(() => {
    vi.clearAllMocks();

    agentRepo = {
      findOne: vi.fn(),
    };

    channelRepo = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((data) => data as Channel),
      save: vi.fn().mockImplementation((data) => Promise.resolve({ id: "channel-new", ...data } as Channel)),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
    };

    messageRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn().mockImplementation((data) => data as Message),
      save: vi.fn().mockImplementation((data) => Promise.resolve({ id: "msg-new", ...data } as Message)),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
        getCount: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 0 }),
      }),
    };

    eventsService = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    service = new DirectMessagesService(
      agentRepo as Repository<Agent>,
      channelRepo as Repository<Channel>,
      messageRepo as Repository<Message>,
      eventsService as EventsService,
    );
  });

  describe("sendDirectMessage", () => {
    it("should create a message with recipientId", async () => {
      const fromAgent = createMockAgent({ id: "agent-1" });
      const toAgent = createMockAgent({ id: "agent-2" });
      const channel = createMockChannel({ id: "channel-1" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);
      (channelRepo.findOne as Mock).mockResolvedValue(channel);

      const result = await service.sendDirectMessage(orgId, "agent-1", {
        toAgentId: "agent-2",
        body: "Hello!",
      });

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: "agent-1",
          recipientId: "agent-2",
          body: "Hello!",
        }),
      );
      expect(result).toHaveProperty("id");
    });

    it("should throw NotFoundException when sender agent not found", async () => {
      (agentRepo.findOne as Mock).mockResolvedValue(null);

      await expect(
        service.sendDirectMessage(orgId, "invalid-agent", {
          toAgentId: "agent-2",
          body: "Hello!",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when recipient agent not found", async () => {
      const fromAgent = createMockAgent({ id: "agent-1" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(null);

      await expect(
        service.sendDirectMessage(orgId, "agent-1", {
          toAgentId: "invalid-agent",
          body: "Hello!",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when sender is not active", async () => {
      const inactiveAgent = createMockAgent({ id: "agent-1", status: AgentStatus.SUSPENDED });
      const toAgent = createMockAgent({ id: "agent-2" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(inactiveAgent)
        .mockResolvedValueOnce(toAgent);

      await expect(
        service.sendDirectMessage(orgId, "agent-1", {
          toAgentId: "agent-2",
          body: "Hello!",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should create or get DM channel between agents", async () => {
      const fromAgent = createMockAgent({ id: "agent-1" });
      const toAgent = createMockAgent({ id: "agent-2" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);
      (channelRepo.findOne as Mock).mockResolvedValue(null);

      await service.sendDirectMessage(orgId, "agent-1", {
        toAgentId: "agent-2",
        body: "Hello!",
      });

      expect(channelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ChannelType.AGENT,
          metadata: expect.objectContaining({
            participants: expect.arrayContaining(["agent-1", "agent-2"]),
          }),
        }),
      );
    });

    it("should emit message.direct event", async () => {
      const fromAgent = createMockAgent({ id: "agent-1" });
      const toAgent = createMockAgent({ id: "agent-2" });
      const channel = createMockChannel({ id: "channel-1" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);
      (channelRepo.findOne as Mock).mockResolvedValue(channel);

      await service.sendDirectMessage(orgId, "agent-1", {
        toAgentId: "agent-2",
        body: "Hello!",
      });

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "message.direct",
          actorId: "agent-1",
          entityType: "message",
        }),
      );
    });

    it("should use default message type TEXT when not specified", async () => {
      const fromAgent = createMockAgent({ id: "agent-1" });
      const toAgent = createMockAgent({ id: "agent-2" });
      const channel = createMockChannel({ id: "channel-1" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);
      (channelRepo.findOne as Mock).mockResolvedValue(channel);

      await service.sendDirectMessage(orgId, "agent-1", {
        toAgentId: "agent-2",
        body: "Hello!",
      });

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.TEXT,
        }),
      );
    });

    it("should set initial read status to false", async () => {
      const fromAgent = createMockAgent({ id: "agent-1" });
      const toAgent = createMockAgent({ id: "agent-2" });
      const channel = createMockChannel({ id: "channel-1" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(fromAgent)
        .mockResolvedValueOnce(toAgent);
      (channelRepo.findOne as Mock).mockResolvedValue(channel);

      await service.sendDirectMessage(orgId, "agent-1", {
        toAgentId: "agent-2",
        body: "Hello!",
      });

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            read: false,
          }),
        }),
      );
    });
  });

  describe("getDirectMessages", () => {
    it("should return conversation between two agents", async () => {
      const agent1 = createMockAgent({ id: "agent-1", name: "Agent One" });
      const agent2 = createMockAgent({ id: "agent-2", name: "Agent Two" });
      const channel = createMockChannel({ id: "channel-1" });
      const messages = [
        createMockMessage({ senderId: "agent-1", body: "Hello" }),
        createMockMessage({ senderId: "agent-2", body: "Hi there" }),
      ];

      (channelRepo.findOne as Mock).mockResolvedValue(channel);
      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(agent1)
        .mockResolvedValueOnce(agent2);
      (messageRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(messages),
      });

      const result = await service.getDirectMessages(orgId, "agent-1", "agent-2");

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("fromAgentId");
      expect(result[0]).toHaveProperty("toAgentId");
      expect(result[0]).toHaveProperty("body");
    });

    it("should throw NotFoundException when agent not found", async () => {
      const channel = createMockChannel({ id: "channel-1" });

      (channelRepo.findOne as Mock).mockResolvedValue(channel);
      (agentRepo.findOne as Mock).mockResolvedValue(null);

      await expect(
        service.getDirectMessages(orgId, "agent-1", "agent-2"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getConversations", () => {
    it("should return all conversations for an agent", async () => {
      const otherAgent = createMockAgent({ id: "agent-2", name: "Other Agent", level: 3 });
      const channel = createMockChannel({
        id: "channel-1",
        name: "dm:agent-1:agent-2",
        metadata: { participants: ["agent-1", "agent-2"] },
      });
      const lastMessage = createMockMessage({ body: "Last message" });

      (channelRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([channel]),
      });
      (agentRepo.findOne as Mock).mockResolvedValue(otherAgent);
      (messageRepo.findOne as Mock).mockResolvedValue(lastMessage);
      (messageRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(2),
      });

      const result = await service.getConversations(orgId, "agent-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("channelId");
      expect(result[0]).toHaveProperty("otherAgentId");
      expect(result[0]).toHaveProperty("otherAgentName");
      expect(result[0]).toHaveProperty("unreadCount");
      expect(result[0]).toHaveProperty("lastMessage");
    });
  });

  describe("markAsRead", () => {
    it("should update read status of messages", async () => {
      const channel = createMockChannel({ id: "channel-1" });

      (channelRepo.findOne as Mock).mockResolvedValue(channel);

      const executeSpy = vi.fn().mockResolvedValue({ affected: 5 });
      (messageRepo.createQueryBuilder as Mock).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: executeSpy,
      });

      const result = await service.markAsRead(orgId, "agent-1", "agent-2");

      expect(result).toBe(5);
    });

    it("should return 0 when no messages to mark as read", async () => {
      const channel = createMockChannel({ id: "channel-1" });

      (channelRepo.findOne as Mock).mockResolvedValue(channel);
      (messageRepo.createQueryBuilder as Mock).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 0 }),
      });

      const result = await service.markAsRead(orgId, "agent-1", "agent-2");

      expect(result).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("should return correct count of unread messages", async () => {
      const channel = createMockChannel({
        id: "channel-1",
        name: "dm:agent-1:agent-2",
        metadata: { participants: ["agent-1", "agent-2"] },
      });

      (channelRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([channel]),
      });

      (messageRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(5),
      });

      const result = await service.getUnreadCount(orgId, "agent-1");

      expect(result).toBe(5);
    });

    it("should return 0 when no unread messages", async () => {
      (channelRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      });

      const result = await service.getUnreadCount(orgId, "agent-1");

      expect(result).toBe(0);
    });
  });

  describe("DM Channel Naming", () => {
    it("should generate consistent channel name regardless of agent order", async () => {
      const agent1 = createMockAgent({ id: "aaa-agent" });
      const agent2 = createMockAgent({ id: "zzz-agent" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(agent1)
        .mockResolvedValueOnce(agent2);
      (channelRepo.findOne as Mock).mockResolvedValue(null);

      await service.sendDirectMessage(orgId, "aaa-agent", {
        toAgentId: "zzz-agent",
        body: "Hello!",
      });

      expect(channelRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: "dm:aaa-agent:zzz-agent",
          }),
        }),
      );
    });

    it("should reuse existing DM channel", async () => {
      const agent1 = createMockAgent({ id: "agent-1" });
      const agent2 = createMockAgent({ id: "agent-2" });
      const existingChannel = createMockChannel({ id: "existing-channel" });

      (agentRepo.findOne as Mock)
        .mockResolvedValueOnce(agent1)
        .mockResolvedValueOnce(agent2);
      (channelRepo.findOne as Mock).mockResolvedValue(existingChannel);

      await service.sendDirectMessage(orgId, "agent-1", {
        toAgentId: "agent-2",
        body: "Hello!",
      });

      expect(channelRepo.create).not.toHaveBeenCalled();
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId: "existing-channel",
        }),
      );
    });
  });
});
