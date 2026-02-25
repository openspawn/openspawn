import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { WebhooksService } from "./webhooks.service";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { JwtAuthGuard, CurrentUser, type JwtUser } from "../auth";

@Controller("webhooks")
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(user.orgId, dto);
  }

  @Get()
  async list(@CurrentUser() user: JwtUser) {
    return this.webhooksService.findByOrg(user.orgId);
  }

  @Get(":id")
  async get(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    const webhook = await this.webhooksService.findById(user.orgId, id);
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }
    return webhook;
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const webhook = await this.webhooksService.update(user.orgId, id, dto);
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }
    return webhook;
  }

  @Delete(":id")
  async delete(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    const deleted = await this.webhooksService.delete(user.orgId, id);
    if (!deleted) {
      throw new NotFoundException("Webhook not found");
    }
    return { success: true };
  }

  @Post(":id/test")
  async test(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.webhooksService.sendTestEvent(user.orgId, id);
  }
}
