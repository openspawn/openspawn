import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  Agent,
  AgentCapability,
  ConsensusRequest,
  ConsensusVote,
  Escalation,
  Organization,
  Task,
  TaskComment,
  TaskDependency,
  TaskTag,
} from "@openspawn/database";

import { AgentsModule } from "../agents";
import { EventsModule } from "../events";

import { ConsensusController } from "./consensus.controller";
import { ConsensusService } from "./consensus.service";
import { EscalationsController } from "./escalations.controller";
import { EscalationService } from "./escalation.service";
import { TaskIdentifierService } from "./task-identifier.service";
import { TaskRoutingService } from "./task-routing.service";
import { TaskTemplatesController } from "./task-templates.controller";
import { TaskTemplatesService } from "./task-templates.service";
import { TaskTransitionService } from "./task-transition.service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentCapability,
      ConsensusRequest,
      ConsensusVote,
      Escalation,
      Organization,
      Task,
      TaskDependency,
      TaskTag,
      TaskComment,
    ]),
    EventsModule,
    forwardRef(() => AgentsModule),
  ],
  controllers: [
    TasksController,
    TaskTemplatesController,
    EscalationsController,
    ConsensusController,
  ],
  providers: [
    TasksService,
    TaskIdentifierService,
    TaskTransitionService,
    TaskTemplatesService,
    TaskRoutingService,
    EscalationService,
    ConsensusService,
  ],
  exports: [
    TasksService,
    TaskTransitionService,
    TaskTemplatesService,
    TaskRoutingService,
    EscalationService,
    ConsensusService,
  ],
})
export class TasksModule {}
