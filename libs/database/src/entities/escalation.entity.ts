import { EscalationReason } from "@openspawn/shared-types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import type { Agent } from "./agent.entity";
import type { Organization } from "./organization.entity";
import type { Task } from "./task.entity";

/**
 * Tracks task escalations through the agent hierarchy
 */
@Entity("escalations")
@Index(["orgId", "taskId"])
@Index(["orgId", "fromAgentId"])
@Index(["orgId", "toAgentId"])
@Index(["orgId", "createdAt"])
export class Escalation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "task_id", type: "uuid" })
  taskId!: string;

  /** Agent the task was escalated FROM */
  @Column({ name: "from_agent_id", type: "uuid" })
  fromAgentId!: string;

  /** Agent the task was escalated TO */
  @Column({ name: "to_agent_id", type: "uuid" })
  toAgentId!: string;

  @Column({ type: "varchar", length: 50 })
  reason!: EscalationReason;

  /** How many levels up the task was escalated */
  @Column({ name: "levels_escalated", type: "smallint", default: 1 })
  levelsEscalated!: number;

  /** Optional notes about the escalation */
  @Column({ type: "text", nullable: true })
  notes!: string | null;

  /** Whether the escalation was automatic or manual */
  @Column({ name: "is_automatic", type: "boolean", default: true })
  isAutomatic!: boolean;

  /** When the escalated task was resolved (null if still open) */
  @Column({ name: "resolved_at", type: "timestamptz", nullable: true })
  resolvedAt!: Date | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Task")
  @JoinColumn({ name: "task_id" })
  task?: Task;

  @ManyToOne("Agent")
  @JoinColumn({ name: "from_agent_id" })
  fromAgent?: Agent;

  @ManyToOne("Agent")
  @JoinColumn({ name: "to_agent_id" })
  toAgent?: Agent;
}
