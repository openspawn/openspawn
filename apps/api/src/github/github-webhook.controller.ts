import {
  Controller,
  Post,
  Headers,
  Body,
  RawBody,
  BadRequestException,
  Logger,
  HttpCode,
} from "@nestjs/common";
import { Public } from "../auth/decorators";
import { GitHubService } from "./github.service";

@Controller("integrations/github/webhook")
export class GitHubWebhookController {
  private readonly logger = new Logger(GitHubWebhookController.name);

  constructor(private readonly githubService: GitHubService) {}

  @Post()
  @Public()
  @HttpCode(200)
  async handleWebhook(
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Headers("x-github-event") event: string | undefined,
    @Headers("x-github-delivery") deliveryId: string | undefined,
    @Body() body: Record<string, any>,
    @RawBody() rawBody: Buffer | undefined,
  ): Promise<{ received: boolean }> {
    if (!event) {
      throw new BadRequestException("Missing X-GitHub-Event header");
    }

    if (!signature) {
      throw new BadRequestException("Missing X-Hub-Signature-256 header");
    }

    const rawPayload = rawBody?.toString("utf-8") || JSON.stringify(body);

    // Find the connection by installation ID from payload
    const installationId = String(
      body.installation?.id || body.repository?.owner?.id || "",
    );

    if (!installationId) {
      throw new BadRequestException("Cannot determine installation from payload");
    }

    const connection = await this.githubService.findByInstallationId(installationId);
    if (!connection) {
      this.logger.warn(`No connection found for installation ${installationId}`);
      throw new BadRequestException("Unknown installation");
    }

    if (!connection.enabled) {
      this.logger.debug(`Connection ${connection.id} is disabled, skipping`);
      return { received: true };
    }

    // Verify signature
    const valid = this.githubService.verifyWebhookSignature(
      rawPayload,
      signature,
      connection.webhookSecret,
    );

    if (!valid) {
      this.logger.warn(`Invalid webhook signature for delivery ${deliveryId}`);
      throw new BadRequestException("Invalid signature");
    }

    // Process the event
    await this.githubService.handleWebhookEvent(connection.orgId, event, body);

    this.logger.log(`Processed GitHub event ${event} (delivery: ${deliveryId})`);
    return { received: true };
  }
}
