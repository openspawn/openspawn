import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Agent } from './agent.entity';
import type { Task } from './task.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 20, default: 'TASK' })
  taskPrefix!: string;

  @Column({ type: 'int', default: 1 })
  nextTaskNumber!: number;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // Relations (lazy to avoid circular imports)
  @OneToMany('Agent', 'organization')
  agents?: Agent[];

  @OneToMany('Task', 'organization')
  tasks?: Task[];
}
