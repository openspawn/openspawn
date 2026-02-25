import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LinearConnection, IntegrationLink } from "@openspawn/database";
import { LinearController } from "./linear.controller";
import { LinearWebhookController } from "./linear-webhook.controller";
import { LinearService } from "./linear.service";
import { IntegrationLinkService } from "../github/integration-link.service";
import { AuthModule } from "../auth";

@Module({
  imports: [
    TypeOrmModule.forFeature([LinearConnection, IntegrationLink]),
    AuthModule,
  ],
  controllers: [LinearController, LinearWebhookController],
  providers: [LinearService, IntegrationLinkService],
  exports: [LinearService, IntegrationLinkService],
})
export class LinearModule {}
