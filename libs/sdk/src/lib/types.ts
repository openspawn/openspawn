/**
 * SDK Configuration Types
 */

export interface HmacCredentials {
  agentId: string;
  secret: string;
}

export interface OpenSpawnClientConfig {
  baseUrl: string;
  apiKey?: string;
  hmacCredentials?: HmacCredentials;
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryOn?: number[];
}

/**
 * Request Options
 */
export interface RequestOptions {
  idempotencyKey?: string;
  skipRetry?: boolean;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}
