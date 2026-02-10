import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";

import { InboundWebhookKey, Task } from "@openspawn/database";
import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { InboundWebhookReceiverController } from "./inbound-webhook-receiver.controller";
import { InboundWebhooksService } from "./inbound-webhooks.service";
import { TasksService } from "../tasks/tasks.service";

describe("InboundWebhookReceiverController", () => {
  let controller: InboundWebhookReceiverController;
  let inboundWebhooksService: Partial<InboundWebhooksService>;
  let tasksService: Partial<TasksService>;

  const orgId = "org-123";
  const webhookKey = "iwk_test123";

  const mockWebhookKey: InboundWebhookKey = {
    id: "key-1",
    orgId,
    name: "Test Key",
    key: webhookKey,
    secret: "test-secret",
    defaultAgentId: "agent-1",
    defaultPriority: TaskPriority.NORMAL,
    defaultTags: ["webhook"],
    enabled: true,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InboundWebhookKey;

  const mockTask: Task = {
    id: "task-1",
    orgId,
    identifier: "TASK-001",
    title: "Test Task",
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.NORMAL,
    metadata: { createdViaWebhook: true },
  } as Task;

  beforeEach(() => {
    vi.clearAllMocks();

    inboundWebhooksService = {
      findByKey: vi.fn(),
      updateLastUsed: vi.fn(),
      verifySignature: vi.fn(),
    };

    tasksService = {
      create: vi.fn(),
    };

    controller = new InboundWebhookReceiverController(
      inboundWebhooksService as InboundWebhooksService,
      tasksService as TasksService
    );
  });

  describe("createTask", () => {
    it("should create a task successfully", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(mockWebhookKey);
      (tasksService.create as any).mockResolvedValue(mockTask);

      const dto = {
        title: "New Task",
        description: "Task description",
        priority: TaskPriority.HIGH,
        tags: ["urgent"],
      };

      const req = {
        rawBody: Buffer.from(JSON.stringify(dto)),
      } as any;

      const result = await controller.createTask(webhookKey, dto, undefined, req);

      expect(inboundWebhooksService.findByKey).toHaveBeenCalledWith(webhookKey);
      expect(tasksService.create).toHaveBeenCalledWith(
        orgId,
        orgId,
        expect.objectContaining({
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          tags: ["webhook", "urgent"],
          metadata: expect.objectContaining({
            createdViaWebhook: true,
            webhookKeyId: mockWebhookKey.id,
            webhookKeyName: mockWebhookKey.name,
          }),
        })
      );
      expect(inboundWebhooksService.updateLastUsed).toHaveBeenCalledWith(mockWebhookKey.id);
      expect(result).toEqual(mockTask);
    });

    it("should throw NotFoundException when webhook key not found", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(null);

      const dto = { title: "Test" };
      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;

      await expect(controller.createTask("invalid-key", dto, undefined, req)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should verify signature when provided", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(mockWebhookKey);
      (inboundWebhooksService.verifySignature as any).mockReturnValue(true);
      (tasksService.create as any).mockResolvedValue(mockTask);

      const dto = { title: "Test" };
      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;
      const signature = "valid-signature";

      await controller.createTask(webhookKey, dto, signature, req);

      expect(inboundWebhooksService.verifySignature).toHaveBeenCalledWith(
        mockWebhookKey.secret,
        JSON.stringify(dto),
        signature
      );
    });

    it("should throw UnauthorizedException when signature is invalid", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(mockWebhookKey);
      (inboundWebhooksService.verifySignature as any).mockReturnValue(false);

      const dto = { title: "Test" };
      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;
      const signature = "invalid-signature";

      await expect(controller.createTask(webhookKey, dto, signature, req)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should merge default values from webhook key", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(mockWebhookKey);
      (tasksService.create as any).mockResolvedValue(mockTask);

      const dto = { title: "Test" }; // No priority, assignee, or tags
      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;

      await controller.createTask(webhookKey, dto, undefined, req);

      expect(tasksService.create).toHaveBeenCalledWith(
        orgId,
        orgId,
        expect.objectContaining({
          title: dto.title,
          priority: mockWebhookKey.defaultPriority,
          assigneeId: mockWebhookKey.defaultAgentId,
          tags: mockWebhookKey.defaultTags,
        })
      );
    });
  });

  describe("createTasks (batch)", () => {
    it("should create multiple tasks", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(mockWebhookKey);
      (tasksService.create as any).mockResolvedValue(mockTask);

      const dto = {
        tasks: [
          { title: "Task 1", priority: TaskPriority.HIGH },
          { title: "Task 2", priority: TaskPriority.LOW },
        ],
      };

      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;

      const result = await controller.createTasks(webhookKey, dto, undefined, req);

      expect(tasksService.create).toHaveBeenCalledTimes(2);
      expect(inboundWebhooksService.updateLastUsed).toHaveBeenCalledWith(mockWebhookKey.id);
      expect(result).toHaveLength(2);
    });

    it("should throw NotFoundException when webhook key not found", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(null);

      const dto = { tasks: [{ title: "Task 1" }] };
      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;

      await expect(controller.createTasks("invalid-key", dto, undefined, req)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should verify signature for batch requests", async () => {
      (inboundWebhooksService.findByKey as any).mockResolvedValue(mockWebhookKey);
      (inboundWebhooksService.verifySignature as any).mockReturnValue(true);
      (tasksService.create as any).mockResolvedValue(mockTask);

      const dto = { tasks: [{ title: "Task 1" }] };
      const req = { rawBody: Buffer.from(JSON.stringify(dto)) } as any;
      const signature = "valid-signature";

      await controller.createTasks(webhookKey, dto, signature, req);

      expect(inboundWebhooksService.verifySignature).toHaveBeenCalledWith(
        mockWebhookKey.secret,
        JSON.stringify(dto),
        signature
      );
    });
  });
});
