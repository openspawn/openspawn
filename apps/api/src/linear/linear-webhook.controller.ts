import { Controller, Post, Body, Headers, RawBodyRequest, Req, BadRequestException, Logger } from "@nestjs/common";
import { Request } from "express";
import { LinearService } from "./linear.service";

@Controller("linear/webhook")
export class LinearWebhookController {
  private readonly logger = new Logger(LinearWebhookController.name);
  constructor(private readonly linearService: LinearService) {}

  @Post()
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers("linear-signature") signature: string | undefined, @Body() body: any) {
    if (!signature) throw new BadRequestException("Missing linear-signature header");
    const teamId = body?.data?.team?.id || body?.data?.issue?.team?.id;
    if (!teamId) throw new BadRequestException("Missing team ID in webhook payload");
    const connection = await this.linearService.findByTeamId(teamId);
    if (!connection) throw new BadRequestException(`No connection found for team \${teamId}`);
    if (!connection.enabled) {
      this.logger.warn(`Webhook received for disabled connection \${connection.id}`);
      return { status: "ignored", reason: "connection_disabled" };
    }
    const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(body);
    const isValid = this.linearService.verifyWebhookSignature(rawBody, signature, connection.webhookSecret);
    if (!isValid) throw new BadRequestException("Invalid webhook signature");
    const event = body.type;
    await this.linearService.handleWebhookEvent(connection.orgId, event, body);
    return { status: "ok" };
  }
}
