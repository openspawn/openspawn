import type { HttpClient } from '../http-client';
import type { ApiResponse, RequestOptions } from '../types';
import type {
  AgentRole,
  AgentStatus,
  Proficiency,
} from '../shared-types';

/**
 * Agent-related types
 */
export interface Agent {
  id: string;
  agentId: string;
  name: string;
  role: AgentRole;
  level: number;
  model?: string;
  status: AgentStatus;
  currentBalance: number;
  managementFeePct?: number;
  budgetPeriodLimit?: number;
  budgetPeriodSpent?: number;
  capabilities?: AgentCapability[];
  metadata?: Record<string, unknown>;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentCapability {
  id: string;
  capability: string;
  proficiency: Proficiency;
}

export interface CreateAgentDto {
  name: string;
  role: AgentRole;
  level: number;
  model?: string;
}

export interface UpdateAgentDto {
  name?: string;
  status?: AgentStatus;
  metadata?: Record<string, unknown>;
}

export interface SpawnAgentDto {
  name: string;
  level: number;
  capabilities?: Array<{ capability: string; proficiency: Proficiency }>;
}

export interface ReputationSummary {
  agentId: string;
  reputationScore: number;
  level: string;
  tasksCompleted: number;
  successRate: number;
}

export interface BudgetStatus {
  agentId: string;
  currentBalance: number;
  budgetPeriodLimit?: number;
  budgetPeriodSpent: number;
  budgetRemaining?: number;
}

/**
 * Agents Resource
 */
export class AgentsResource {
  constructor(private http: HttpClient) {}

  /**
   * List all agents in the organization
   */
  async list(options?: RequestOptions): Promise<Agent[]> {
    const response = await this.http.get<ApiResponse<Agent[]>>(
      '/agents',
      options
    );
    return response.data;
  }

  /**
   * Get a specific agent by ID
   */
  async get(id: string, options?: RequestOptions): Promise<Agent> {
    const response = await this.http.get<ApiResponse<Agent>>(
      `/agents/${id}`,
      options
    );
    return response.data;
  }

  /**
   * Create a new agent (requires HR role)
   */
  async create(
    data: CreateAgentDto,
    options?: RequestOptions
  ): Promise<{ agent: Agent; secret: string }> {
    const response = await this.http.post<
      ApiResponse<Agent> & { secret: string }
    >('/agents/register', data, options);
    return {
      agent: response.data,
      secret: response.secret,
    };
  }

  /**
   * Update an agent (requires HR role)
   */
  async update(
    id: string,
    data: UpdateAgentDto,
    options?: RequestOptions
  ): Promise<Agent> {
    const response = await this.http.patch<ApiResponse<Agent>>(
      `/agents/${id}`,
      data,
      options
    );
    return response.data;
  }

  /**
   * Revoke an agent (requires HR role)
   */
  async revoke(
    id: string,
    options?: RequestOptions
  ): Promise<{ id: string; status: AgentStatus }> {
    const response = await this.http.post<
      ApiResponse<{ id: string; status: AgentStatus }>
    >(`/agents/${id}/revoke`, undefined, options);
    return response.data;
  }

  /**
   * Spawn a new child agent
   */
  async spawn(
    data: SpawnAgentDto,
    options?: RequestOptions
  ): Promise<{ agent: Agent; secret: string }> {
    const response = await this.http.post<
      ApiResponse<Agent> & { secret: string }
    >('/agents/spawn', data, options);
    return {
      agent: response.data,
      secret: response.secret,
    };
  }

  /**
   * Activate a pending agent
   */
  async activate(
    id: string,
    options?: RequestOptions
  ): Promise<{ id: string; status: AgentStatus }> {
    const response = await this.http.post<
      ApiResponse<{ id: string; status: AgentStatus }>
    >(`/agents/${id}/activate`, undefined, options);
    return response.data;
  }

  /**
   * Reject a pending agent
   */
  async reject(
    id: string,
    reason?: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.http.delete(`/agents/${id}/reject`, options);
  }

  /**
   * Get pending agents awaiting activation
   */
  async getPending(options?: RequestOptions): Promise<Agent[]> {
    const response = await this.http.get<ApiResponse<Agent[]>>(
      '/agents/pending',
      options
    );
    return response.data;
  }

  /**
   * Get agent hierarchy
   */
  async getHierarchy(
    id: string,
    depth = 3,
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.get<ApiResponse<unknown>>(
      `/agents/${id}/hierarchy?depth=${depth}`,
      options
    );
    return response.data;
  }

  /**
   * Get credit balance for an agent
   */
  async getBalance(id: string, options?: RequestOptions): Promise<number> {
    const response = await this.http.get<ApiResponse<{ balance: number }>>(
      `/agents/${id}/credits/balance`,
      options
    );
    return response.data.balance;
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(
    id: string,
    options?: RequestOptions
  ): Promise<BudgetStatus> {
    const response = await this.http.get<ApiResponse<BudgetStatus>>(
      `/agents/${id}/budget`,
      options
    );
    return response.data;
  }

  /**
   * Get reputation summary
   */
  async getReputation(
    id: string,
    options?: RequestOptions
  ): Promise<ReputationSummary> {
    const response = await this.http.get<ApiResponse<ReputationSummary>>(
      `/agents/${id}/reputation`,
      options
    );
    return response.data;
  }

  /**
   * Award quality bonus
   */
  async awardBonus(
    id: string,
    reason: string,
    amount?: number,
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.post<ApiResponse<unknown>>(
      `/agents/${id}/reputation/bonus`,
      { reason, amount },
      options
    );
    return response.data;
  }

  /**
   * Apply quality penalty
   */
  async applyPenalty(
    id: string,
    reason: string,
    amount?: number,
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.post<ApiResponse<unknown>>(
      `/agents/${id}/reputation/penalty`,
      { reason, amount },
      options
    );
    return response.data;
  }

  /**
   * Add a capability to an agent
   */
  async addCapability(
    id: string,
    capability: string,
    proficiency: Proficiency,
    options?: RequestOptions
  ): Promise<AgentCapability> {
    const response = await this.http.post<ApiResponse<AgentCapability>>(
      `/agents/${id}/capabilities`,
      { capability, proficiency },
      options
    );
    return response.data;
  }

  /**
   * Find agents with specific capabilities
   */
  async findByCapabilities(
    capabilities: string[],
    minProficiency?: Proficiency,
    options?: RequestOptions
  ): Promise<Agent[]> {
    const params = new URLSearchParams({
      capabilities: capabilities.join(','),
    });
    if (minProficiency) {
      params.set('minProficiency', minProficiency);
    }
    const response = await this.http.get<ApiResponse<Agent[]>>(
      `/agents/capabilities/match?${params.toString()}`,
      options
    );
    return response.data;
  }
}
