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
@Index(["taskId", "dependsOnId"], { unique: true })
@Index(["taskId"])
@Index(["dependsOnId"])
export class TaskDependency {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "task_id", type: "uuid" })
  taskId!: string;

  @Column({ name: "depends_on_id", type: "uuid" })
  dependsOnId!: string;

  @Column({ name: "blocking", type: "boolean", default: true })
  blocking!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Task", "dependencies")
  @JoinColumn({ name: "task_id" })
  task?: Task;

  @ManyToOne("Task", "dependents")
  @JoinColumn({ name: "depends_on_id" })
  dependsOn?: Task;
}
