/**
 * Demo client that returns mock data instead of hitting a real API
 * Used for safe CLI demos and GIF recordings
 */

import {
  demoAgents,
  demoTasks,
  demoTransactions,
  demoChannels,
  demoMessages,
  demoBalance,
} from "./demo-data.js";

// Simulate network delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class DemoClient {
  async whoami() {
    await delay(300);
    return { data: { id: "user-001", email: "demo@openspawn.io", role: "admin" } };
  }

  async listAgents() {
    await delay(400);
    return { data: demoAgents };
  }

  async getAgent(id: string) {
    await delay(300);
    const agent = demoAgents.find((a) => a.id === id || a.agentId === id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    return { data: agent };
  }

  async createAgent(data: { name: string; agentId: string; level: number; role?: string }) {
    await delay(500);
    const newAgent = {
      id: `agent-${Date.now()}`,
      agentId: data.agentId,
      name: data.name,
      role: data.role || "worker",
      level: data.level,
      status: "PENDING",
      currentBalance: 1000,
      lifetimeEarnings: 1000,
      model: "claude-sonnet-4",
      trustScore: 50,
      tasksCompleted: 0,
      createdAt: new Date().toISOString(),
    };
    return { data: newAgent };
  }

  async listTasks(params?: { status?: string }) {
    await delay(400);
    let tasks = [...demoTasks];
    if (params?.status) {
      tasks = tasks.filter((t) => t.status.toLowerCase() === params.status?.toLowerCase());
    }
    return { data: tasks };
  }

  async getTask(id: string) {
    await delay(300);
    const task = demoTasks.find((t) => t.id === id || t.identifier === id);
    if (!task) throw new Error(`Task not found: ${id}`);
    return { data: task };
  }

  async createTask(data: { title: string; priority: string; description?: string }) {
    await delay(500);
    const newTask = {
      id: `task-${Date.now()}`,
      identifier: `TASK-${String(demoTasks.length + 1).padStart(3, "0")}`,
      title: data.title,
      description: data.description || null,
      status: "BACKLOG",
      priority: data.priority,
      assignee: null,
      dueDate: null,
      createdAt: new Date().toISOString(),
    };
    return { data: newTask };
  }

  async assignTask(taskId: string, assigneeId: string) {
    await delay(400);
    const task = demoTasks.find((t) => t.id === taskId || t.identifier === taskId);
    const agent = demoAgents.find((a) => a.id === assigneeId || a.agentId === assigneeId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    if (!agent) throw new Error(`Agent not found: ${assigneeId}`);
    return { data: { ...task, assignee: { id: agent.id, name: agent.name } } };
  }

  async transitionTask(taskId: string, status: string) {
    await delay(400);
    const task = demoTasks.find((t) => t.id === taskId || t.identifier === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return { data: { ...task, status } };
  }

  async getBalance(agentId?: string) {
    await delay(300);
    if (agentId) {
      const agent = demoAgents.find((a) => a.id === agentId || a.agentId === agentId);
      if (!agent) throw new Error(`Agent not found: ${agentId}`);
      return {
        data: {
          agentId: agent.agentId,
          currentBalance: agent.currentBalance,
          budgetPeriodLimit: 25000,
          budgetPeriodSpent: 8000,
          lifetimeEarnings: agent.lifetimeEarnings,
        },
      };
    }
    return { data: demoBalance };
  }

  async transferCredits(fromId: string, toId: string, amount: number) {
    await delay(500);
    return { data: { success: true, fromId, toId, amount } };
  }

  async listChannels() {
    await delay(300);
    return { data: demoChannels };
  }

  async listMessages(channelId: string) {
    await delay(300);
    return { data: demoMessages };
  }

  async sendMessage(recipientId: string, content: string) {
    await delay(400);
    return {
      data: {
        id: `msg-${Date.now()}`,
        senderId: "agent-dennis",
        recipientId,
        body: content,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
