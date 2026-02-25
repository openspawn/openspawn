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
import { Organization } from "./organization.entity.js";

export type WebhookHookType = "pre" | "post";

@Entity("webhooks")
@Index(["orgId", "hookType", "enabled"])
export class Webhook {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 2048 })
  url!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  secret?: string;

  @Column("simple-array", { default: "" })
  events!: string[];

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  /** Hook type: "pre" fires before action (can block), "post" fires after */
  @Column({ name: "hook_type", type: "varchar", length: 10, default: "post" })
  hookType!: WebhookHookType;

  /** Whether this pre-hook can block the action if it returns allow: false */
  @Column({ name: "can_block", type: "boolean", default: false })
  canBlock!: boolean;

  /** Timeout for pre-hook execution in milliseconds */
  @Column({ name: "timeout_ms", type: "int", default: 5000 })
  timeoutMs!: number;

  @Column({ name: "failure_count", type: "int", default: 0 })
  failureCount!: number;

  @Column({ name: "last_triggered_at", type: "timestamptz", nullable: true })
  lastTriggeredAt?: Date;

  @Column({ name: "last_error", type: "varchar", length: 1000, nullable: true })
  lastError?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
