import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";

import { entities } from "@openspawn/database";

import { AgentsModule } from "../agents";
import { AuthModule } from "../auth";
import { CommonModule } from "../common/common.module";
import { OrgScopeMiddleware } from "../common/middleware/org-scope.middleware";
import { CreditsModule } from "../credits";
import { EventsModule } from "../events";
import { GraphqlModule } from "../graphql";
import { MessagesModule } from "../messages";
import { TasksModule } from "../tasks";
import { WebhooksModule } from "../webhooks";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env["THROTTLE_TTL"] || "60000", 10),
        limit: parseInt(process.env["THROTTLE_LIMIT"] || "100", 10),
      },
    ]),

    // Database
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env["DATABASE_URL"],
      entities,
      synchronize: false,
      logging: process.env["NODE_ENV"] === "development",
    }),

    // Event Emitter for real-time events
    EventEmitterModule.forRoot(),

    // Core modules
    CommonModule,
    AuthModule,
    EventsModule,

    // Domain modules
    AgentsModule,
    TasksModule,
    CreditsModule,
    MessagesModule,
    WebhooksModule,

    // GraphQL
    GraphqlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OrgScopeMiddleware).forRoutes("*");
  }
}
