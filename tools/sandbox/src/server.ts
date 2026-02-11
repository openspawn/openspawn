// ── Sandbox HTTP API Server ──────────────────────────────────────────────────
// Serves live simulation state to the BikiniBottom dashboard
// The dashboard polls this instead of using the in-memory SimulationEngine

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { getProvider, getProviderInfo, getModelName } from './llm.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Simulation } from './simulation.js';
import type { SandboxAgent, SandboxTask, SandboxEvent, ACPMessage } from './types.js';
import { loadAgentConfig, type AgentConfig } from './config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ORG_DIR = join(__dirname, '..', 'org');

const PORT = Number(process.env.SANDBOX_PORT) || 3333;

// Map agent domain → dashboard team ID (must match apps/dashboard/src/demo/teams.ts)
const DOMAIN_TEAM_MAP: Record<string, string> = {
  'operations': 'team-operations',
  'engineering': 'team-engineering',
  'backend': 'team-backend',
  'frontend': 'team-frontend',
  'testing': 'team-testing',
  'appsec': 'team-appsec',
  'infrastructure security': 'team-infrastructure security',
  'content strategy': 'team-content strategy',
  'copywriting': 'team-copywriting',
  'seo': 'team-seo',
  'marketing': 'team-marketing',
  'analytics': 'team-analytics',
  'accounting': 'team-accounting',
  'support': 'team-support',
  'technical support': 'team-technical support',
  'finance': 'team-finance',
};

function domainToTeamId(domain: string): string {
  const key = domain.toLowerCase();
  return DOMAIN_TEAM_MAP[key] ?? `team-${key}`;
}

// Map sandbox types to demo-data types (what the dashboard expects)
function mapAgent(agent: SandboxAgent, allAgents: SandboxAgent[]) {
  const levelToRole: Record<string, string> = {
    coo: 'MANAGER', talent: 'MANAGER', lead: 'MANAGER', senior: 'SENIOR', worker: 'WORKER', intern: 'WORKER',
  };
  const levelToReputation = (level: number) => {
    if (level >= 9) return 'ELITE';
    if (level >= 6) return 'VETERAN';
    if (level >= 3) return 'TRUSTED';
    if (level >= 2) return 'PROBATION';
    return 'NEW';
  };

  const trustScore = Math.min(100, 30 + agent.level * 7 + agent.stats.tasksCompleted * 2);

  return {
    id: agent.id,
    agentId: agent.id,
    name: agent.name,
    role: agent.domain?.toUpperCase() ?? levelToRole[agent.role] ?? 'WORKER',
    mode: agent.level >= 7 ? 'ORCHESTRATOR' : 'WORKER',
    status: agent.status === 'busy' ? 'ACTIVE' : agent.status.toUpperCase(),
    level: agent.level,
    model: getModelName(),
    currentBalance: Math.max(0, agent.stats.creditsEarned - agent.stats.creditsSpent),
    lifetimeEarnings: agent.stats.creditsEarned,
    budgetPeriodLimit: 10000,
    budgetPeriodSpent: agent.stats.creditsSpent,
    managementFeePct: agent.level >= 9 ? 5 : 10,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: agent.parentId === 'human-principal' ? null : (agent.parentId ?? null),
    domain: agent.domain ?? null,
    trustScore,
    reputationLevel: levelToReputation(agent.level),
    tasksCompleted: agent.stats.tasksCompleted,
    tasksSuccessful: agent.stats.tasksCompleted, // simplified
    lastActivityAt: new Date().toISOString(),
    lastPromotionAt: null,
    teamId: domainToTeamId(agent.domain),
    avatar: agent.avatar ?? null,
    systemPrompt: agent.systemPrompt,
    trigger: agent.trigger,
    triggerOn: agent.triggerOn ?? null,
    inboxSize: agent.inbox.length,
  };
}

const taskStatusMap: Record<string, string> = {
  backlog: 'BACKLOG',
  pending: 'TODO',
  assigned: 'TODO',
  in_progress: 'IN_PROGRESS',
  review: 'REVIEW',
  done: 'DONE',
  rejected: 'REVIEW',
  blocked: 'BLOCKED',
};

