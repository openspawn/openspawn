import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";

import { entities } from "@openspawn/database";

import { AgentsModule } from "../agents";
import { AuthModule } from "../auth";
import { CommonModule } from "../common/common.module";
import { OrgScopeMiddleware } from "../common/middleware/org-scope.middleware";
import { EventsModule } from "../events";
import { TasksModule } from "../tasks";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OrgScopeMiddleware).forRoutes("*");
  }
}
