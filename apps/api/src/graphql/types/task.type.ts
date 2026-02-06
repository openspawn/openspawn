import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

// Register enums
registerEnumType(TaskStatus, { name: "TaskStatus" });
registerEnumType(TaskPriority, { name: "TaskPriority" });

@ObjectType()
export class TaskType {
  @Field(() => ID)
  id!: string;

  @Field()
  identifier!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => TaskStatus)
  status!: TaskStatus;

  @Field(() => TaskPriority)
  priority!: TaskPriority;

  @Field(() => ID, { nullable: true })
  assigneeId?: string | null;

  @Field(() => ID)
  creatorId!: string;

  @Field(() => ID, { nullable: true })
  parentTaskId?: string | null;

  @Field()
  approvalRequired!: boolean;

  @Field({ nullable: true })
  approvedAt?: Date | null;

  @Field({ nullable: true })
  dueDate?: Date | null;

  @Field({ nullable: true })
  completedAt?: Date | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
