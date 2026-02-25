import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { Organization } from "./organization.entity";
import { RefreshToken } from "./refresh-token.entity";

export enum UserRole {
  ADMIN = "admin",
  OPERATOR = "operator",
  VIEWER = "viewer",
}

@Entity("users")
@Unique(["orgId", "email"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 20, default: UserRole.VIEWER })
  role!: UserRole;

  // Google OAuth
  @Column({ name: "google_id", type: "varchar", length: 255, nullable: true })
  googleId!: string | null;

  // TOTP 2FA
  @Column({ name: "totp_secret_enc", type: "bytea", nullable: true })
  totpSecretEnc!: Buffer | null;

  @Column({ name: "totp_enabled", type: "boolean", default: false })
  totpEnabled!: boolean;

  // Recovery codes (encrypted JSON array)
  @Column({ name: "recovery_codes_enc", type: "bytea", nullable: true })
  recoveryCodesEnc!: Buffer | null;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: "email_verified", type: "boolean", default: false })
  emailVerified!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
