import { VoteValue } from "@openspawn/shared-types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import type { Agent } from "./agent.entity";
import type { ConsensusRequest } from "./consensus-request.entity";
import type { Organization } from "./organization.entity";

/**
 * An individual vote on a consensus request
 */
@Entity("consensus_votes")
@Unique(["requestId", "voterId"]) // One vote per agent per request
@Index(["orgId", "requestId"])
@Index(["voterId"])
export class ConsensusVote {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "request_id", type: "uuid" })
  requestId!: string;

  @Column({ name: "voter_id", type: "uuid" })
  voterId!: string;

  @Column({ type: "varchar", length: 20 })
  vote!: VoteValue;

  /** Optional reason for the vote */
  @Column({ type: "text", nullable: true })
  reason!: string | null;

  /** Voter's level at time of vote (for weighted voting) */
  @Column({ name: "voter_level", type: "smallint" })
  voterLevel!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("ConsensusRequest", "votes")
  @JoinColumn({ name: "request_id" })
  request?: ConsensusRequest;

  @ManyToOne("Agent")
  @JoinColumn({ name: "voter_id" })
  voter?: Agent;
}
