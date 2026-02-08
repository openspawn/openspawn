import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  Agent,
  AgentCapability,
  CreditTransaction,
  ReputationEvent,
} from "@openspawn/database";

import { EventsModule } from "../events";

import { AgentsController } from "./agents.controller";
import { AgentsService } from "./agents.service";
import { AgentOnboardingService } from "./agent-onboarding.service";
import { AgentBudgetService } from "./agent-budget.service";
import { AgentCapabilitiesService } from "./agent-capabilities.service";
import { TrustService } from "./trust.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentCapability,
      CreditTransaction,
      ReputationEvent,
    ]),
    EventsModule,
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    AgentOnboardingService,
    AgentBudgetService,
    AgentCapabilitiesService,
    TrustService,
  ],
  exports: [
    AgentsService,
    AgentOnboardingService,
    AgentBudgetService,
    AgentCapabilitiesService,
    TrustService,
    TypeOrmModule,
  ],
})
export class AgentsModule {}
