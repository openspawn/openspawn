import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent, CreditRateConfig, Task } from "@openspawn/database";
import { CreditType, TaskStatus } from "@openspawn/shared-types";

import { CreditsService } from "./credits.service";

interface TaskTransitionedEvent {
  task: Task;
  from: TaskStatus;
  to: TaskStatus;
  actorId: string;
}

@Injectable()
export class CreditEarningService {
  private readonly logger = new Logger(CreditEarningService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(CreditRateConfig)
    private readonly rateConfigRepository: Repository<CreditRateConfig>,
    private readonly creditsService: CreditsService,
  ) {}

  @OnEvent("task.transitioned")
  async handleTaskTransitioned(event: TaskTransitionedEvent) {
    const { task, to } = event;

    // Only award credits when task is completed
    if (to !== TaskStatus.DONE) {
      return;
    }

    if (!task.assigneeId) {
      this.logger.warn(`Task ${task.identifier} completed without assignee`);
      return;
    }

    try {
      // Get rate config for task completion
      const rateConfig = await this.rateConfigRepository.findOne({
        where: { orgId: task.orgId, triggerType: "task.done", direction: CreditType.CREDIT },
      });

      const baseCredits = rateConfig?.amount ?? 10;

      // Award credits to assignee
      await this.creditsService.earn({
        orgId: task.orgId,
        agentId: task.assigneeId,
        amount: baseCredits,
        reason: `Task completed: ${task.identifier}`,
        triggerType: "task.done",
        sourceTaskId: task.id,
      });

      this.logger.log(
        `Awarded ${baseCredits} credits to ${task.assigneeId} for ${task.identifier}`,
      );

      // Check for management fee
      if (task.creatorId && task.creatorId !== task.assigneeId) {
        const creator = await this.agentRepository.findOne({
          where: { id: task.creatorId },
        });

        if (creator && creator.managementFeePct > 0) {
          const fee = Math.floor((baseCredits * creator.managementFeePct) / 100);

          if (fee > 0) {
            await this.creditsService.earn({
              orgId: task.orgId,
              agentId: creator.id,
              amount: fee,
              reason: `Management fee: ${task.identifier}`,
              triggerType: "management_fee",
              sourceTaskId: task.id,
            });

            this.logger.log(
              `Awarded ${fee} management fee to ${creator.id} for ${task.identifier}`,
            );
          }
        }

        // Award delegation credits
        const delegationConfig = await this.rateConfigRepository.findOne({
          where: { orgId: task.orgId, triggerType: "task.delegated", direction: CreditType.CREDIT },
        });

        if (delegationConfig && delegationConfig.amount !== null && delegationConfig.amount > 0) {
          await this.creditsService.earn({
            orgId: task.orgId,
            agentId: task.creatorId,
            amount: delegationConfig.amount,
            reason: `Task delegated: ${task.identifier}`,
            triggerType: "task.delegated",
            sourceTaskId: task.id,
          });

          this.logger.log(
            `Awarded ${delegationConfig.amount} delegation credits to ${task.creatorId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process credit earning for task ${task.id}`, error);
    }
  }
}