function mapTask(task: SandboxTask, agents: SandboxAgent[]) {
  const assignee = task.assigneeId ? agents.find(a => a.id === task.assigneeId) : null;
  return {
    id: task.id,
    identifier: task.id,
    title: task.title,
    description: task.description ?? null,
    status: taskStatusMap[task.status] ?? task.status.toUpperCase(),
    priority: task.priority.toUpperCase(),
    assigneeId: task.assigneeId ?? null,
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    creatorId: task.creatorId,
    approvalRequired: false,
    dueDate: null,
    createdAt: new Date(task.createdAt).toISOString(),
    updatedAt: new Date(task.updatedAt).toISOString(),
    completedAt: task.status === 'done' ? new Date(task.updatedAt).toISOString() : null,
    rejection: null,
  };
}

function mapEvent(event: SandboxEvent, agents: SandboxAgent[]) {
  const actor = event.agentId ? agents.find(a => a.id === event.agentId) : null;
  const severityMap: Record<string, string> = {
    system: 'INFO', agent_action: 'INFO', error: 'ERROR',
  };
  return {
    id: `evt-${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    type: event.type,
    actorId: event.agentId ?? null,
    actor: actor ? { id: actor.id, name: actor.name } : null,
    entityType: event.taskId ? 'task' : (event.agentId ? 'agent' : 'system'),
    entityId: event.taskId ?? event.agentId ?? 'system',
    severity: severityMap[event.type] ?? 'INFO',
    reasoning: event.message,
    createdAt: new Date(event.timestamp).toISOString(),
  };
}

// Generate credit transactions from metrics history (real time-series)
function generateCredits(sim: Simulation) {
  const credits: Array<Record<string, unknown>> = [];
  let runningBalance = 0;

  for (const snap of sim.metricsHistory) {
    const earned = snap.totalCreditsEarned;
    const spent = snap.totalCreditsSpent;
    runningBalance = earned - spent;

    credits.push({
      id: `credit-tick-${snap.tick}`,
      agentId: 'system',
      type: earned > spent ? 'CREDIT' : 'DEBIT',
      amount: Math.abs(earned - spent),
      reason: `Tick ${snap.tick} activity`,
      balanceAfter: runningBalance,
      createdAt: new Date(snap.timestamp).toISOString(),
      sourceTaskId: null,
      triggerType: 'system',
    });
  }

  // Also add per-agent entries
  for (const agent of sim.agents) {
    if (agent.stats.creditsEarned > 0) {
      credits.push({
        id: `credit-${agent.id}-earn`,
        agentId: agent.id,
        type: 'CREDIT',
        amount: agent.stats.creditsEarned,
        reason: 'Task completion rewards',
        balanceAfter: agent.stats.creditsEarned - agent.stats.creditsSpent,
        createdAt: new Date().toISOString(),
        sourceTaskId: null,
        triggerType: 'task_completion',
      });
    }
    if (agent.stats.creditsSpent > 0) {
      credits.push({
        id: `credit-${agent.id}-spend`,
        agentId: agent.id,
        type: 'DEBIT',
        amount: agent.stats.creditsSpent,
        reason: 'Model inference tokens',
        balanceAfter: agent.stats.creditsEarned - agent.stats.creditsSpent,
        createdAt: new Date().toISOString(),
        sourceTaskId: null,
        triggerType: 'model_usage',
      });
    }
  }
  return credits;
}

// Deduplicate ACPMessages (they exist in both sender and receiver recentMessages)
function collectAllMessages(agents: SandboxAgent[]): ACPMessage[] {
  const seen = new Set<string>();
  const all: ACPMessage[] = [];
  for (const agent of agents) {
    for (const msg of agent.recentMessages) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id);
        all.push(msg);
      }
    }
  }
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

const acpTypeIcon: Record<string, string> = {
  ack: '👍', completion: '✅', escalation: '🚨', delegation: '📋', progress: '📊', status_request: '💬',
};

// Generate messages from agent recentMessages (ACP format)
function generateMessages(agents: SandboxAgent[]) {
  const all = collectAllMessages(agents);
  const messages: Array<Record<string, unknown>> = [];
  for (const msg of all) {
    const from = agents.find(a => a.id === msg.from);
    const to = agents.find(a => a.id === msg.to);
    const icon = acpTypeIcon[msg.type] || '💬';
    messages.push({
      id: msg.id,
      fromAgentId: msg.from,
      toAgentId: msg.to,
      fromAgent: from ? { id: from.id, name: from.name, level: from.level } : null,
      toAgent: to ? { id: to.id, name: to.name, level: to.level } : null,
      content: `${icon} ${msg.body || msg.summary || msg.type}`,
      type: msg.type.toUpperCase(),
      acpType: msg.type,
      taskRef: msg.taskId || null,
      reason: msg.reason ?? null,
      pct: msg.pct ?? null,
      summary: msg.summary ?? null,
      read: true,
      createdAt: new Date(msg.timestamp).toISOString(),
    });
  }
  return messages.sort((a, b) =>
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
  );
}

function json(res: ServerResponse, data: unknown) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

export function startServer(sim: Simulation): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname;

    // GraphQL-compatible endpoint (handles all dashboard queries)
    if (path === '/graphql' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { query, variables } = JSON.parse(body);
          const opMatch = query?.match(/(?:query|mutation)\s+(\w+)/);
          const op = opMatch?.[1] ?? '';
          const result = handleGraphQL(op, variables ?? {}, sim);
          json(res, { data: result });
        } catch (err) {
          json(res, { errors: [{ message: String(err) }] });
        }
      });
      return;
    }

    // SSE stream — real-time agent activity
    if (path === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Optional filter by task or agent
      const taskFilter = url.searchParams.get('task');
      const agentFilter = url.searchParams.get('agent');

      const unsub = sim.onEvent((event) => {
        // Apply filters
        if (taskFilter && event.taskId !== taskFilter) return;
        if (agentFilter && event.agentId !== agentFilter) return;

        const data = JSON.stringify({
          type: event.type,
          agentId: event.agentId,
          taskId: event.taskId,
          message: event.message,
          timestamp: event.timestamp,
          agentName: event.agentId
            ? sim.agents.find(a => a.id === event.agentId)?.name
            : undefined,
        });
        res.write(`data: ${data}\n\n`);
      });

      // Send initial heartbeat
      res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stream connected' })}\n\n`);

      req.on('close', () => { unsub(); });
      return;
    }

    // Send order — inject a message from the Human Principal into COO's inbox
    if (path === '/api/order' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { message } = JSON.parse(body);
          if (!message) { json(res, { error: 'message required' }); return; }
          
          const coo = sim.agents.find(a => a.role === 'coo' || a.id.includes('mr-krabs') || a.id.includes('krabs') || a.level === 10);
          if (!coo) { json(res, { error: 'COO not found' }); return; }
          
          const orderMsg = {
            id: `acp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'delegation' as const,
            from: 'human-principal',
            to: coo.id,
            taskId: '',
            body: `[PRIORITY ORDER FROM HUMAN PRINCIPAL]: ${message}`,
            timestamp: Date.now(),
          };
          coo.recentMessages.push(orderMsg);
          // Also push to inbox so event-driven COO wakes up
          coo.inbox.push(orderMsg);

          // Also log as event
          sim.events.push({
            type: 'human_order',
            agentId: coo.id,
            message: `📢 Human Principal: ${message}`,
            timestamp: Date.now(),
          });

          json(res, { ok: true, message: 'Order delivered to Mr. Krabs' });
        } catch {
          json(res, { error: 'Invalid JSON' });
        }
      });
      return;
    }

    // Restart — reset simulation. ?mode=organic (default) or ?mode=full
    if (path === '/api/restart' && req.method === 'POST') {
      const mode = (url.searchParams.get('mode') === 'full' ? 'full' : 'organic') as 'organic' | 'full';
      sim.restart(mode).then(() => {
        const msg = mode === 'full'
          ? `Full reset with ${sim.agents.length} agents from ORG.md.`
          : 'Reset to COO only. Org will grow organically.';
        json(res, { ok: true, message: msg, agentCount: sim.agents.length, mode });
      });
      return;
    }

    // REST endpoints for debugging
    if (path === '/api/state') {
      json(res, {
        tick: sim.tick,
        agentCount: sim.agents.length,
        taskCount: sim.tasks.length,
        eventCount: sim.events.length,
        tasksDone: sim.tasks.filter(t => t.status === 'done').length,
      });
      return;
    }

    if (path === '/api/agents') {
      json(res, sim.agents.map(a => mapAgent(a, sim.agents)));
      return;
    }

    if (path === '/api/tasks') {
      json(res, sim.tasks.map(t => mapTask(t, sim.agents)));
      return;
    }

    if (path === '/api/events') {
      json(res, sim.events.slice(-100).map(e => mapEvent(e, sim.agents)));
      return;
    }

    // Task activity log (ACP messages)
    if (path.startsWith('/api/task/') && path.endsWith('/activity')) {
      const taskId = path.split('/')[3];
      const task = sim.tasks.find(t => t.id === taskId);
      if (task) {
        json(res, task.activityLog.map(m => ({
          id: m.id,
          type: m.type,
          from: m.from,
          fromName: sim.agents.find(a => a.id === m.from)?.name ?? m.from,
          to: m.to,
          toName: sim.agents.find(a => a.id === m.to)?.name ?? m.to,
          body: m.body,
          reason: m.reason,
          summary: m.summary,
          pct: m.pct,
          timestamp: m.timestamp,
        })));
      } else {
        // Fallback to events
        const taskEvents = sim.events.filter(e => e.taskId === taskId);
        json(res, taskEvents.map(e => ({
          agentId: e.agentId,
          agentName: e.agentId ? sim.agents.find(a => a.id === e.agentId)?.name : null,
          message: e.message,
          timestamp: e.timestamp,
        })));
      }
      return;
    }

    // Agent messages endpoint
    if (path.startsWith('/api/agent/') && path.endsWith('/messages')) {
      const agentId = path.split('/')[3];
      const all = collectAllMessages(sim.agents);
      const agentMsgs = all.filter(m => m.from === agentId || m.to === agentId)
        .sort((a, b) => a.timestamp - b.timestamp);
      json(res, agentMsgs);
      return;
    }

    // Metrics time-series for sparklines / charts
    if (path === '/api/metrics') {
      json(res, sim.metricsHistory);
      return;
    }

    // LLM provider info (read-only — model cannot be changed via API)
    if (path === '/api/models') {
      json(res, {
        provider: getProvider(),
        providerInfo: getProviderInfo(),
        currentModel: getModelName(),
        locked: true, // Users cannot change models via the dashboard
        availableModels: getProvider() === 'groq' ? [
          { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', rpm: 30, rpd: '14.4K', active: getModelName() === 'llama-3.1-8b-instant' },
          { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', rpm: 30, rpd: '1K', active: getModelName() === 'llama-3.3-70b-versatile' },
          { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', rpm: 30, rpd: '1K', active: getModelName() === 'meta-llama/llama-4-scout-17b-16e-instruct' },
          { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', rpm: 60, rpd: '1K', active: getModelName() === 'qwen/qwen3-32b' },
        ] : [],
      });
      return;
    }

    // ACP-specific metrics (ack latency, escalation rate, delegation depth, completion rate)
    if (path === '/api/metrics/acp') {
      const allMessages = collectAllMessages(sim.agents);
      const tasks = sim.tasks;

      // Count by type
      let totalAcks = 0;
      let totalEscalations = 0;
      let totalCompletions = 0;
      let totalDelegations = 0;
      const escalationsByReason: Record<string, number> = {};

      // For ack latency: match delegation→ack pairs by taskId
      const delegationTimestamps = new Map<string, number>(); // taskId+to → timestamp
      const ackLatencies: number[] = [];

      for (const msg of allMessages) {
        switch (msg.type) {
          case 'ack':
            totalAcks++;
            {
              const key = `${msg.taskId}::${msg.from}`;
              const delegationTs = delegationTimestamps.get(key);
              if (delegationTs) {
                ackLatencies.push(msg.timestamp - delegationTs);
              }
            }
            break;
          case 'delegation':
            totalDelegations++;
            delegationTimestamps.set(`${msg.taskId}::${msg.to}`, msg.timestamp);
            break;
          case 'escalation':
            totalEscalations++;
            if (msg.reason) {
              escalationsByReason[msg.reason] = (escalationsByReason[msg.reason] || 0) + 1;
            }
            break;
          case 'completion':
            totalCompletions++;
            break;
        }
      }

      // Also scan task activityLogs for messages not in agent recentMessages
      for (const task of tasks) {
        for (const msg of task.activityLog) {
          // Only count if not already seen (activityLog may overlap with recentMessages)
          // We use the counts above as primary; activityLog provides delegation depth info
        }
      }

      // Avg delegation depth: count delegation hops per task
      const taskDelegationCounts = new Map<string, number>();
      for (const msg of allMessages) {
        if (msg.type === 'delegation' && msg.taskId) {
          taskDelegationCounts.set(msg.taskId, (taskDelegationCounts.get(msg.taskId) || 0) + 1);
        }
      }
      const depthValues = Array.from(taskDelegationCounts.values());
      const avgDelegationDepth = depthValues.length > 0
        ? depthValues.reduce((a, b) => a + b, 0) / depthValues.length
        : 0;

      // Completion rate: completed vs total non-backlog tasks
      const nonBacklogTasks = tasks.filter(t => t.status !== 'backlog');
      const doneTasks = tasks.filter(t => t.status === 'done');
      const completionRate = nonBacklogTasks.length > 0
        ? doneTasks.length / nonBacklogTasks.length
        : 0;

      // Escalation rate: escalated tasks vs total tasks
      const escalationRate = tasks.length > 0
        ? totalEscalations / tasks.length
        : 0;

      // Ack latency average
      const ackLatencyMs = ackLatencies.length > 0
        ? ackLatencies.reduce((a, b) => a + b, 0) / ackLatencies.length
        : 0;

      json(res, {
        ackLatencyMs: Math.round(ackLatencyMs),
        escalationRate: Math.round(escalationRate * 100) / 100,
        avgDelegationDepth: Math.round(avgDelegationDepth * 10) / 10,
        completionRate: Math.round(completionRate * 100) / 100,
        totalAcks,
        totalEscalations,
        totalCompletions,
        totalDelegations,
        escalationsByReason,
      });
      return;
    }

    // PUT /api/agent/:id/trigger — change trigger mode
    if (path.match(/^\/api\/agent\/[^/]+\/trigger$/) && req.method === 'PUT') {
      const agentId = path.split('/')[3];
      let body = '';
      req.on('data', (chunk: string) => body += chunk);
      req.on('end', () => {
        try {
          const { trigger, triggerOn } = JSON.parse(body);
          const agent = sim.agents.find(a => a.id === agentId);
          if (!agent) { json(res, { error: 'Agent not found' }); return; }
          if (trigger !== 'polling' && trigger !== 'event-driven') {
            json(res, { error: 'trigger must be "polling" or "event-driven"' }); return;
          }
          agent.trigger = trigger;
          if (triggerOn) agent.triggerOn = triggerOn;
          json(res, { ok: true, trigger: agent.trigger, triggerOn: agent.triggerOn ?? null });
        } catch { json(res, { error: 'Invalid JSON' }); }
      });
      return;
    }

    // GET /api/agent/:id/config — get agent config from org directory
    if (path.match(/^\/api\/agent\/[^/]+\/config$/) && req.method === 'GET') {
      const agentId = path.split('/')[3];
      const config = loadAgentConfig(agentId, ORG_DIR);
      json(res, config);
      return;
    }

    // PUT /api/agent/:id/config — update a config file
    if (path.match(/^\/api\/agent\/[^/]+\/config$/) && req.method === 'PUT') {
      const agentId = path.split('/')[3];
      let body = '';
      req.on('data', (chunk: string) => body += chunk);
      req.on('end', () => {
        try {
          const { file, content } = JSON.parse(body);
          const allowedFiles = ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'IDENTITY.md'];
          if (!allowedFiles.includes(file)) {
            json(res, { error: `file must be one of: ${allowedFiles.join(', ')}` }); return;
          }
          const agentDir = join(ORG_DIR, 'agents', agentId);
          mkdirSync(agentDir, { recursive: true });
          writeFileSync(join(agentDir, file), content, 'utf-8');
          json(res, { ok: true });
        } catch { json(res, { error: 'Invalid JSON' }); }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 Sandbox API: http://0.0.0.0:${PORT}`);
    console.log(`   Dashboard GraphQL: http://0.0.0.0:${PORT}/graphql`);
    console.log(`   Debug: http://0.0.0.0:${PORT}/api/state`);
  });
}

