import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Webhook } from "@openspawn/database";
import { WebhooksController } from "./webhooks.controller";
import { DiscordWebhookController } from "./discord-webhook.controller";
import { WebhooksService } from "./webhooks.service";
import { AuthModule } from "../auth";

import { TasksModule } from "../tasks";
import { AgentsModule } from "../agents";

@Module({
  imports: [TasksModule, AgentsModule, TypeOrmModule.forFeature([Webhook]), AuthModule],
  controllers: [WebhooksController, DiscordWebhookController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
