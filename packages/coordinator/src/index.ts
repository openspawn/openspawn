import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'http';
import { z } from 'zod';
import {
  createDb, registerAgent, listAgents, updateAgentStatus,
  createTask, claimTask, completeTask, listTasks, updateTaskStatus,
  escalate, resolveEscalation, listEscalations,
  getEvents, orgStatus, logEvent,
} from './db.js';

const DB_PATH = process.env.OPENSPAWN_DB ?? 'openspawn.db';
const PORT = parseInt(process.env.OPENSPAWN_PORT ?? '8787');

const db = createDb(DB_PATH);

const server = new McpServer({
  name: 'openspawn-coordinator',
  version: '0.1.0',
});

// --- Agent tools ---

server.tool('agent_register', 'Register a new agent in the org', {
  id: z.string().describe('Unique agent identifier'),
  name: z.string().describe('Display name'),
  role: z.string().optional().describe('Role description'),
  level: z.number().min(1).max(10).optional().describe('Agent level (1-10)'),
  department: z.string().optional(),
  model: z.string().optional().describe('LLM model identifier'),
}, async (params) => {
  try {
    registerAgent(db, params);
    return { content: [{ type: 'text', text: `Registered agent ${params.id} (${params.name})` }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

server.tool('agent_list', 'List all agents', {
  status: z.string().optional().describe('Filter by status: active, paused, fired'),
}, async (params) => {
  const agents = listAgents(db, params.status);
  return { content: [{ type: 'text', text: JSON.stringify(agents, null, 2) }] };
});

server.tool('agent_pause', 'Pause an agent', {
  id: z.string(),
}, async (params) => {
  updateAgentStatus(db, params.id, 'paused');
  return { content: [{ type: 'text', text: `Paused agent ${params.id}` }] };
});

server.tool('agent_resume', 'Resume a paused agent', {
  id: z.string(),
}, async (params) => {
  updateAgentStatus(db, params.id, 'active');
  return { content: [{ type: 'text', text: `Resumed agent ${params.id}` }] };
});

server.tool('agent_fire', 'Remove an agent from the org', {
  id: z.string(),
}, async (params) => {
  updateAgentStatus(db, params.id, 'fired');
  return { content: [{ type: 'text', text: `Fired agent ${params.id}` }] };
});

// --- Task tools ---

server.tool('task_create', 'Create a new task', {
  title: z.string(),
  description: z.string().optional(),
  assignee: z.string().optional().describe('Agent ID to assign'),
  priority: z.number().optional().describe('Higher = more important'),
  parent_id: z.string().optional().describe('Parent task ID for subtasks'),
}, async (params, extra) => {
  const agentId = (extra as any)?.agentId;
  const id = createTask(db, { ...params, created_by: agentId });
  return { content: [{ type: 'text', text: `Created task ${id}: ${params.title}` }] };
});

server.tool('task_claim', 'Claim an unassigned task', {
  task_id: z.string(),
  agent_id: z.string(),
}, async (params) => {
  try {
    claimTask(db, params.task_id, params.agent_id);
    return { content: [{ type: 'text', text: `Agent ${params.agent_id} claimed task ${params.task_id}` }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

server.tool('task_complete', 'Mark a task as done', {
  task_id: z.string(),
  agent_id: z.string(),
}, async (params) => {
  try {
    completeTask(db, params.task_id, params.agent_id);
    return { content: [{ type: 'text', text: `Task ${params.task_id} completed` }] };
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

server.tool('task_list', 'List tasks with optional filters', {
  status: z.string().optional(),
  assignee: z.string().optional(),
}, async (params) => {
  const tasks = listTasks(db, params);
  return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
});

server.tool('task_update', 'Update task status', {
  task_id: z.string(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']),
  agent_id: z.string().optional(),
}, async (params) => {
  updateTaskStatus(db, params.task_id, params.status, params.agent_id);
  return { content: [{ type: 'text', text: `Task ${params.task_id} → ${params.status}` }] };
});

// --- Escalation tools ---

server.tool('escalate', 'Escalate an issue to a higher-level agent', {
  from_agent: z.string(),
  to_agent: z.string().optional().describe('Target agent (omit for auto-routing)'),
  task_id: z.string().optional(),
  reason: z.string(),
}, async (params) => {
  const id = escalate(db, params);
  return { content: [{ type: 'text', text: `Escalation ${id} created: ${params.reason}` }] };
});

server.tool('escalation_resolve', 'Resolve an escalation', {
  id: z.string(),
  agent_id: z.string(),
}, async (params) => {
  resolveEscalation(db, params.id, params.agent_id);
  return { content: [{ type: 'text', text: `Escalation ${params.id} resolved` }] };
});

server.tool('escalation_list', 'List escalations', {
  status: z.string().optional(),
}, async (params) => {
  const list = listEscalations(db, params.status);
  return { content: [{ type: 'text', text: JSON.stringify(list, null, 2) }] };
});

// --- Org status ---

server.tool('org_status', 'Get organization overview', {}, async () => {
  const status = orgStatus(db);
  return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
});

server.tool('event_log', 'Query the event log', {
  limit: z.number().optional().default(20),
  agent_id: z.string().optional(),
  event_type: z.string().optional(),
}, async (params) => {
  const events = getEvents(db, params);
  return { content: [{ type: 'text', text: JSON.stringify(events, null, 2) }] };
});

// --- HTTP server ---

const httpServer = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/mcp') {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined as any });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, agents: listAgents(db).length }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

httpServer.listen(PORT, () => {
  console.log(`OpenSpawn Coordinator running on http://localhost:${PORT}`);
  console.log(`MCP endpoint: POST http://localhost:${PORT}/mcp`);
  console.log(`DB: ${DB_PATH}`);
});
