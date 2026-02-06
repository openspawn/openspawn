import { AgentRole, AgentStatus } from '@openspawn/shared-types';
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { AgentCapability } from './agent-capability.entity';
import type { Organization } from './organization.entity';
import type { Task } from './task.entity';

@Entity('agents')
@Index(['orgId', 'agentId'], { unique: true })
@Index(['orgId', 'status'])
@Index(['orgId', 'role'])
@Check('"level" >= 1 AND "level" <= 10')
@Check('"management_fee_pct" >= 0 AND "management_fee_pct" <= 50')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'agent_id', type: 'varchar', length: 100 })
  agentId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'smallint', default: 1 })
  level!: number;

  @Column({ type: 'varchar', length: 100, default: 'sonnet' })
  model!: string;

  @Column({ type: 'varchar', length: 20, default: AgentStatus.ACTIVE })
  status!: AgentStatus;

  @Column({ type: 'varchar', length: 50, default: AgentRole.WORKER })
  role!: AgentRole;

  @Column({ name: 'management_fee_pct', type: 'smallint', default: 0 })
  managementFeePct!: number;

  @Column({ name: 'current_balance', type: 'int', default: 0 })
  currentBalance!: number;

  @Column({ name: 'budget_period_limit', type: 'int', nullable: true })
  budgetPeriodLimit!: number | null;

  @Column({ name: 'budget_period_spent', type: 'int', default: 0 })
  budgetPeriodSpent!: number;

  @Column({ name: 'budget_period_start', type: 'timestamptz', nullable: true })
  budgetPeriodStart!: Date | null;

  @Column({ name: 'hmac_secret_enc', type: 'bytea' })
  hmacSecretEnc!: Buffer;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @ManyToOne('Organization', 'agents')
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;

  @OneToMany('AgentCapability', 'agent')
  capabilities?: AgentCapability[];

  @OneToMany('Task', 'assignee')
  assignedTasks?: Task[];

  @OneToMany('Task', 'creator')
  createdTasks?: Task[];
}
