import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { TaskPriority } from "@openspawn/shared-types";
import { Organization } from "./organization.entity.js";

@Entity("inbound_webhook_keys")
@Index(["key"], { unique: true })
@Index(["orgId", "enabled"])
export class InboundWebhookKey {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  /** Random API key for authentication (e.g., "iwk_...") */
  @Column({ type: "varchar", length: 64, unique: true })
  key!: string;

  /** HMAC secret for signature verification */
  @Column({ type: "varchar", length: 64 })
  secret!: string;

  @Column({ name: "default_agent_id", type: "uuid", nullable: true })
  defaultAgentId?: string | null;

  @Column({ name: "default_priority", type: "varchar", length: 10, nullable: true })
  defaultPriority?: TaskPriority | null;

  @Column({ name: "default_tags", type: "simple-array", default: "" })
  defaultTags!: string[];

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @Column({ name: "last_used_at", type: "timestamptz", nullable: true })
  lastUsedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
