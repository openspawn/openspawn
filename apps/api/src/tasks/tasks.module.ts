import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Organization, Task, TaskComment, TaskDependency, TaskTag } from "@openspawn/database";

import { EventsModule } from "../events";

import { TaskIdentifierService } from "./task-identifier.service";
import { TaskTransitionService } from "./task-transition.service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Task, TaskDependency, TaskTag, TaskComment]),
    EventsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskIdentifierService, TaskTransitionService],
  exports: [TasksService, TaskTransitionService],
})
export class TasksModule {}
