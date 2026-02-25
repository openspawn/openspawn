import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GitHubConnection, IntegrationLink } from "@openspawn/database";
import { GitHubController } from "./github.controller";
import { GitHubWebhookController } from "./github-webhook.controller";
import { GitHubService } from "./github.service";
import { IntegrationLinkService } from "./integration-link.service";
import { AuthModule } from "../auth";

@Module({
  imports: [
    TypeOrmModule.forFeature([GitHubConnection, IntegrationLink]),
    AuthModule,
  ],
  controllers: [GitHubController, GitHubWebhookController],
  providers: [GitHubService, IntegrationLinkService],
  exports: [GitHubService, IntegrationLinkService],
})
export class GitHubModule {}
