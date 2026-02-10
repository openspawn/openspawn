import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentsResource } from './agents';
import { HttpClient } from '../http-client';
import { AuthHandler } from '../auth';

describe('AgentsResource', () => {
  let agentsResource: AgentsResource;
  let httpClient: HttpClient;

  beforeEach(() => {
    const authHandler = new AuthHandler('test-api-key');
    httpClient = new HttpClient('https://api.test.com', authHandler);
    agentsResource = new AgentsResource(httpClient);
  });

  describe('list', () => {
    it('should list all agents', async () => {
      const mockAgents = [
        {
          id: '1',
          agentId: 'agent-1',
          name: 'Agent 1',
          role: 'WORKER' as const,
          level: 1,
          status: 'ACTIVE' as const,
          currentBalance: 100,
          createdAt: '2024-01-01',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: mockAgents }),
      });

      const result = await agentsResource.list();
      expect(result).toEqual(mockAgents);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/agents',
        expect.any(Object)
      );
    });
  });

  describe('get', () => {
    it('should get a specific agent', async () => {
      const mockAgent = {
        id: '1',
        agentId: 'agent-1',
        name: 'Agent 1',
        role: 'WORKER' as const,
        level: 1,
        status: 'ACTIVE' as const,
        currentBalance: 100,
        createdAt: '2024-01-01',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: mockAgent }),
      });

      const result = await agentsResource.get('1');
      expect(result).toEqual(mockAgent);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/agents/1',
        expect.any(Object)
      );
    });
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const mockAgent = {
        id: '1',
        agentId: 'agent-1',
        name: 'New Agent',
        role: 'WORKER' as const,
        level: 1,
        status: 'ACTIVE' as const,
        currentBalance: 0,
        createdAt: '2024-01-01',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ data: mockAgent, secret: 'secret-123' }),
      });

      const result = await agentsResource.create({
        name: 'New Agent',
        role: 'WORKER',
        level: 1,
      });

      expect(result.agent).toEqual(mockAgent);
      expect(result.secret).toBe('secret-123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/agents/register',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('spawn', () => {
    it('should spawn a child agent', async () => {
      const mockAgent = {
        id: '2',
        agentId: 'agent-2',
        name: 'Child Agent',
        level: 2,
        status: 'PENDING' as const,
        parentId: '1',
        role: 'WORKER' as const,
        currentBalance: 0,
        createdAt: '2024-01-01',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ data: mockAgent, secret: 'child-secret' }),
      });

      const result = await agentsResource.spawn({
        name: 'Child Agent',
        level: 2,
      });

      expect(result.agent).toEqual(mockAgent);
      expect(result.secret).toBe('child-secret');
    });
  });

  describe('getBalance', () => {
    it('should get agent credit balance', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { balance: 500 } }),
      });

      const balance = await agentsResource.getBalance('1');
      expect(balance).toBe(500);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/agents/1/credits/balance',
        expect.any(Object)
      );
    });
  });

  describe('getReputation', () => {
    it('should get agent reputation', async () => {
      const mockReputation = {
        agentId: '1',
        reputationScore: 85,
        level: 'TRUSTED',
        tasksCompleted: 100,
        successRate: 0.95,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: mockReputation }),
      });

      const reputation = await agentsResource.getReputation('1');
      expect(reputation).toEqual(mockReputation);
    });
  });

  describe('awardBonus', () => {
    it('should award quality bonus', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      });

      await agentsResource.awardBonus('1', 'Great work', 10);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/agents/1/reputation/bonus',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reason: 'Great work', amount: 10 }),
        })
      );
    });
  });

  describe('findByCapabilities', () => {
    it('should find agents with specific capabilities', async () => {
      const mockAgents = [
        {
          id: '1',
          agentId: 'agent-1',
          name: 'Skilled Agent',
          role: 'WORKER' as const,
          level: 3,
          status: 'ACTIVE' as const,
          currentBalance: 100,
          createdAt: '2024-01-01',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: mockAgents }),
      });

      const result = await agentsResource.findByCapabilities([
        'typescript',
        'react',
      ]);
      
      expect(result).toEqual(mockAgents);
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('capabilities=');
      expect(callUrl).toContain('typescript');
      expect(callUrl).toContain('react');
    });
  });
});
