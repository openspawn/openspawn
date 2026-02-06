import { AmountMode, type CreditType } from "@openspawn/shared-types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type { Organization } from "./organization.entity";

@Entity("credit_rate_configs")
@Index(["orgId", "triggerType", "direction"], { unique: true })
@Index(["orgId", "active"])
export class CreditRateConfig {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "trigger_type", type: "varchar", length: 100 })
  triggerType!: string;

  @Column({ type: "varchar", length: 10 })
  direction!: CreditType;

  @Column({ type: "int", nullable: true })
  amount!: number | null;

  @Column({ name: "amount_mode", type: "varchar", length: 20, default: AmountMode.FIXED })
  amountMode!: AmountMode;

  @Column({ name: "usd_to_credits_rate", type: "numeric", precision: 10, scale: 4, nullable: true })
  usdToCreditsRate!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  description!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;
}
