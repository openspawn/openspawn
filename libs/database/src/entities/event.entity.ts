import { EventSeverity } from "@openspawn/shared-types";
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

@Entity("events")
@Index(["orgId", "type", "createdAt"])
@Index(["orgId", "entityType", "entityId"])
@Index(["orgId", "actorId", "createdAt"])
@Index(["orgId", "createdAt"])
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ type: "varchar", length: 100 })
  type!: string;

  @Column({ name: "actor_id", type: "uuid" })
  actorId!: string;

  @Column({ name: "entity_type", type: "varchar", length: 50 })
  entityType!: string;

  @Column({ name: "entity_id", type: "uuid" })
  entityId!: string;

  @Column({ type: "jsonb" })
  data!: Record<string, unknown>;

  @Column({ type: "varchar", length: 10, default: EventSeverity.INFO })
  severity!: EventSeverity;

  @Column({ type: "varchar", length: 500, nullable: true })
  reasoning!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations (read-only - this is an append-only audit log)
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Agent")
  @JoinColumn({ name: "actor_id" })
  actor?: Agent;
}
