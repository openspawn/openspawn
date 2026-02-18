/**
 * Demo API client for CLI demo mode
 * Returns mock data with realistic delays
 * All responses wrapped in { data: T } to match OpenSpawnClient
 */

import {
  demoAgents,
  demoTasks,
  demoCredits,
  demoMessages,
  demoUser,
} from './demo-data.js';
import type { ApiResponse } from './types.js';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DemoClient {
  private async simulateRequest<T>(data: T, delayMs = 300): Promise<ApiResponse<T>> {
    await delay(delayMs + Math.random() * 200);
    return { data };
  }

  // Auth
  async login(_email: string, _password: string) {
    return this.simulateRequest({
      token: 'demo_token_xxxxxxxxxxxx',
      user: demoUser,
    });
  }

  async logout() {
    return this.simulateRequest({ success: true });
  }

  async me() {
    return this.simulateRequest(demoUser);
  }

  // Agents
  async listAgents() {
    return this.simulateRequest(demoAgents);
  }

  async getAgent(identifier: string) {
    const agent = demoAgents.find(
      (a) => a.identifier === identifier || a.id === identifier
    );
    if (!agent) {
      throw new Error(`Agent not found: ${identifier}`);
    }
    return this.simulateRequest(agent);
  }

  async createAgent(data: { name: string; level?: number }) {
    const newAgent = {
      id: `agt_${Date.now()}`,
      identifier: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      level: data.level || 1,
      status: 'ACTIVE',
      trustScore: 50,
      creditBalance: 1000,
      capabilities: [],
      createdAt: new Date().toISOString(),
    };
    return this.simulateRequest(newAgent, 500);
  }

  // Tasks
  async listTasks(filters?: { status?: string; assignee?: string }) {
    let tasks = [...demoTasks];
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.assignee) {
      tasks = tasks.filter(
        (t) =>
          t.assignee?.identifier === filters.assignee ||
          t.assigneeId === filters.assignee
      );
    }
    return this.simulateRequest(tasks);
  }

  async getTask(identifier: string) {
    const task = demoTasks.find(
      (t) => t.identifier === identifier || t.id === identifier
    );
    if (!task) {
      throw new Error(`Task not found: ${identifier}`);
    }
    return this.simulateRequest(task);
  }

  async createTask(data: {
    title: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
  }) {
    const newTask = {
      id: `tsk_${Date.now()}`,
      identifier: `TSK-${Math.floor(Math.random() * 1000)}`,
      title: data.title,
      status: 'TODO',
      priority: data.priority || 'MEDIUM',
      assigneeId: data.assignee || null,
      assignee: data.assignee
        ? demoAgents.find((a) => a.identifier === data.assignee)
        : null,
      dueDate: data.dueDate || null,
      createdAt: new Date().toISOString(),
    };
    return this.simulateRequest(newTask, 500);
  }

  async updateTaskStatus(identifier: string, status: string) {
    const task = demoTasks.find((t) => t.identifier === identifier);
    if (!task) {
      throw new Error(`Task not found: ${identifier}`);
    }
    return this.simulateRequest({ ...task, status }, 400);
  }

  async assignTask(taskId: string, assigneeId: string) {
    const task = demoTasks.find((t) => t.identifier === taskId || t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    const agent = demoAgents.find((a) => a.identifier === assigneeId || a.id === assigneeId);
    return this.simulateRequest({
      ...task,
      assigneeId,
      assignee: agent || null,
    }, 400);
  }

  async transitionTask(taskId: string, status: string) {
    const task = demoTasks.find((t) => t.identifier === taskId || t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return this.simulateRequest({
      ...task,
      status,
      ...(status === 'DONE' ? { completedAt: new Date().toISOString() } : {}),
    }, 400);
  }

  // Credits
  async getBalance(_agentId?: string) {
    return this.simulateRequest({
      agentId: _agentId || 'demo-agent',
      currentBalance: demoCredits.balance,
      budgetPeriodLimit: demoCredits.budgetLimit,
      budgetPeriodSpent: demoCredits.budgetUsed,
      lifetimeEarnings: 45000,
    });
  }

  async getTransactions(limit = 10) {
    return this.simulateRequest(demoCredits.transactions.slice(0, limit));
  }

  async getBudget() {
    return this.simulateRequest({
      limit: demoCredits.budgetLimit,
      used: demoCredits.budgetUsed,
      remaining: demoCredits.budgetRemaining,
      resetDate: '2026-03-01T00:00:00Z',
    });
  }

  async transferCredits(fromId: string, toId: string, amount: number) {
    return this.simulateRequest({
      success: true,
      fromAgentId: fromId,
      toAgentId: toId,
      amount,
      newFromBalance: demoCredits.balance - amount,
      newToBalance: 1000 + amount,
    }, 500);
  }

  // Messages
  async listMessages(channelId?: string, limit = 10) {
    let messages = [...demoMessages];
    if (channelId) {
      messages = messages.filter((m) => m.channelId === channelId);
    }
    return this.simulateRequest(messages.slice(0, limit));
  }

  async sendMessage(channelId: string, content: string) {
    const newMessage = {
      id: `msg_${Date.now()}`,
      channelId,
      channelName: '#demo',
      senderId: demoUser.id,
      senderName: demoUser.name,
      content,
      createdAt: new Date().toISOString(),
    };
    return this.simulateRequest(newMessage, 400);
  }

  async listChannels() {
    return this.simulateRequest([
      { id: 'ch_general', name: '#general', type: 'PUBLIC' },
      { id: 'ch_dev', name: '#development', type: 'PUBLIC' },
      { id: 'ch_research', name: '#research', type: 'PUBLIC' },
    ]);
  }
}
