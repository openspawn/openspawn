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

export interface LinearSyncConfig {
  inbound: {
    createTaskOnIssue: boolean;
    createTaskOnComment: boolean;
    syncStatusChanges: boolean;
    requiredLabel?: string;
  };
  outbound: {
    closeIssueOnComplete: boolean;
    commentOnStatusChange: boolean;
    updateLabels: boolean;
    syncAssignee: boolean;
  };
}

@Entity("linear_connections")
@Index(["orgId", "enabled"])
@Index(["teamId"], { unique: true })
export class LinearConnection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ name: "team_id", type: "varchar", length: 255, unique: true })
  teamId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ name: "webhook_secret", type: "varchar", length: 255 })
  webhookSecret!: string;

  @Column({ name: "api_key", type: "varchar", length: 500, nullable: true })
  apiKey?: string | null;

  @Column({ name: "team_filter", type: "jsonb", default: [] })
  teamFilter!: string[];

  @Column({ name: "sync_config", type: "jsonb" })
  syncConfig!: LinearSyncConfig;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @Column({ name: "last_sync_at", type: "timestamptz", nullable: true })
  lastSyncAt?: Date | null;

  @Column({ name: "last_error", type: "varchar", length: 1000, nullable: true })
  lastError?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
