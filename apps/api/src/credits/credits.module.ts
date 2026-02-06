import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Agent, CreditRateConfig, CreditTransaction, Task } from "@openspawn/database";

import { EventsModule } from "../events";

import { BudgetResetTask } from "./budget-reset.task";
import { CreditEarningService } from "./credit-earning.service";
import { CreditsController } from "./credits.controller";
import { CreditsService } from "./credits.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, CreditTransaction, CreditRateConfig, Task]),
    EventsModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService, CreditEarningService, BudgetResetTask],
  exports: [CreditsService],
})
export class CreditsModule {}
