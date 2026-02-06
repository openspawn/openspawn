import { Proficiency } from "@openspawn/shared-types";
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

@Entity("agent_capabilities")
@Index(["agentId", "capability"], { unique: true })
@Index(["orgId", "capability"])
export class AgentCapability {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "agent_id", type: "uuid" })
  agentId!: string;

  @Column({ type: "varchar", length: 100 })
  capability!: string;

  @Column({ type: "varchar", length: 20, default: Proficiency.STANDARD })
  proficiency!: Proficiency;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Agent", "capabilities")
  @JoinColumn({ name: "agent_id" })
  agent?: Agent;
}
