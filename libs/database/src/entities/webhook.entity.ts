import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "./organization.entity.js";

@Entity("webhooks")
export class Webhook {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id" })
  orgId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  secret?: string;

  @Column("simple-array", { default: "" })
  events!: string[];

  @Column({ default: true })
  enabled!: boolean;

  @Column({ name: "failure_count", default: 0 })
  failureCount!: number;

  @Column({ name: "last_triggered_at", nullable: true })
  lastTriggeredAt?: Date;

  @Column({ name: "last_error", nullable: true })
  lastError?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
