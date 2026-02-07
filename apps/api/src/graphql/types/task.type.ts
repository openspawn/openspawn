import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { AgentType } from "./agent.type";

// Register enums
registerEnumType(TaskStatus, { name: "TaskStatus" });
registerEnumType(TaskPriority, { name: "TaskPriority" });

@ObjectType()
export class TaskType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  identifier!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => TaskStatus)
  status!: TaskStatus;

  @Field(() => TaskPriority)
  priority!: TaskPriority;

  @Field(() => ID, { nullable: true })
  assigneeId?: string | null;

  @Field(() => AgentType, { nullable: true })
  assignee?: AgentType | null;

  @Field(() => ID)
  creatorId!: string;

  @Field(() => ID, { nullable: true })
  parentTaskId?: string | null;

  @Field(() => Boolean)
  approvalRequired!: boolean;

  @Field(() => Date, { nullable: true })
  approvedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  dueDate?: Date | null;

  @Field(() => Date, { nullable: true })
  completedAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
