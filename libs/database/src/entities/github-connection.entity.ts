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

export interface GitHubSyncConfig {
  inbound: {
    createTaskOnIssue: boolean;
    createTaskOnPR: boolean;
    createTaskOnCheckFailure: boolean;
    requiredLabel?: string;
  };
  outbound: {
    closeIssueOnComplete: boolean;
    commentOnStatusChange: boolean;
    updateLabels: boolean;
  };
}

@Entity("github_connections")
@Index(["orgId", "enabled"])
@Index(["installationId"], { unique: true })
export class GitHubConnection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ name: "installation_id", type: "bigint", unique: true })
  installationId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ name: "webhook_secret", type: "varchar", length: 255 })
  webhookSecret!: string;

  @Column({ name: "access_token", type: "varchar", length: 500, nullable: true })
  accessToken?: string | null;

  @Column({ name: "repo_filter", type: "jsonb", default: [] })
  repoFilter!: string[];

  @Column({ name: "sync_config", type: "jsonb" })
  syncConfig!: GitHubSyncConfig;

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
