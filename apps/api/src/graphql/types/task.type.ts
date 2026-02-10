import { Field, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { AgentType } from "./agent.type";

// Register enums
registerEnumType(TaskStatus, { name: "TaskStatus" });
registerEnumType(TaskPriority, { name: "TaskPriority" });

@ObjectType({ description: "Rejection metadata when a task completion is rejected by a pre-hook" })
export class TaskRejectionType {
  @Field(() => String, { description: "Feedback explaining why completion was rejected" })
  feedback!: string;

  @Field(() => Date, { description: "When the rejection occurred" })
  rejectedAt!: Date;

  @Field(() => String, { description: "Who/what rejected the completion (webhook names)" })
  rejectedBy!: string;

  @Field(() => Int, { description: "How many times this task has been rejected" })
  rejectionCount!: number;
}

@ObjectType({ description: "Result of a claimNextTask mutation" })
export class ClaimTaskResultType {
  @Field(() => Boolean, { description: "Whether the claim was successful" })
  success!: boolean;

  @Field(() => String, { nullable: true, description: "Message describing the result (present on failure)" })
  message?: string | null;

  @Field(() => TaskType, { nullable: true, description: "The claimed task, if successful" })
  task?: TaskType | null;
}

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

  @Field(() => TaskRejectionType, { nullable: true, description: "Present when task completion was rejected" })
  rejection?: TaskRejectionType | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
