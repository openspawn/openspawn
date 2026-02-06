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

import type { Agent } from './agent.entity';
import type { Organization } from './organization.entity';
import type { Task } from './task.entity';

@Entity('task_comments')
@Index(['taskId', 'createdAt'])
@Index(['parentCommentId'])
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'org_id', type: 'uuid' })
  orgId!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'parent_comment_id', type: 'uuid', nullable: true })
  parentCommentId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @ManyToOne('Organization')
  @JoinColumn({ name: 'org_id' })
  organization?: Organization;

  @ManyToOne('Task', 'comments')
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @ManyToOne('Agent')
  @JoinColumn({ name: 'author_id' })
  author?: Agent;

  @ManyToOne('TaskComment', 'replies')
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment?: TaskComment;

  @OneToMany('TaskComment', 'parentComment')
  replies?: TaskComment[];
}
