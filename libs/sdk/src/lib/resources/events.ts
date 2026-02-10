import type { HttpClient } from '../http-client';
import type { ApiResponse, RequestOptions } from '../types';

/**
 * Event-related types
 */
export interface Event {
  id: string;
  type: string;
  severity?: string;
  actorId?: string;
  targetId?: string;
  orgId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EventFilters {
  type?: string;
  severity?: string;
  actorId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Events Resource
 */
export class EventsResource {
  constructor(private http: HttpClient) {}

  /**
   * List events with optional filters
   */
  async list(
    filters?: EventFilters,
    limit = 50,
    offset = 0,
    options?: RequestOptions
  ): Promise<Event[]> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    if (filters?.type) params.set('type', filters.type);
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.actorId) params.set('actorId', filters.actorId);
    if (filters?.targetId) params.set('targetId', filters.targetId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    const response = await this.http.get<ApiResponse<Event[]>>(
      `/events?${params.toString()}`,
      options
    );
    return response.data;
  }

  /**
   * Get a specific event by ID
   */
  async get(id: string, options?: RequestOptions): Promise<Event> {
    const response = await this.http.get<ApiResponse<Event>>(
      `/events/${id}`,
      options
    );
    return response.data;
  }

  /**
   * Stream events using Server-Sent Events (SSE)
   * Note: This returns a ReadableStream that you can consume
   */
  async stream(
    filters?: EventFilters,
    options?: RequestOptions
  ): Promise<ReadableStream<Uint8Array> | null> {
    const params = new URLSearchParams();

    if (filters?.type) params.set('type', filters.type);
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.actorId) params.set('actorId', filters.actorId);
    if (filters?.targetId) params.set('targetId', filters.targetId);

    const query = params.toString();
    const url = `${this.http['baseUrl']}/events/stream${query ? `?${query}` : ''}`;

    // For SSE, we need to use fetch directly with appropriate headers
    const headers = this.http['authHandler'].getHeaders(
      'GET',
      `/events/stream${query ? `?${query}` : ''}`,
      undefined,
      options?.idempotencyKey
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        Accept: 'text/event-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to stream events: ${response.statusText}`);
    }

    return response.body;
  }

  /**
   * Helper to parse SSE stream into events
   */
  async *parseEventStream(
    stream: ReadableStream<Uint8Array>
  ): AsyncGenerator<Event, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data);
              yield event;
            } catch (e) {
              // Skip malformed JSON
              console.error('Failed to parse event:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