// Handle GraphQL operations (same interface as mock-fetcher.ts)
function handleGraphQL(
  op: string,
  variables: Record<string, unknown>,
  sim: Simulation,
): Record<string, unknown> {
  const agents = sim.agents;
  const tasks = sim.tasks;
  const events = sim.events;

  switch (op) {
    case 'Agents':
      return { agents: agents.map(a => mapAgent(a, agents)) };

    case 'Agent': {
      const agent = agents.find(a => a.id === variables.id);
      return { agent: agent ? mapAgent(agent, agents) : null };
    }

    case 'Tasks':
      return { tasks: tasks.map(t => mapTask(t, agents)) };

    case 'Task': {
      const task = tasks.find(t => t.id === variables.id);
      return { task: task ? mapTask(task, agents) : null };
    }

    case 'CreditHistory':
    case 'Credits':
      return { creditHistory: generateCredits(sim) };

    case 'Events': {
      const limit = (variables.limit as number) ?? 50;
      const mapped = events.slice(-limit).reverse().map(e => mapEvent(e, agents));
      return { events: mapped };
    }

    case 'Messages': {
      const limit = (variables.limit as number) ?? 50;
      return { messages: generateMessages(agents).slice(0, limit) };
    }

    case 'AgentReputation': {
      const agent = agents.find(a => a.id === variables.id);
      if (!agent) return { agentReputation: null };
      const ts = Math.min(100, 30 + agent.level * 7 + agent.stats.tasksCompleted * 2);
      return {
        agentReputation: {
          trustScore: ts,
          reputationLevel: ts >= 86 ? 'ELITE' : ts >= 71 ? 'VETERAN' : ts >= 41 ? 'TRUSTED' : 'PROBATION',
          tasksCompleted: agent.stats.tasksCompleted,
          tasksSuccessful: agent.stats.tasksCompleted,
          successRate: 100,
          lastActivityAt: new Date().toISOString(),
          promotionProgress: null,
        },
      };
    }

    case 'TrustLeaderboard': {
      const sorted = [...agents]
        .map(a => ({ ...mapAgent(a, agents) }))
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, 10);
      return { trustLeaderboard: sorted };
    }

    case 'Conversations': {
      // Build conversations from ACPMessages grouped by agent pairs
      const all = collectAllMessages(agents);
      const pairMap = new Map<string, ACPMessage[]>();
      for (const m of all) {
        const key = [m.from, m.to].sort().join('::');
        if (!pairMap.has(key)) pairMap.set(key, []);
        pairMap.get(key)!.push(m);
      }
      const conversations = Array.from(pairMap.entries()).map(([key, msgs]) => {
        const [a, b] = key.split('::');
        const agentA = agents.find(ag => ag.id === a);
        const agentB = agents.find(ag => ag.id === b);
        const last = msgs[msgs.length - 1];
        return {
          id: `conv-${key}`,
          participants: [
            agentA ? { id: agentA.id, name: agentA.name } : { id: a, name: a },
            agentB ? { id: agentB.id, name: agentB.name } : { id: b, name: b },
          ],
          lastMessage: last.body || last.summary || last.type,
          lastMessageAt: new Date(last.timestamp).toISOString(),
          messageCount: msgs.length,
        };
      }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      return { conversations };
    }

    default:
      return {};
  }
}
