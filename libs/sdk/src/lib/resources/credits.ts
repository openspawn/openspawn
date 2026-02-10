import type { HttpClient } from '../http-client';
import type { ApiResponse, RequestOptions } from '../types';
import type { CreditType } from '../shared-types';

/**
 * Credit-related types
 */
export interface CreditBalance {
  balance: number;
  agentId: string;
}

export interface CreditTransaction {
  id: string;
  orgId: string;
  agentId: string;
  amount: number;
  type: CreditType;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  sourceTaskId?: string;
  sourceAgentId?: string;
  triggerType?: string;
  createdAt: string;
}

export interface SpendCreditsDto {
  amount: number;
  reason: string;
  triggerType?: string;
  sourceTaskId?: string;
  sourceAgentId?: string;
}

export interface TransferCreditsDto {
  toAgentId: string;
  amount: number;
  reason: string;
}

export interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Credits Resource
 */
export class CreditsResource {
  constructor(private http: HttpClient) {}

  /**
   * Get current credit balance for authenticated agent
   */
  async balance(options?: RequestOptions): Promise<number> {
    const response = await this.http.get<ApiResponse<CreditBalance>>(
      '/credits/balance',
      options
    );
    return response.data.balance;
  }

  /**
   * Spend credits
   */
  async spend(
    data: SpendCreditsDto,
    options?: RequestOptions
  ): Promise<CreditTransaction> {
    const response = await this.http.post<ApiResponse<CreditTransaction>>(
      '/credits/spend',
      data,
      options
    );
    return response.data;
  }

  /**
   * Get credit transaction history
   */
  async history(
    limit = 50,
    offset = 0,
    options?: RequestOptions
  ): Promise<CreditHistoryResponse> {
    const response = await this.http.get<
      ApiResponse<CreditTransaction[]> & {
        meta: { total: number; limit: number; offset: number };
      }
    >(`/credits/history?limit=${limit}&offset=${offset}`, options);

    return {
      transactions: response.data,
      total: response.meta.total,
      limit: response.meta.limit,
      offset: response.meta.offset,
    };
  }

  /**
   * Transfer credits to another agent
   */
  async transfer(
    data: TransferCreditsDto,
    options?: RequestOptions
  ): Promise<unknown> {
    const response = await this.http.post<ApiResponse<unknown>>(
      '/agents/credits/transfer',
      data,
      options
    );
    return response.data;
  }

  /**
   * Get organization-wide credit statistics
   */
  async getStats(options?: RequestOptions): Promise<unknown> {
    const response = await this.http.get<ApiResponse<unknown>>(
      '/credits/analytics/stats',
      options
    );
    return response.data;
  }

  /**
   * Get spending trends over time
   */
  async getTrends(
    days = 30,
    agentId?: string,
    options?: RequestOptions
  ): Promise<unknown> {
    const params = new URLSearchParams({ days: String(days) });
    if (agentId) params.set('agentId', agentId);

    const response = await this.http.get<ApiResponse<unknown>>(
      `/credits/analytics/trends?${params.toString()}`,
      options
    );
    return response.data;
  }

  /**
   * Get spending summary by agent
   */
  async getAgentSummary(options?: RequestOptions): Promise<unknown> {
    const response = await this.http.get<ApiResponse<unknown>>(
      '/credits/analytics/agents',
      options
    );
    return response.data;
  }

  /**
   * Get top spenders
   */
  async getTopSpenders(
    days = 7,
    limit = 10,
    options?: RequestOptions
  ): Promise<unknown> {
    const params = new URLSearchParams({
      days: String(days),
      limit: String(limit),
    });

    const response = await this.http.get<ApiResponse<unknown>>(
      `/credits/analytics/top-spenders?${params.toString()}`,
      options
    );
    return response.data;
  }
}
