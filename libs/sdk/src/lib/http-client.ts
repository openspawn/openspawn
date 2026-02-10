import { AuthHandler } from './auth';
import {
  ApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from './errors';
import type { RequestOptions, RetryConfig } from './types';

export class HttpClient {
  private baseUrl: string;
  private authHandler: AuthHandler;
  private retryConfig: Required<RetryConfig>;

  constructor(
    baseUrl: string,
    authHandler: AuthHandler,
    retryConfig?: RetryConfig
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authHandler = authHandler;
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      retryDelay: retryConfig?.retryDelay ?? 1000,
      retryOn: retryConfig?.retryOn ?? [408, 429, 500, 502, 503, 504],
    };
  }

  /**
   * Make an HTTP request with retry logic
   */
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const headers = this.authHandler.getHeaders(
      method,
      path,
      bodyStr,
      options?.idempotencyKey
    );

    let lastError: Error | null = null;
    const maxAttempts = options?.skipRetry ? 1 : this.retryConfig.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: headers as HeadersInit,
          body: bodyStr,
        });

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as T;
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx except 429) or if skipRetry is true
        if (
          error instanceof ApiError &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          error.statusCode !== 429
        ) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts - 1) {
          throw error;
        }

        // Wait before retrying
        const delay = this.calculateRetryDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: { message?: string; statusCode?: number; error?: string } = {};
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message = errorData.message || `API error: ${response.status}`;

    switch (response.status) {
      case 400:
        throw new ValidationError(message);
      case 401:
        throw new UnauthorizedError(message);
      case 403:
        throw new ForbiddenError(message);
      case 404:
        throw new NotFoundError(message);
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      default:
        throw new ApiError(message, response.status, errorData);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number): number {
    return this.retryConfig.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convenience methods
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}
