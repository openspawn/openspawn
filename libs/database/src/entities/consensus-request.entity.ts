import { ConsensusStatus, ConsensusType } from "@openspawn/shared-types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type { Agent } from "./agent.entity";
import type { ConsensusVote } from "./consensus-vote.entity";
import type { Organization } from "./organization.entity";

/**
 * A request for multi-agent consensus/approval
 */
@Entity("consensus_requests")
@Index(["orgId", "status"])
@Index(["orgId", "type"])
@Index(["orgId", "requesterId"])
@Index(["orgId", "expiresAt"])
export class ConsensusRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ type: "varchar", length: 50 })
  type!: ConsensusType;

  @Column({ type: "varchar", length: 50, default: ConsensusStatus.PENDING })
  status!: ConsensusStatus;

  /** Human-readable title */
  @Column({ type: "varchar", length: 255 })
  title!: string;

  /** Detailed description of what's being decided */
  @Column({ type: "text" })
  description!: string;

  /** Agent who initiated the request */
  @Column({ name: "requester_id", type: "uuid" })
  requesterId!: string;

  /** Related entity ID (agent, task, etc.) */
  @Column({ name: "subject_id", type: "uuid", nullable: true })
  subjectId!: string | null;

  /** Related entity type */
  @Column({ name: "subject_type", type: "varchar", length: 50, nullable: true })
  subjectType!: string | null;

  /** Minimum votes required for quorum */
  @Column({ name: "quorum_required", type: "smallint", default: 2 })
  quorumRequired!: number;

  /** Minimum approval percentage (0-100) */
  @Column({ name: "approval_threshold", type: "smallint", default: 50 })
  approvalThreshold!: number;

  /** Current vote counts */
  @Column({ name: "votes_approve", type: "smallint", default: 0 })
  votesApprove!: number;

  @Column({ name: "votes_reject", type: "smallint", default: 0 })
  votesReject!: number;

  @Column({ name: "votes_abstain", type: "smallint", default: 0 })
  votesAbstain!: number;

  /** When voting expires */
  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  /** When the decision was finalized */
  @Column({ name: "decided_at", type: "timestamptz", nullable: true })
  decidedAt!: Date | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Agent")
  @JoinColumn({ name: "requester_id" })
  requester?: Agent;

  @OneToMany("ConsensusVote", "request")
  votes?: ConsensusVote[];
}
