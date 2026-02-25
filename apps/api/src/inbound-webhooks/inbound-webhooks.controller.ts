import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { InboundWebhooksService } from "./inbound-webhooks.service";
import { CreateInboundWebhookKeyDto } from "./dto/create-inbound-webhook-key.dto";
import { UpdateInboundWebhookKeyDto } from "./dto/update-inbound-webhook-key.dto";
import { InboundWebhookKey } from "@openspawn/database";

@Controller("inbound-webhooks")
@UseGuards(AuthGuard)
export class InboundWebhooksController {
  constructor(private readonly inboundWebhooksService: InboundWebhooksService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body() dto: CreateInboundWebhookKeyDto,
  ): Promise<InboundWebhookKey> {
    const orgId = req.user.orgId;
    return this.inboundWebhooksService.create(orgId, dto);
  }

  @Get()
  async findAll(@Request() req: any): Promise<InboundWebhookKey[]> {
    const orgId = req.user.orgId;
    return this.inboundWebhooksService.findAll(orgId);
  }

  @Get(":id")
  async findOne(
    @Request() req: any,
    @Param("id") id: string,
  ): Promise<InboundWebhookKey> {
    const orgId = req.user.orgId;
    return this.inboundWebhooksService.findOne(orgId, id);
  }

  @Patch(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateInboundWebhookKeyDto,
  ): Promise<InboundWebhookKey> {
    const orgId = req.user.orgId;
    return this.inboundWebhooksService.update(orgId, id, dto);
  }

  @Post(":id/rotate")
  async rotate(
    @Request() req: any,
    @Param("id") id: string,
  ): Promise<InboundWebhookKey> {
    const orgId = req.user.orgId;
    return this.inboundWebhooksService.rotate(orgId, id);
  }

  @Delete(":id")
  async remove(@Request() req: any, @Param("id") id: string): Promise<void> {
    const orgId = req.user.orgId;
    return this.inboundWebhooksService.remove(orgId, id);
  }
}
