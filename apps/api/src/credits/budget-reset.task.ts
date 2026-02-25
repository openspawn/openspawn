import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";

import { Agent } from "@openspawn/database";

import { EventsService } from "../events";

@Injectable()
export class BudgetResetTask {
  private readonly logger = new Logger(BudgetResetTask.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Reset budget period spent at midnight UTC daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleBudgetReset() {
    // Find agents with budget limits who have spent something
    const agents = await this.agentRepository.find({
      where: {
        budgetPeriodLimit: Not(IsNull()),
        budgetPeriodSpent: Not(0),
      },
    });

    if (agents.length === 0) {
      return;
    }

    for (const agent of agents) {
      const previousSpent = agent.budgetPeriodSpent;

      // Reset the budget
      await this.agentRepository.update(agent.id, {
        budgetPeriodSpent: 0,
      });

      // Emit event
      await this.eventsService.emit({
        orgId: agent.orgId,
        type: "credit.budget_reset",
        actorId: "system",
        entityType: "agent",
        entityId: agent.id,
        data: {
          previousSpent,
          budgetLimit: agent.budgetPeriodLimit,
        },
      });
    }

    this.logger.log(`Reset budget for ${agents.length} agents`);
  }
}
