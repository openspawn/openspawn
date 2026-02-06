import type { CreditType } from '@openspawn/shared-types';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Agent } from './agent.entity';
import type { Event } from './event.entity';
import type { Organization } from './organization.entity';
import type { Task } from './task.entity';

@Entity('credit_transactions')
@Index(['orgId', 'agentId', 'createdAt'])
@Index(['orgId', 'createdAt'])
@Index(['triggerEventId'])
@Index(['sourceTaskId'])
@Check('"amount" > 0')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: CreditType;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 500 })
  reason!: string;

  @Column({ name: 'trigger_type', type: 'varchar', length: 100, nullable: true })
  triggerType!: string | null;

  @Column({ name: 'trigger_event_id', type: 'uuid', nullable: true })
  triggerEventId!: string | null;

  @Column({ name: 'source_task_id', type: 'uuid', nullable: true })
  sourceTaskId!: string | null;

  @Column({ name: 'source_agent_id', type: 'uuid', nullable: true })
  sourceAgentId!: string | null;

  @Column({ name: 'litellm_cost_usd', type: 'numeric', precision: 10, scale: 6, nullable: true })
  litellmCostUsd!: string | null;

  @Column({ name: 'idempotency_key', type: 'uuid', nullable: true, unique: true })
  idempotencyKey!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // Relations (read-only - this is an append-only ledger)
  @ManyToOne('Organization')
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;

  @ManyToOne('Agent')
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;

  @ManyToOne('Event')
  @JoinColumn({ name: 'trigger_event_id' })
  triggerEvent?: Event;

  @ManyToOne('Task')
  @JoinColumn({ name: 'source_task_id' })
  sourceTask?: Task;

  @ManyToOne('Agent')
  @JoinColumn({ name: 'source_agent_id' })
  sourceAgent?: Agent;
}
