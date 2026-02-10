import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { InboundWebhookKey } from "@openspawn/database";

import { InboundWebhooksService } from "./inbound-webhooks.service";
import { InboundWebhooksController } from "./inbound-webhooks.controller";
import { InboundWebhookReceiverController } from "./inbound-webhook-receiver.controller";
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [TypeOrmModule.forFeature([InboundWebhookKey]), TasksModule],
  controllers: [InboundWebhooksController, InboundWebhookReceiverController],
  providers: [InboundWebhooksService],
  exports: [InboundWebhooksService],
})
export class InboundWebhooksModule {}
