import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Agent, AgentCapability } from "@openspawn/database";

import { EventsModule } from "../events";

import { AgentsController } from "./agents.controller";
import { AgentsService } from "./agents.service";

@Module({
  imports: [TypeOrmModule.forFeature([Agent, AgentCapability]), EventsModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
