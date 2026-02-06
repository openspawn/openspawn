import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import type { Organization } from "./organization.entity";
import type { Task } from "./task.entity";

@Entity("task_dependencies")
@Index(["blockingTaskId", "blockedTaskId"], { unique: true })
@Index(["blockedTaskId"])
@Index(["blockingTaskId"])
export class TaskDependency {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "blocking_task_id", type: "uuid" })
  blockingTaskId!: string;

  @Column({ name: "blocked_task_id", type: "uuid" })
  blockedTaskId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Task", "blockedDependencies")
  @JoinColumn({ name: "blocking_task_id" })
  blockingTask?: Task;

  @ManyToOne("Task", "blockingDependencies")
  @JoinColumn({ name: "blocked_task_id" })
  blockedTask?: Task;
}
