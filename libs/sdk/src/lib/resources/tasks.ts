import type { HttpClient } from '../http-client';
import type { ApiResponse, RequestOptions } from '../types';
import type {
  TaskStatus,
  TaskPriority,
  EscalationReason,
} from '../shared-types';

/**
 * Task-related types
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  creatorId: string;
  assigneeId?: string;
  parentTaskId?: string;
  orgId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  parentTaskId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  metadata?: Record<string, unknown>;
}

export interface TransitionTaskDto {
  status: TaskStatus;
  reason?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  parentCommentId?: string;
  createdAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
  creatorId?: string;
  parentTaskId?: string;
}

/**
 * Tasks Resource
 */
export class TasksResource {
  constructor(private http: HttpClient) {}

  /**
   * List tasks with optional filters
   */
  async list(
    filters?: TaskFilters,
    options?: RequestOptions
  ): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId);
    if (filters?.creatorId) params.set('creatorId', filters.creatorId);
    if (filters?.parentTaskId) params.set('parentTaskId', filters.parentTaskId);

    const query = params.toString();
    const response = await this.http.get<ApiResponse<Task[]>>(
      `/tasks${query ? `?${query}` : ''}`,
      options
    );
    return response.data;
  }

  /**
   * Get a specific task by ID
   */
  async get(id: string, options?: RequestOptions): Promise<Task> {
    const response = await this.http.get<ApiResponse<Task>>(
      `/tasks/${id}`,
      options
    );
    return response.data;
  }

  /**
   * Create a new task
   */
  async create(data: CreateTaskDto, options?: RequestOptions): Promise<Task> {
    const response = await this.http.post<ApiResponse<Task>>(
      '/tasks',
      data,
      options
    );
    return response.data;
  }

  /**
   * Update a task
   */
  async update(
    id: string,
    data: UpdateTaskDto,
    options?: RequestOptions
  ): Promise<Task> {
    const response = await this.http.patch<ApiResponse<Task>>(
      `/tasks/${id}`,
      data,
      options
    );
    return response.data;
  }

  /**
   * Transition a task to a new status
   */
  async transition(
    id: string,
    status: TaskStatus,
    reason?: string,
    options?: RequestOptions
  ): Promise<Task> {
    const response = await this.http.post<ApiResponse<Task>>(
      `/tasks/${id}/transition`,
      { status, reason },
      options
    );
    return response.data;
  }

  /**
   * Approve a task
   */
  async approve(id: string, options?: RequestOptions): Promise<Task> {
    const response = await this.http.post<ApiResponse<Task>>(
      `/tasks/${id}/approve`,
      undefined,
      options
    );
    return response.data;
  }

  /**
   * Assign a task to an agent
   */
  async assign(
    id: string,
    assigneeId: string,
    options?: RequestOptions
  ): Promise<Task> {
    const response = await this.http.post<ApiResponse<Task>>(
      `/tasks/${id}/assign`,
      { assigneeId },
      options
    );
    return response.data;
  }

  /**
   * Claim a task (assign to self)
   */
  async claim(id: string, options?: RequestOptions): Promise<Task> {
    // Claim is typically just assigning to the current authenticated agent
    // The API will handle determining the current agent from auth headers
    const response = await this.http.post<ApiResponse<Task>>(
      `/tasks/${id}/claim`,
      undefined,
      options
    );
    return response.data;
  }

  /**
   * Add a comment to a task
   */
  async addComment(
    id: string,
    body: string,
    parentCommentId?: string,
    options?: RequestOptions
  ): Promise<TaskComment> {
    const response = await this.http.post<ApiResponse<TaskComment>>(
      `/tasks/${id}/comments`,
      { body, parentCommentId },
      options
    );
    return response.data;
  }

  /**
   * Get comments for a task
   */
  async getComments(
    id: string,
    options?: RequestOptions
  ): Promise<TaskComment[]> {
    const response = await this.http.get<ApiResponse<TaskComment[]>>(
      `/tasks/${id}/comments`,
      options
    );
    return response.data;
  }

  /**
   * Escalate a task
   */
  async escalate(
    id: string,
    reason: EscalationReason,
    notes?: string,
    targetAgentId?: string,
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.post<ApiResponse<unknown>>(
      `/tasks/${id}/escalate`,
      { reason, notes, targetAgentId },
      options
    );
    return response.data;
  }

  /**
   * Add a dependency between tasks
   */
  async addDependency(
    id: string,
    dependsOnId: string,
    blocking = false,
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.post<ApiResponse<unknown>>(
      `/tasks/${id}/dependencies`,
      { dependsOnId, blocking },
      options
    );
    return response.data;
  }

  /**
   * Remove a task dependency
   */
  async removeDependency(
    id: string,
    depId: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.http.delete(`/tasks/${id}/dependencies/${depId}`, options);
  }

  /**
   * Find candidate agents for a task
   */
  async findCandidates(
    id: string,
    minCoverage?: number,
    maxResults?: number,
    options?: RequestOptions
  ): Promise<unknown> {
    const params = new URLSearchParams();
    if (minCoverage !== undefined) params.set('minCoverage', String(minCoverage));
    if (maxResults !== undefined) params.set('maxResults', String(maxResults));

    const query = params.toString();
    const response = await this.http.get<ApiResponse<unknown>>(
      `/tasks/${id}/candidates${query ? `?${query}` : ''}`,
      options
    );
    return response.data;
  }

  /**
   * Auto-assign a task to the best candidate
   */
  async autoAssign(
    id: string,
    minCoverage?: number,
    excludeAgentIds?: string[],
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.post<ApiResponse<unknown>>(
      `/tasks/${id}/auto-assign`,
      { minCoverage, excludeAgentIds },
      options
    );
    return response.data;
  }
}
