import { AgentRole, AgentStatus } from "@openspawn/shared-types";
import {
  Check,
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

import type { AgentCapability } from "./agent-capability.entity";
import type { Organization } from "./organization.entity";
import type { Task } from "./task.entity";

@Entity("agents")
@Index(["orgId", "agentId"], { unique: true })
@Index(["orgId", "status"])
@Index(["orgId", "role"])
@Check('"level" >= 1 AND "level" <= 10')
@Check('"management_fee_pct" >= 0 AND "management_fee_pct" <= 50')
export class Agent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "agent_id", type: "varchar", length: 100 })
  agentId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "smallint", default: 1 })
  level!: number;

  @Column({ type: "varchar", length: 100, default: "sonnet" })
  model!: string;

  @Column({ type: "varchar", length: 20, default: AgentStatus.ACTIVE })
  status!: AgentStatus;

  @Column({ type: "varchar", length: 50, default: AgentRole.WORKER })
  role!: AgentRole;

  @Column({ name: "management_fee_pct", type: "smallint", default: 0 })
  managementFeePct!: number;

  @Column({ name: "current_balance", type: "int", default: 0 })
  currentBalance!: number;

  @Column({ name: "budget_period_limit", type: "int", nullable: true })
  budgetPeriodLimit!: number | null;

  @Column({ name: "budget_period_spent", type: "int", default: 0 })
  budgetPeriodSpent!: number;

  @Column({ name: "budget_period_start", type: "timestamptz", nullable: true })
  budgetPeriodStart!: Date | null;

  @Column({ name: "hmac_secret_enc", type: "bytea" })
  hmacSecretEnc!: Buffer;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId!: string | null;

  @Column({ name: "max_children", type: "smallint", default: 0 })
  maxChildren!: number;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  // Trust & Reputation fields
  @Column({ name: "trust_score", type: "smallint", default: 50 })
  trustScore!: number;

  @Column({ name: "tasks_completed", type: "int", default: 0 })
  tasksCompleted!: number;

  @Column({ name: "tasks_successful", type: "int", default: 0 })
  tasksSuccessful!: number;

  @Column({ name: "last_activity_at", type: "timestamptz", nullable: true })
  lastActivityAt!: Date | null;

  @Column({ name: "last_promotion_at", type: "timestamptz", nullable: true })
  lastPromotionAt!: Date | null;

  @Column({ name: "lifetime_earnings", type: "int", default: 0 })
  lifetimeEarnings!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  domain!: string | null;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // Relations
  @ManyToOne("Organization", "agents")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Agent", "children")
  @JoinColumn({ name: "parent_id" })
  parent?: Agent;

  @OneToMany("Agent", "parent")
  children?: Agent[];

  @OneToMany("AgentCapability", "agent")
  capabilities?: AgentCapability[];

  @OneToMany("Task", "assignee")
  assignedTasks?: Task[];

  @OneToMany("Task", "creator")
  createdTasks?: Task[];
}
