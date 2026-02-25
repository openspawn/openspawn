import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

import { InboundWebhookKey } from "@openspawn/database";
import { TaskPriority } from "@openspawn/shared-types";

import { InboundWebhooksService } from "./inbound-webhooks.service";

describe("InboundWebhooksService", () => {
  let service: InboundWebhooksService;
  let webhookKeyRepo: Partial<Repository<InboundWebhookKey>>;

  const orgId = "org-123";

  const createMockWebhookKey = (overrides: Partial<InboundWebhookKey> = {}): InboundWebhookKey =>
    ({
      id: "key-1",
      orgId,
      name: "Test Key",
      key: "iwk_test123",
      secret: "secret123",
      defaultAgentId: null,
      defaultPriority: null,
      defaultTags: [],
      enabled: true,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as InboundWebhookKey;

  beforeEach(() => {
    vi.clearAllMocks();

    webhookKeyRepo = {
      create: vi.fn().mockImplementation((data) => data as InboundWebhookKey),
      save: vi.fn().mockImplementation((key) => Promise.resolve(key as InboundWebhookKey)),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    service = new InboundWebhooksService(webhookKeyRepo as Repository<InboundWebhookKey>);
  });

  describe("create", () => {
    it("should create a webhook key with generated key and secret", async () => {
      const dto = {
        name: "GitHub Webhook",
        defaultAgentId: "agent-1",
        defaultPriority: TaskPriority.NORMAL,
        defaultTags: ["external"],
      };

      const result = await service.create(orgId, dto);

      expect(webhookKeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          name: dto.name,
          defaultAgentId: dto.defaultAgentId,
          defaultPriority: dto.defaultPriority,
          defaultTags: dto.defaultTags,
          enabled: true,
        })
      );
      expect(webhookKeyRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        name: dto.name,
      });
    });

    it("should generate key with iwk_ prefix", async () => {
      const dto = { name: "Test Key" };
      const savedKey = createMockWebhookKey({ name: "Test Key", key: "iwk_generated" });
      (webhookKeyRepo.save as any).mockResolvedValue(savedKey);

      const result = await service.create(orgId, dto);

      expect(result.key).toMatch(/^iwk_/);
    });
  });

  describe("findAll", () => {
    it("should return all webhook keys for an organization", async () => {
      const mockKeys = [
        createMockWebhookKey({ id: "key-1", name: "Key 1" }),
        createMockWebhookKey({ id: "key-2", name: "Key 2" }),
      ];
      (webhookKeyRepo.find as any).mockResolvedValue(mockKeys);

      const result = await service.findAll(orgId);

      expect(webhookKeyRepo.find).toHaveBeenCalledWith({
        where: { orgId },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockKeys);
    });
  });

  describe("findOne", () => {
    it("should return a webhook key by id", async () => {
      const mockKey = createMockWebhookKey();
      (webhookKeyRepo.findOne as any).mockResolvedValue(mockKey);

      const result = await service.findOne(orgId, "key-1");

      expect(webhookKeyRepo.findOne).toHaveBeenCalledWith({
        where: { id: "key-1", orgId },
      });
      expect(result).toEqual(mockKey);
    });

    it("should throw NotFoundException when key not found", async () => {
      (webhookKeyRepo.findOne as any).mockResolvedValue(null);

      await expect(service.findOne(orgId, "key-999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByKey", () => {
    it("should return a webhook key by key string", async () => {
      const mockKey = createMockWebhookKey();
      (webhookKeyRepo.findOne as any).mockResolvedValue(mockKey);

      const result = await service.findByKey("iwk_test123");

      expect(webhookKeyRepo.findOne).toHaveBeenCalledWith({
        where: { key: "iwk_test123", enabled: true },
      });
      expect(result).toEqual(mockKey);
    });

    it("should return null when key not found", async () => {
      (webhookKeyRepo.findOne as any).mockResolvedValue(null);

      const result = await service.findByKey("iwk_invalid");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a webhook key", async () => {
      const mockKey = createMockWebhookKey();
      (webhookKeyRepo.findOne as any).mockResolvedValue(mockKey);

      const dto = {
        name: "Updated Name",
        enabled: false,
      };

      const result = await service.update(orgId, "key-1", dto);

      expect(result.name).toBe("Updated Name");
      expect(result.enabled).toBe(false);
      expect(webhookKeyRepo.save).toHaveBeenCalled();
    });
  });

  describe("rotate", () => {
    it("should generate new key and secret", async () => {
      const mockKey = createMockWebhookKey({ key: "iwk_old", secret: "old_secret" });
      (webhookKeyRepo.findOne as any).mockResolvedValue(mockKey);

      const result = await service.rotate(orgId, "key-1");

      expect(result.key).not.toBe("iwk_old");
      expect(result.secret).not.toBe("old_secret");
      expect(result.key).toMatch(/^iwk_/);
      expect(webhookKeyRepo.save).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove a webhook key", async () => {
      const mockKey = createMockWebhookKey();
      (webhookKeyRepo.findOne as any).mockResolvedValue(mockKey);

      await service.remove(orgId, "key-1");

      expect(webhookKeyRepo.remove).toHaveBeenCalledWith(mockKey);
    });

    it("should throw NotFoundException when key not found", async () => {
      (webhookKeyRepo.findOne as any).mockResolvedValue(null);

      await expect(service.remove(orgId, "key-999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateLastUsed", () => {
    it("should update the lastUsedAt timestamp", async () => {
      await service.updateLastUsed("key-1");

      expect(webhookKeyRepo.update).toHaveBeenCalledWith("key-1", {
        lastUsedAt: expect.any(Date),
      });
    });
  });

  describe("verifySignature", () => {
    it("should verify valid HMAC signature", () => {
      const secret = "test-secret";
      const payload = '{"title":"Test"}';
      const crypto = require("node:crypto");
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const result = service.verifySignature(secret, payload, expectedSignature);

      expect(result).toBe(true);
    });

    it("should reject invalid HMAC signature", () => {
      const secret = "test-secret";
      const payload = '{"title":"Test"}';
      const invalidSignature = "invalid-signature-hash";

      const result = service.verifySignature(secret, payload, invalidSignature);

      expect(result).toBe(false);
    });
  });
});
