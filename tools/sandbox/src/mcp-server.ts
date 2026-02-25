// ── MCP (Model Context Protocol) Server ──────────────────────────────────────
// Exposes BikiniBottom agents as MCP tools via JSON-RPC 2.0 over HTTP
// No external dependencies — raw JSON-RPC handling

import type { DeterministicSimulation } from './deterministic.js';
import type { SandboxAgent, SandboxTask } from './types.js';

// ── JSON-RPC Types ──────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
}

// ── MCP Server ──────────────────────────────────────────────────────────────

export class MCPServer {
  private sim: DeterministicSimulation;

  constructor(sim: DeterministicSimulation) {
    this.sim = sim;
  }

  handleRequest(req: JsonRpcRequest): JsonRpcResponse {
    if (req.jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', id: req.id ?? null, error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' } };
    }

    switch (req.method) {
      case 'initialize':
        return this.handleInitialize(req);
      case 'tools/list':
        return this.handleToolsList(req);
      case 'tools/call':
        return this.handleToolsCall(req);
      default:
        return { jsonrpc: '2.0', id: req.id ?? null, error: { code: -32601, message: `Method not found: ${req.method}` } };
    }
  }

  // ── initialize ──────────────────────────────────────────────────────────

  private handleInitialize(req: JsonRpcRequest): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'bikinibottom', version: '1.0.0' },
      },
    };
  }

  // ── tools/list ──────────────────────────────────────────────────────────

  private handleToolsList(req: JsonRpcRequest): JsonRpcResponse {
    const tools: ToolDefinition[] = [
      {
        name: 'delegate_task',
        description: 'Send a task to the agent org for processing',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task description' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Task priority' },
          },
          required: ['task'],
        },
      },
      {
        name: 'list_agents',
        description: 'List all agents in the organization',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['idle', 'busy', 'offline'], description: 'Filter by status' },
            domain: { type: 'string', description: 'Filter by domain' },
          },
        },
      },
      {
        name: 'get_agent',
        description: 'Get details about a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Agent ID' },
          },
          required: ['agentId'],
        },
      },
      {
        name: 'list_tasks',
        description: 'List current tasks',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status' },
            assigneeId: { type: 'string', description: 'Filter by assignee' },
            limit: { type: 'number', description: 'Max results to return' },
          },
        },
      },
      {
        name: 'get_task',
        description: 'Get task details',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID' },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'send_message',
        description: 'Send an ACP message to a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Target agent ID' },
            message: { type: 'string', description: 'Message content' },
          },
          required: ['agentId', 'message'],
        },
      },
      {
        name: 'get_org_stats',
        description: 'Get organization-wide statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];

    return { jsonrpc: '2.0', id: req.id ?? null, result: { tools } };
  }

  // ── tools/call ──────────────────────────────────────────────────────────

  private handleToolsCall(req: JsonRpcRequest): JsonRpcResponse {
    const params = req.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (!params?.name) {
      return { jsonrpc: '2.0', id: req.id ?? null, error: { code: -32602, message: 'Invalid params: "name" is required' } };
    }

    const args = params.arguments || {};
    let result: ToolResult;

    try {
      switch (params.name) {
        case 'delegate_task':
          result = this.callDelegateTask(args);
          break;
        case 'list_agents':
          result = this.callListAgents(args);
          break;
        case 'get_agent':
          result = this.callGetAgent(args);
          break;
        case 'list_tasks':
          result = this.callListTasks(args);
          break;
        case 'get_task':
          result = this.callGetTask(args);
          break;
        case 'send_message':
          result = this.callSendMessage(args);
          break;
        case 'get_org_stats':
          result = this.callGetOrgStats();
          break;
        default:
          return { jsonrpc: '2.0', id: req.id ?? null, error: { code: -32602, message: `Unknown tool: ${params.name}` } };
      }
    } catch (err: unknown) {
      result = { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
    }

    return { jsonrpc: '2.0', id: req.id ?? null, result };
  }

  // ── Tool Implementations ──────────────────────────────────────────────────

  private callDelegateTask(args: Record<string, unknown>): ToolResult {
    const task = args.task as string | undefined;
    if (!task || typeof task !== 'string') {
      throw new Error('Required parameter "task" must be a string');
    }

    this.sim.processOrder(task);

    // Find the most recently created task
    const latest = this.sim.tasks[this.sim.tasks.length - 1];
    const info = latest
      ? { taskId: latest.id, title: latest.title, status: latest.status, assigneeId: latest.assigneeId ?? null }
      : { message: 'Task queued for processing' };

    return { content: [{ type: 'text', text: JSON.stringify(info) }], isError: false };
  }

  private callListAgents(args: Record<string, unknown>): ToolResult {
    let agents = [...this.sim.agents];

    if (args.status && typeof args.status === 'string') {
      const statusFilter = args.status;
      agents = agents.filter(a => {
        if (statusFilter === 'idle') return a.status === 'idle' || a.status === 'active';
        if (statusFilter === 'busy') return a.status === 'busy';
        if (statusFilter === 'offline') return a.status === 'pending';
        return true;
      });
    }

    if (args.domain && typeof args.domain === 'string') {
      const domainFilter = args.domain.toLowerCase();
      agents = agents.filter(a => a.domain.toLowerCase().includes(domainFilter));
    }

    const result = agents.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      domain: a.domain,
      level: a.level,
      status: a.status,
    }));

    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false };
  }

  private callGetAgent(args: Record<string, unknown>): ToolResult {
    const agentId = args.agentId as string | undefined;
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('Required parameter "agentId" must be a string');
    }

    const agent = this.sim.agents.find(a => a.id === agentId);
    if (!agent) {
      return { content: [{ type: 'text', text: `Error: Agent "${agentId}" not found` }], isError: true };
    }

    const result = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      domain: agent.domain,
      level: agent.level,
      status: agent.status,
      parentId: agent.parentId ?? null,
      stats: agent.stats,
      inboxSize: agent.inbox.length,
      recentMessages: agent.recentMessages.slice(-5).map(m => ({
        id: m.id,
        type: m.type,
        from: m.from,
        to: m.to,
        body: m.body,
        timestamp: m.timestamp,
      })),
    };

    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false };
  }

  private callListTasks(args: Record<string, unknown>): ToolResult {
    let tasks = [...this.sim.tasks];

    if (args.status && typeof args.status === 'string') {
      tasks = tasks.filter(t => t.status === args.status);
    }

    if (args.assigneeId && typeof args.assigneeId === 'string') {
      tasks = tasks.filter(t => t.assigneeId === args.assigneeId);
    }

    const limit = typeof args.limit === 'number' ? args.limit : 50;
    tasks = tasks.slice(0, limit);

    const result = tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assigneeId: t.assigneeId ?? null,
      creatorId: t.creatorId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false };
  }

  private callGetTask(args: Record<string, unknown>): ToolResult {
    const taskId = args.taskId as string | undefined;
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('Required parameter "taskId" must be a string');
    }

    const task = this.sim.tasks.find(t => t.id === taskId);
    if (!task) {
      return { content: [{ type: 'text', text: `Error: Task "${taskId}" not found` }], isError: true };
    }

    const result = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? null,
      creatorId: task.creatorId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      acked: task.acked,
      blockedReason: task.blockedReason ?? null,
      activityLog: task.activityLog.map(m => ({
        id: m.id,
        type: m.type,
        from: m.from,
        to: m.to,
        body: m.body,
        timestamp: m.timestamp,
      })),
    };

    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false };
  }

  private callSendMessage(args: Record<string, unknown>): ToolResult {
    const agentId = args.agentId as string | undefined;
    const message = args.message as string | undefined;

    if (!agentId || typeof agentId !== 'string') {
      throw new Error('Required parameter "agentId" must be a string');
    }
    if (!message || typeof message !== 'string') {
      throw new Error('Required parameter "message" must be a string');
    }

    const agent = this.sim.agents.find(a => a.id === agentId);
    if (!agent) {
      return { content: [{ type: 'text', text: `Error: Agent "${agentId}" not found` }], isError: true };
    }

    const msg = {
      id: `acp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'delegation' as const,
      from: 'mcp-client',
      to: agentId,
      taskId: '',
      body: message,
      timestamp: Date.now(),
    };

    agent.inbox.push(msg);
    agent.recentMessages.push(msg);
    if (agent.recentMessages.length > 10) {
      agent.recentMessages = agent.recentMessages.slice(-10);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ sent: true, to: agent.name, messageId: msg.id }) }],
      isError: false,
    };
  }

  private callGetOrgStats(): ToolResult {
    const agents = this.sim.agents;
    const tasks = this.sim.tasks;

    const result = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      pendingTasks: tasks.filter(t => !['done', 'rejected'].includes(t.status)).length,
    };

    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false };
  }
}
