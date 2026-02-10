/**
 * Shared types for CLI clients
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}
