import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Agent, AgentCapability, Organization, Task, TaskComment, TaskDependency, TaskTag } from "@openspawn/database";

import { AgentsModule } from "../agents";
import { EventsModule } from "../events";

import { TaskIdentifierService } from "./task-identifier.service";
import { TaskRoutingService } from "./task-routing.service";
import { TaskTemplatesService } from "./task-templates.service";
import { TaskTransitionService } from "./task-transition.service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentCapability,
      Organization,
      Task,
      TaskDependency,
      TaskTag,
      TaskComment,
    ]),
    EventsModule,
    forwardRef(() => AgentsModule),
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskIdentifierService,
    TaskTransitionService,
    TaskTemplatesService,
    TaskRoutingService,
  ],
  exports: [TasksService, TaskTransitionService, TaskTemplatesService, TaskRoutingService],
})
export class TasksModule {}
