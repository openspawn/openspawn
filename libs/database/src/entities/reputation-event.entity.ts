import { ReputationEventType } from "@openspawn/shared-types";
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

/**
 * Tracks events that affect an agent's trust score
 * Append-only table for audit trail
 */
@Entity("reputation_events")
@Index(["orgId", "agentId"])
@Index(["orgId", "createdAt"])
@Index(["agentId", "type"])
export class ReputationEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "agent_id", type: "uuid" })
  agentId!: string;

  @Column({ type: "varchar", length: 50 })
  type!: ReputationEventType;

  /** Score change (positive or negative) */
  @Column({ type: "smallint" })
  impact!: number;

  /** Trust score before this event */
  @Column({ name: "previous_score", type: "smallint" })
  previousScore!: number;

  /** Trust score after this event */
  @Column({ name: "new_score", type: "smallint" })
  newScore!: number;

  /** Related task ID if applicable */
  @Column({ name: "task_id", type: "uuid", nullable: true })
  taskId!: string | null;

  /** Who triggered this event (agent or system) */
  @Column({ name: "triggered_by", type: "uuid", nullable: true })
  triggeredBy!: string | null;

  /** Additional context */
  @Column({ type: "varchar", length: 500, nullable: true })
  reason!: string | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Agent")
  @JoinColumn({ name: "agent_id" })
  agent?: Agent;
}
