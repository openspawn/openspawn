import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Agent, AgentCapability, CreditTransaction } from "@openspawn/database";

import { EventsModule } from "../events";

import { AgentsController } from "./agents.controller";
import { AgentsService } from "./agents.service";
import { AgentOnboardingService } from "./agent-onboarding.service";
import { AgentBudgetService } from "./agent-budget.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AgentCapability, CreditTransaction]),
    EventsModule,
  ],
  controllers: [AgentsController],
  providers: [AgentsService, AgentOnboardingService, AgentBudgetService],
  exports: [AgentsService, AgentOnboardingService, AgentBudgetService, TypeOrmModule],
})
export class AgentsModule {}
