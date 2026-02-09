import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { Webhook } from "@openspawn/database";

import { WebhooksService, type PreHookResult } from "./webhooks.service";

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock dns.lookup to return external IPs
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]),
}));

describe("WebhooksService", () => {
  let service: WebhooksService;
  let webhookRepo: Partial<Repository<Webhook>>;
  let eventEmitter: Partial<EventEmitter2>;

  // Test fixtures
  const orgId = "org-123";

  const createMockWebhook = (overrides: Partial<Webhook> = {}): Webhook =>
    ({
      id: "webhook-1",
      orgId,
      name: "Test Hook",
      url: "https://api.external-service.com/hook",
      secret: "test-secret",
      events: ["task.complete"],
      enabled: true,
      hookType: "pre",
      canBlock: true,
      timeoutMs: 5000,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Webhook;

  beforeEach(() => {
    vi.clearAllMocks();

    webhookRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((data) => data as Webhook),
      save: vi.fn().mockImplementation((data) => Promise.resolve(data as Webhook)),
      update: vi.fn(),
      delete: vi.fn(),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    service = new WebhooksService(
      webhookRepo as Repository<Webhook>,
      eventEmitter as EventEmitter2,
    );
  });

  describe("Webhook Entity Fields", () => {
    it("should have hookType field with pre/post values", () => {
      const preHook = createMockWebhook({ hookType: "pre" });
      const postHook = createMockWebhook({ hookType: "post" });

      expect(preHook.hookType).toBe("pre");
      expect(postHook.hookType).toBe("post");
    });

    it("should have canBlock field", () => {
      const blockingHook = createMockWebhook({ canBlock: true });
      const nonBlockingHook = createMockWebhook({ canBlock: false });

      expect(blockingHook.canBlock).toBe(true);
      expect(nonBlockingHook.canBlock).toBe(false);
    });

    it("should have timeoutMs field with default value", () => {
      const hook = createMockWebhook({ timeoutMs: 3000 });
      const defaultHook = createMockWebhook({});

      expect(hook.timeoutMs).toBe(3000);
      expect(defaultHook.timeoutMs).toBe(5000);
    });
  });

  describe("executePreHooks", () => {
    it("should return allow:true when no pre-hooks exist", async () => {
      (webhookRepo.find as Mock).mockResolvedValue([]);

      const result = await service.executePreHooks(orgId, "task.complete", {
        taskId: "task-1",
      });

      expect(result.allow).toBe(true);
      expect(result.executionTimeMs).toBeDefined();
    });

    it("should return allow:true when all hooks pass", async () => {
      const hooks = [
        createMockWebhook({ id: "hook-1", name: "Hook 1", canBlock: true }),
        createMockWebhook({ id: "hook-2", name: "Hook 2", canBlock: true }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      // All hooks return allow: true
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allow: true }),
      });

      const result = await service.executePreHooks(orgId, "task.complete", {
        taskId: "task-1",
      });

      expect(result.allow).toBe(true);
      expect(result.blockedBy).toBeUndefined();
    });

    it("should return allow:false when any blocking hook denies", async () => {
      const hooks = [
        createMockWebhook({
          id: "hook-1",
          name: "Quality Check",
          url: "https://api.quality-check.com/hook",
          canBlock: true,
        }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      // Single blocking hook that denies
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allow: false, reason: "Quality check failed" }),
      });

      const result = await service.executePreHooks(orgId, "task.complete", {
        taskId: "task-1",
      });

      expect(result.allow).toBe(false);
      expect(result.blockedBy).toContain("Quality Check");
      expect(result.reason).toContain("Quality check failed");
    });

    it("should ignore non-blocking hooks returning allow:false", async () => {
      const hooks = [
        createMockWebhook({
          id: "hook-1",
          name: "Advisory Hook",
          canBlock: false,
        }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      // Hook returns allow: false but canBlock is false
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allow: false, reason: "Just a warning" }),
      });

      const result = await service.executePreHooks(orgId, "task.complete", {
        taskId: "task-1",
      });

      // Should allow since hook is not blocking
      expect(result.allow).toBe(true);
    });

    it("should execute hooks in parallel", async () => {
      const hooks = [
        createMockWebhook({ id: "hook-1", name: "Hook 1", url: "https://api.hook1.com/hook" }),
        createMockWebhook({ id: "hook-2", name: "Hook 2", url: "https://api.hook2.com/hook" }),
        createMockWebhook({ id: "hook-3", name: "Hook 3", url: "https://api.hook3.com/hook" }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      let callCount = 0;

      mockFetch.mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          ok: true,
          json: () => Promise.resolve({ allow: true }),
        };
      });

      const start = Date.now();
      await service.executePreHooks(orgId, "task.complete", { taskId: "task-1" });
      const elapsed = Date.now() - start;

      // If sequential, would take ~90ms (3 * 30ms)
      // If parallel, should take ~30ms (+ overhead)
      expect(elapsed).toBeLessThan(80); // Allow overhead but well under sequential time
      expect(callCount).toBe(3);
    });

    it("should handle timeout correctly", async () => {
      const hooks = [
        createMockWebhook({
          id: "hook-1",
          name: "Slow Hook",
          url: "https://api.slow.com/hook",
          timeoutMs: 50,
          canBlock: true,
        }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      // Simulate a timeout error (AbortSignal.timeout throws AbortError)
      mockFetch.mockReset();
      mockFetch.mockRejectedValue(new DOMException("Timeout", "TimeoutError"));

      const result = await service.executePreHooks(orgId, "task.complete", {
        taskId: "task-1",
      });

      // On timeout failure, should fail-open (allow: true)
      expect(result.allow).toBe(true);

      // Should have updated failure count
      expect(webhookRepo.update).toHaveBeenCalledWith(
        "hook-1",
        expect.objectContaining({ failureCount: 1 }),
      );
    });

    it("should filter hooks by event type", async () => {
      const hooks = [
        createMockWebhook({
          id: "hook-1",
          name: "Task Complete Hook",
          url: "https://api.complete.com/hook",
          events: ["task.complete"],
        }),
        createMockWebhook({
          id: "hook-2",
          name: "Task Create Hook",
          url: "https://api.create.com/hook",
          events: ["task.create"],
        }),
        createMockWebhook({
          id: "hook-3",
          name: "Wildcard Hook",
          url: "https://api.wildcard.com/hook",
          events: ["*"],
        }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      // Reset and create fresh mock
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allow: true }),
      });

      await service.executePreHooks(orgId, "task.complete", { taskId: "task-1" });

      // Should only call hook-1 and hook-3 (matches task.complete or wildcard)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle HTTP errors gracefully (fail-open)", async () => {
      const hooks = [
        createMockWebhook({ id: "hook-1", name: "Failing Hook", canBlock: true }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await service.executePreHooks(orgId, "task.complete", {
        taskId: "task-1",
      });

      // Should fail-open on HTTP errors
      expect(result.allow).toBe(true);
    });

    it("should emit webhook.executed event for each hook", async () => {
      const hooks = [
        createMockWebhook({
          id: "hook-1",
          name: "Hook 1",
          url: "https://api.hook1.com/hook",
        }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ allow: true }),
      });

      await service.executePreHooks(orgId, "task.complete", { taskId: "task-1" });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "webhook.executed",
        expect.objectContaining({
          webhookId: "hook-1",
          webhookName: "Hook 1",
          orgId,
          eventType: "task.complete",
          hookType: "pre",
          success: true,
        }),
      );
    });

    it("should include blocking info in execution event when blocked", async () => {
      const hooks = [
        createMockWebhook({
          id: "hook-1",
          name: "Blocking Hook",
          url: "https://api.blocking.com/hook",
          canBlock: true,
        }),
      ];
      (webhookRepo.find as Mock).mockResolvedValue(hooks);

      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ allow: false, reason: "Not ready for completion" }),
      });

      await service.executePreHooks(orgId, "task.complete", { taskId: "task-1" });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "webhook.executed",
        expect.objectContaining({
          blocked: true,
          reason: "Not ready for completion",
        }),
      );
    });
  });

  describe("create", () => {
    it("should create webhook with pre-hook fields", async () => {
      (webhookRepo.save as Mock).mockImplementation((data) =>
        Promise.resolve({ ...data, id: "new-webhook-id" }),
      );

      await service.create(orgId, {
        name: "Pre-Hook Validator",
        url: "https://api.validator.com/validate",
        events: ["task.complete"],
        hookType: "pre",
        canBlock: true,
        timeoutMs: 3000,
      });

      expect(webhookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          name: "Pre-Hook Validator",
          hookType: "pre",
          canBlock: true,
          timeoutMs: 3000,
        }),
      );
    });

    it("should default to post hook if hookType not specified", async () => {
      (webhookRepo.save as Mock).mockImplementation((data) =>
        Promise.resolve({ ...data, id: "new-webhook-id" }),
      );

      await service.create(orgId, {
        name: "Default Hook",
        url: "https://api.default.com/hook",
        events: ["task.created"],
      });

      expect(webhookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hookType: "post",
          canBlock: false,
          timeoutMs: 5000,
        }),
      );
    });
  });
});
