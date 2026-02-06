import { TaskPriority, TaskStatus } from "@openspawn/shared-types";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type { Agent } from "./agent.entity";
import type { Organization } from "./organization.entity";
import type { TaskComment } from "./task-comment.entity";
import type { TaskDependency } from "./task-dependency.entity";
import type { TaskTag } from "./task-tag.entity";

@Entity("tasks")
@Index(["orgId", "identifier"], { unique: true })
@Index(["orgId", "status"])
@Index(["orgId", "assigneeId"])
@Index(["orgId", "priority"])
@Index(["orgId", "status", "assigneeId"])
@Index(["parentTaskId"])
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ type: "varchar", length: 20 })
  identifier!: string;

  @Column({ type: "varchar", length: 500 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20, default: TaskStatus.BACKLOG })
  status!: TaskStatus;

  @Column({ type: "varchar", length: 10, default: TaskPriority.NORMAL })
  priority!: TaskPriority;

  @Column({ name: "assignee_id", type: "uuid", nullable: true })
  assigneeId!: string | null;

  @Column({ name: "creator_id", type: "uuid" })
  creatorId!: string;

  @Column({ name: "parent_task_id", type: "uuid", nullable: true })
  parentTaskId!: string | null;

  @Column({ name: "approval_required", type: "boolean", default: false })
  approvalRequired!: boolean;

  @Column({ name: "approved_by", type: "varchar", length: 255, nullable: true })
  approvedBy!: string | null;

  @Column({ name: "approved_at", type: "timestamptz", nullable: true })
  approvedAt!: Date | null;

  @Column({ name: "due_date", type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // Relations
  @ManyToOne("Organization", "tasks")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Agent", "assignedTasks")
  @JoinColumn({ name: "assignee_id" })
  assignee?: Agent;

  @ManyToOne("Agent", "createdTasks")
  @JoinColumn({ name: "creator_id" })
  creator?: Agent;

  @ManyToOne("Task", "subtasks")
  @JoinColumn({ name: "parent_task_id" })
  parentTask?: Task;

  @OneToMany("Task", "parentTask")
  subtasks?: Task[];

  @OneToMany("TaskTag", "task")
  tags?: TaskTag[];

  @OneToMany("TaskComment", "task")
  comments?: TaskComment[];

  @OneToMany("TaskDependency", "blockedTask")
  blockingDependencies?: TaskDependency[];

  @OneToMany("TaskDependency", "blockingTask")
  blockedDependencies?: TaskDependency[];
}
