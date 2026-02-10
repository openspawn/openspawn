import { AuthHandler } from './auth';
import { HttpClient } from './http-client';
import { AgentsResource } from './resources/agents';
import { TasksResource } from './resources/tasks';
import { CreditsResource } from './resources/credits';
import { MessagesResource } from './resources/messages';
import { EventsResource } from './resources/events';
import type { OpenSpawnClientConfig } from './types';

/**
 * OpenSpawn SDK Client
 * 
 * Main entry point for interacting with the OpenSpawn API.
 * Supports both API key and HMAC-based authentication.
 * 
 * @example
 * ```typescript
 * // API Key Authentication
 * const client = new OpenSpawnClient({
 *   baseUrl: 'https://api.openspawn.com',
 *   apiKey: 'your-api-key'
 * });
 * 
 * // HMAC Authentication
 * const client = new OpenSpawnClient({
 *   baseUrl: 'https://api.openspawn.com',
 *   hmacCredentials: {
 *     agentId: 'your-agent-id',
 *     secret: 'your-secret'
 *   }
 * });
 * 
 * // List agents
 * const agents = await client.agents.list();
 * 
 * // Create a task
 * const task = await client.tasks.create({
 *   title: 'New Task',
 *   description: 'Task description',
 *   priority: 'HIGH'
 * });
 * ```
 */
export class OpenSpawnClient {
  private httpClient: HttpClient;

  public readonly agents: AgentsResource;
  public readonly tasks: TasksResource;
  public readonly credits: CreditsResource;
  public readonly messages: MessagesResource;
  public readonly events: EventsResource;

  constructor(config: OpenSpawnClientConfig) {
    // Validate configuration
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }

    if (!config.apiKey && !config.hmacCredentials) {
      throw new Error('Either apiKey or hmacCredentials must be provided');
    }

    // Initialize auth handler
    const authHandler = new AuthHandler(
      config.apiKey,
      config.hmacCredentials
    );

    // Initialize HTTP client
    this.httpClient = new HttpClient(
      config.baseUrl,
      authHandler,
      config.retryConfig
    );

    // Initialize resource modules
    this.agents = new AgentsResource(this.httpClient);
    this.tasks = new TasksResource(this.httpClient);
    this.credits = new CreditsResource(this.httpClient);
    this.messages = new MessagesResource(this.httpClient);
    this.events = new EventsResource(this.httpClient);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.httpClient.get('/health');
  }

  /**
   * Get the current authenticated agent's information
   */
  async me(): Promise<unknown> {
    return this.httpClient.get('/auth/me');
  }
}
