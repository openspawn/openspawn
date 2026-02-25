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

@Entity("idempotency_keys")
@Index(["expiresAt"])
export class IdempotencyKey {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  key!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "agent_id", type: "uuid" })
  agentId!: string;

  @Column({ type: "varchar", length: 10 })
  method!: string;

  @Column({ type: "varchar", length: 500 })
  path!: string;

  @Column({ name: "status_code", type: "smallint" })
  statusCode!: number;

  @Column({ name: "response_body", type: "jsonb" })
  responseBody!: Record<string, unknown>;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

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
