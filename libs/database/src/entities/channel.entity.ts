import type { ChannelType } from '@openspawn/shared-types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Message } from './message.entity';
import type { Organization } from './organization.entity';
import type { Task } from './task.entity';

@Entity('channels')
@Index(['orgId', 'name'], { unique: true })
@Index(['orgId', 'type'])
@Index(['taskId'])
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: ChannelType;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @ManyToOne('Organization')
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;

  @ManyToOne('Task')
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @OneToMany('Message', 'channel')
  messages?: Message[];
}
