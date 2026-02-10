import { describe, it, expect, beforeEach } from 'vitest';
import { OpenSpawnClient } from './client';
import { AgentsResource } from './resources/agents';
import { TasksResource } from './resources/tasks';
import { CreditsResource } from './resources/credits';
import { MessagesResource } from './resources/messages';
import { EventsResource } from './resources/events';

describe('OpenSpawnClient', () => {
  describe('constructor', () => {
    it('should initialize with API key', () => {
      const client = new OpenSpawnClient({
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      });

      expect(client).toBeDefined();
      expect(client.agents).toBeInstanceOf(AgentsResource);
      expect(client.tasks).toBeInstanceOf(TasksResource);
      expect(client.credits).toBeInstanceOf(CreditsResource);
      expect(client.messages).toBeInstanceOf(MessagesResource);
      expect(client.events).toBeInstanceOf(EventsResource);
    });

    it('should initialize with HMAC credentials', () => {
      const client = new OpenSpawnClient({
        baseUrl: 'https://api.test.com',
        hmacCredentials: {
          agentId: 'agent-123',
          secret: 'secret',
        },
      });

      expect(client).toBeDefined();
    });

    it('should throw error if baseUrl missing', () => {
      expect(
        () =>
          new OpenSpawnClient({
            baseUrl: '',
            apiKey: 'test',
          })
      ).toThrow();
    });

    it('should throw error if no auth provided', () => {
      expect(
        () =>
          new OpenSpawnClient({
            baseUrl: 'https://api.test.com',
          } as any)
      ).toThrow();
    });

    it('should accept retry config', () => {
      const client = new OpenSpawnClient({
        baseUrl: 'https://api.test.com',
        apiKey: 'test',
        retryConfig: {
          maxRetries: 5,
          retryDelay: 2000,
        },
      });

      expect(client).toBeDefined();
    });
  });

  describe('resource modules', () => {
    let client: OpenSpawnClient;

    beforeEach(() => {
      client = new OpenSpawnClient({
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      });
    });

    it('should expose agents resource', () => {
      expect(client.agents).toBeInstanceOf(AgentsResource);
      expect(client.agents.list).toBeDefined();
      expect(client.agents.get).toBeDefined();
      expect(client.agents.create).toBeDefined();
    });

    it('should expose tasks resource', () => {
      expect(client.tasks).toBeInstanceOf(TasksResource);
      expect(client.tasks.list).toBeDefined();
      expect(client.tasks.create).toBeDefined();
      expect(client.tasks.assign).toBeDefined();
    });

    it('should expose credits resource', () => {
      expect(client.credits).toBeInstanceOf(CreditsResource);
      expect(client.credits.balance).toBeDefined();
      expect(client.credits.spend).toBeDefined();
      expect(client.credits.history).toBeDefined();
    });

    it('should expose messages resource', () => {
      expect(client.messages).toBeInstanceOf(MessagesResource);
      expect(client.messages.send).toBeDefined();
      expect(client.messages.list).toBeDefined();
    });

    it('should expose events resource', () => {
      expect(client.events).toBeInstanceOf(EventsResource);
      expect(client.events.list).toBeDefined();
      expect(client.events.stream).toBeDefined();
    });
  });
});
