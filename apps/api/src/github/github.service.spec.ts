import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as crypto from "node:crypto";

import { GitHubConnection } from "@openspawn/database";

import { GitHubService } from "./github.service";
import { IntegrationLinkService } from "./integration-link.service";

describe("GitHubService", () => {
  let service: GitHubService;
  let connectionRepo: Partial<Repository<GitHubConnection>>;
  let linkService: Partial<IntegrationLinkService>;

  const orgId = "org-123";

  beforeEach(() => {
    vi.clearAllMocks();

    connectionRepo = {
      create: vi.fn().mockImplementation((data) => data),
      save: vi.fn().mockImplementation((data) => Promise.resolve({ id: "conn-1", ...data })),
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
      remove: vi.fn(),
    };

    linkService = {
      createLink: vi.fn().mockResolvedValue({ id: "link-1" }),
      findBySource: vi.fn().mockResolvedValue(null),
      findByTarget: vi.fn().mockResolvedValue([]),
      findByOrg: vi.fn().mockResolvedValue([]),
    };

    service = new GitHubService(
      connectionRepo as Repository<GitHubConnection>,
      linkService as IntegrationLinkService,
    );
  });

  describe("verifyWebhookSignature", () => {
    it("should return true for a valid signature", () => {
      const secret = "test-secret";
      const payload = '{"action":"opened"}';
      const expected =
        "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");

      expect(service.verifyWebhookSignature(payload, expected, secret)).toBe(true);
    });

    it("should return false for an invalid signature", () => {
      expect(
        service.verifyWebhookSignature('{"action":"opened"}', "sha256=invalid", "secret"),
      ).toBe(false);
    });

    it("should return false for mismatched length signatures", () => {
      expect(service.verifyWebhookSignature("payload", "sha256=short", "secret")).toBe(false);
    });
  });

  describe("handleWebhookEvent - issues", () => {
    it("should create a link when issue opened with agent-work label", async () => {
      await service.handleWebhookEvent(orgId, "issues", {
        action: "opened",
        issue: {
          number: 42,
          title: "Fix auth bug",
          body: "Details here",
          html_url: "https://github.com/test/repo/issues/42",
          labels: [{ name: "agent-work" }, { name: "bug" }],
        },
        repository: { full_name: "test/repo" },
      });

      expect(linkService.findBySource).toHaveBeenCalledWith(orgId, "github_issue", "42");
      expect(linkService.createLink).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          provider: "github",
          sourceType: "github_issue",
          sourceId: "42",
          targetType: "task",
        }),
      );
    });

    it("should NOT create a link when issue lacks agent-work label", async () => {
      await service.handleWebhookEvent(orgId, "issues", {
        action: "opened",
        issue: {
          number: 43,
          title: "Some issue",
          labels: [{ name: "enhancement" }],
        },
        repository: { full_name: "test/repo" },
      });

      expect(linkService.createLink).not.toHaveBeenCalled();
    });

    it("should not duplicate link if one already exists", async () => {
      (linkService.findBySource as any).mockResolvedValue({ id: "existing" });

      await service.handleWebhookEvent(orgId, "issues", {
        action: "opened",
        issue: {
          number: 42,
          title: "Fix auth bug",
          labels: [{ name: "agent-work" }],
        },
        repository: { full_name: "test/repo" },
      });

      expect(linkService.createLink).not.toHaveBeenCalled();
    });
  });

  describe("handleWebhookEvent - pull_request", () => {
    it("should create a link when PR is opened", async () => {
      await service.handleWebhookEvent(orgId, "pull_request", {
        action: "opened",
        pull_request: {
          number: 87,
          title: "Add rate limiting",
          body: "This PR adds...",
          html_url: "https://github.com/test/repo/pull/87",
          user: { login: "developer" },
        },
        repository: { full_name: "test/repo" },
      });

      expect(linkService.createLink).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: "github_pr",
          sourceId: "87",
        }),
      );
    });

    it("should ignore non-opened PR actions", async () => {
      await service.handleWebhookEvent(orgId, "pull_request", {
        action: "closed",
        pull_request: { number: 87 },
      });

      expect(linkService.createLink).not.toHaveBeenCalled();
    });
  });

  describe("handleWebhookEvent - check_suite", () => {
    it("should create a fix task when check suite fails", async () => {
      await service.handleWebhookEvent(orgId, "check_suite", {
        action: "completed",
        check_suite: {
          id: 999,
          conclusion: "failure",
          head_branch: "main",
        },
        repository: { full_name: "test/repo" },
      });

      expect(linkService.createLink).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: "check-999",
          metadata: expect.objectContaining({ conclusion: "failure" }),
        }),
      );
    });

    it("should ignore successful check suites", async () => {
      await service.handleWebhookEvent(orgId, "check_suite", {
        action: "completed",
        check_suite: { id: 999, conclusion: "success" },
      });

      expect(linkService.createLink).not.toHaveBeenCalled();
    });
  });

  describe("handleWebhookEvent - issue_comment", () => {
    it("should create a comment link when issue has existing link", async () => {
      (linkService.findBySource as any).mockResolvedValue({ id: "existing-link" });

      await service.handleWebhookEvent(orgId, "issue_comment", {
        action: "created",
        comment: {
          id: 555,
          body: "Great progress!",
          user: { login: "reviewer" },
          html_url: "https://github.com/test/repo/issues/42#comment-555",
        },
        issue: { number: 42 },
      });

      expect(linkService.createLink).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: "github_comment",
          sourceId: "555",
          targetType: "message",
        }),
      );
    });
  });

  describe("connection CRUD", () => {
    it("should create a connection with webhook secret", async () => {
      const result = await service.create(orgId, {
        name: "test/repo",
        installationId: "12345",
      });

      expect(connectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          name: "test/repo",
          installationId: "12345",
        }),
      );
      expect(connectionRepo.save).toHaveBeenCalled();
    });
  });

  describe("outbound sync event listeners", () => {
    it("should call syncOutbound when task completed with existing link", async () => {
      const mockLink = { id: "link-1", provider: "github" };
      (linkService.findByTarget as any).mockResolvedValue([mockLink]);

      const syncSpy = vi.spyOn(service, "syncOutbound").mockResolvedValue();
      await service.onTaskCompleted({ orgId, taskId: "task-1" });

      expect(syncSpy).toHaveBeenCalledWith(orgId, "task.completed", { taskId: "task-1" });
    });

    it("should not sync when no links exist", async () => {
      (linkService.findByTarget as any).mockResolvedValue([]);

      const syncSpy = vi.spyOn(service, "syncOutbound").mockResolvedValue();
      await service.onTaskCompleted({ orgId, taskId: "task-1" });

      expect(syncSpy).not.toHaveBeenCalled();
    });
  });
});
