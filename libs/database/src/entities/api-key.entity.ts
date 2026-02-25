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

import { Organization } from "./organization.entity";
import { User } from "./user.entity";

export enum ApiKeyScope {
  READ = "read",
  WRITE = "write",
  ADMIN = "admin",
}

@Entity("api_keys")
@Unique(["keyHash"])
export class ApiKey {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  @Index()
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  createdBy!: User;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ name: "key_prefix", type: "varchar", length: 12 })
  @Index()
  keyPrefix!: string;

  @Column({ name: "key_hash", type: "varchar", length: 255 })
  keyHash!: string;

  @Column({ type: "jsonb", default: '["read"]' })
  scopes!: ApiKeyScope[];

  @Column({ name: "last_used_at", type: "timestamptz", nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: "expires_at", type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
