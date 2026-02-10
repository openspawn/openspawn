import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as crypto from "node:crypto";

import { GitHubWebhookController } from "./github-webhook.controller";
import { GitHubService } from "./github.service";

describe("GitHubWebhookController", () => {
  let controller: GitHubWebhookController;
  let githubService: Partial<GitHubService>;

  const secret = "test-webhook-secret";

  function makeSignature(payload: string): string {
    return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  beforeEach(() => {
    vi.clearAllMocks();

    githubService = {
      findByInstallationId: vi.fn().mockResolvedValue({
        id: "conn-1",
        orgId: "org-1",
        webhookSecret: secret,
        enabled: true,
      }),
      verifyWebhookSignature: vi.fn().mockImplementation(
        (payload: string, sig: string, sec: string) => {
          const expected = "sha256=" + crypto.createHmac("sha256", sec).update(payload).digest("hex");
          return sig === expected;
        },
      ),
      handleWebhookEvent: vi.fn().mockResolvedValue(undefined),
    };

    controller = new GitHubWebhookController(githubService as GitHubService);
  });

  it("should process a valid webhook", async () => {
    const body = { action: "opened", installation: { id: 12345 }, issue: { number: 1 } };
    const rawPayload = JSON.stringify(body);
    const signature = makeSignature(rawPayload);

    const result = await controller.handleWebhook(
      signature,
      "issues",
      "delivery-1",
      body,
      Buffer.from(rawPayload),
    );

    expect(result).toEqual({ received: true });
    expect(githubService.handleWebhookEvent).toHaveBeenCalledWith("org-1", "issues", body);
  });

  it("should reject missing event header", async () => {
    await expect(
      controller.handleWebhook("sig", undefined, "del-1", {}, undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it("should reject missing signature header", async () => {
    await expect(
      controller.handleWebhook(undefined, "issues", "del-1", {}, undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it("should reject unknown installation", async () => {
    (githubService.findByInstallationId as any).mockResolvedValue(null);

    const body = { installation: { id: 99999 } };
    await expect(
      controller.handleWebhook("sha256=fake", "issues", "del-1", body, Buffer.from(JSON.stringify(body))),
    ).rejects.toThrow(BadRequestException);
  });

  it("should reject invalid signature", async () => {
    const body = { action: "opened", installation: { id: 12345 } };
    const rawPayload = JSON.stringify(body);

    await expect(
      controller.handleWebhook("sha256=invalidsig", "issues", "del-1", body, Buffer.from(rawPayload)),
    ).rejects.toThrow(BadRequestException);
  });

  it("should skip disabled connections", async () => {
    (githubService.findByInstallationId as any).mockResolvedValue({
      id: "conn-1",
      orgId: "org-1",
      webhookSecret: secret,
      enabled: false,
    });

    const body = { installation: { id: 12345 } };
    const rawPayload = JSON.stringify(body);

    const result = await controller.handleWebhook(
      makeSignature(rawPayload),
      "issues",
      "del-1",
      body,
      Buffer.from(rawPayload),
    );

    expect(result).toEqual({ received: true });
    expect(githubService.handleWebhookEvent).not.toHaveBeenCalled();
  });
});
