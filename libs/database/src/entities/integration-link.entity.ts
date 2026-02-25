import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "./organization.entity.js";

export type IntegrationSourceType = 
  | "github_issue" 
  | "github_pr" 
  | "github_comment"
  | "linear_issue"
  | "linear_comment";
export type IntegrationTargetType = "task" | "message";

@Entity("integration_links")
@Index(["orgId", "sourceType", "sourceId"], { unique: true })
@Index(["orgId", "targetType", "targetId"])
@Index(["orgId", "provider"])
export class IntegrationLink {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  /** Provider name for future extensibility (github, linear, etc.) */
  @Column({ type: "varchar", length: 50, default: "github" })
  provider!: string;

  @Column({ name: "source_type", type: "varchar", length: 50 })
  sourceType!: IntegrationSourceType;

  @Column({ name: "source_id", type: "varchar", length: 255 })
  sourceId!: string;

  @Column({ name: "target_type", type: "varchar", length: 50 })
  targetType!: IntegrationTargetType;

  @Column({ name: "target_id", type: "uuid" })
  targetId!: string;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
