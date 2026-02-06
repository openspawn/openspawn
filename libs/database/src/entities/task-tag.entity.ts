import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { Organization } from './organization.entity';
import type { Task } from './task.entity';

@Entity('task_tags')
@Index(['taskId', 'tag'], { unique: true })
@Index(['orgId', 'tag'])
export class TaskTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ type: 'varchar', length: 100 })
  tag!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // Relations
  @ManyToOne('Organization')
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;

  @ManyToOne('Task', 'tags')
  @JoinColumn({ name: 'task_id' })
  task?: Task;
}
