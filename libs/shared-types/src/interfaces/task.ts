import type { TaskPriority, TaskStatus } from "../enums";

export interface TaskRejection {
  feedback: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionCount: number;
}

export interface TaskFields {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; level: number } | null;
  creatorId?: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  completedAt?: string | null;
  source?: string | null;
  approvalRequired?: boolean;
  approvedAt?: string | null;
  autonomyLevel?: number | null;
  rejection?: TaskRejection | null;
}
