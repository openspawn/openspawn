// ── Shared Decision Executor ────────────────────────────────────────────────
// Extracted from LLMSimulation so both LLM and Replay engines can use it.

import { resolveAgentId, type AgentDecision } from './markdown-decision.js';
import { makeAgentPublic } from './agents.js';
import type { SandboxAgent, SandboxTask, ACPMessage } from './types.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

let executorTaskCounter = 20000;
function nextExecutorTaskId(): string {
  return `TASK-${String(++executorTaskCounter).padStart(4, '0')}`;
}

function acpId(): string {
  return `acp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createACPMessage(
  type: ACPMessage['type'],
  from: string,
  to: string,
  taskId: string,
  extra?: Partial<ACPMessage>,
): ACPMessage {
  return { id: acpId(), type, from, to, taskId, timestamp: Date.now(), ...extra };
}

function pushMessage(agents: SandboxAgent[], msg: ACPMessage): void {
  for (const agent of agents) {
    if (agent.id === msg.from || agent.id === msg.to) {
      agent.recentMessages.push(msg);
      if (agent.recentMessages.length > 10) {
        agent.recentMessages = agent.recentMessages.slice(-10);
      }
    }
    if (agent.id === msg.to && agent.trigger === 'event-driven') {
      if (!agent.triggerOn || agent.triggerOn.includes(msg.type)) {
        agent.inbox.push(msg);
      }
    }
  }
}

// ── Context for execution ───────────────────────────────────────────────────

export interface ExecutionContext {
  agents: SandboxAgent[];
  tasks: SandboxTask[];
  parsedOrgAgents?: SandboxAgent[];
}

// ── Executor ────────────────────────────────────────────────────────────────

export function executeDecision(
  agent: SandboxAgent,
  decision: AgentDecision,
  ctx: ExecutionContext,
): void {
  switch (decision.action) {
    case 'delegate':
      executeDelegation(agent, decision, ctx);
      break;
    case 'escalate':
      executeEscalation(agent, decision, ctx);
      break;
    case 'complete':
      executeCompletion(agent, decision, ctx);
      break;
    case 'message':
      executeMessage(agent, decision, ctx);
      break;
    case 'hire':
      executeHire(agent, decision, ctx);
      break;
  }
}

function resolveTask(taskRef: string, agent: SandboxAgent, tasks: SandboxTask[]): SandboxTask | undefined {
  if (!taskRef || taskRef === 'none') return undefined;
  const byId = tasks.find(t => t.id === taskRef);
  if (byId) return byId;
  const upper = taskRef.toUpperCase();
  return tasks.find(t => t.id === upper) ||
    tasks.find(t => t.assigneeId === agent.id && !['done', 'rejected'].includes(t.status));
}

function createTask(title: string, creator: SandboxAgent, tasks: SandboxTask[]): SandboxTask {
  const task: SandboxTask = {
    id: nextExecutorTaskId(),
    title,
    description: title,
    priority: 'high',
    status: 'backlog',
    creatorId: creator.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    activityLog: [],
    acked: false,
  };
  tasks.push(task);
  return task;
}

function executeDelegation(agent: SandboxAgent, decision: AgentDecision, ctx: ExecutionContext): void {
  const targetId = resolveAgentId(decision.target, ctx.agents);
  const target = targetId ? ctx.agents.find(a => a.id === targetId) : undefined;
  if (!target) {
    console.log(`  ⚠️ ${agent.name}: delegate target "${decision.target}" not found`);
    return;
  }

  let task = resolveTask(decision.task, agent, ctx.tasks);
  if (!task) {
    const title = decision.task.replace(/^new:\s*/i, '').trim() || decision.message.slice(0, 80);
    task = createTask(title, agent, ctx.tasks);
  }

  task.assigneeId = target.id;
  task.status = 'assigned';
  if (!target.taskIds.includes(task.id)) target.taskIds.push(task.id);

  const msg = createACPMessage('delegation', agent.id, target.id, task.id, {
    body: decision.message || `Delegating "${task.title}" to ${target.name}`,
  });
  pushMessage(ctx.agents, msg);
  task.activityLog.push(msg);
  agent.stats.messagessSent++;

  const ack = createACPMessage('ack', target.id, agent.id, task.id, {
    body: `Acknowledged: "${task.title}"`,
  });
  pushMessage(ctx.agents, ack);
  task.activityLog.push(ack);
  task.acked = true;
}

function executeEscalation(agent: SandboxAgent, decision: AgentDecision, ctx: ExecutionContext): void {
  const parent = agent.parentId ? ctx.agents.find(a => a.id === agent.parentId) : undefined;
  if (!parent) return;

  const task = resolveTask(decision.task, agent, ctx.tasks);
  const taskId = task?.id ?? '';

  const msg = createACPMessage('escalation', agent.id, parent.id, taskId, {
    reason: 'BLOCKED',
    body: decision.message || `Escalating: ${decision.task}`,
  });
  pushMessage(ctx.agents, msg);
  if (task) task.activityLog.push(msg);
  agent.stats.messagessSent++;
}

function executeCompletion(agent: SandboxAgent, decision: AgentDecision, ctx: ExecutionContext): void {
  const task = resolveTask(decision.task, agent, ctx.tasks);
  if (!task) return;

  task.status = 'done';
  task.updatedAt = Date.now();
  agent.stats.tasksCompleted++;
  agent.stats.creditsEarned += task.priority === 'critical' ? 100 : task.priority === 'high' ? 50 : 25;

  const parent = agent.parentId ? ctx.agents.find(a => a.id === agent.parentId) : undefined;
  if (parent) {
    const msg = createACPMessage('completion', agent.id, parent.id, task.id, {
      summary: decision.message || `Completed: "${task.title}"`,
      body: `Completed: "${task.title}"`,
    });
    pushMessage(ctx.agents, msg);
    task.activityLog.push(msg);
    agent.stats.messagessSent++;
  }
}

function executeMessage(agent: SandboxAgent, decision: AgentDecision, ctx: ExecutionContext): void {
  const targetId = resolveAgentId(decision.target, ctx.agents);
  if (!targetId) return;

  const task = resolveTask(decision.task, agent, ctx.tasks);
  const msg = createACPMessage('status_request', agent.id, targetId, task?.id ?? '', {
    body: decision.message,
  });
  pushMessage(ctx.agents, msg);
  agent.stats.messagessSent++;
}

function executeHire(agent: SandboxAgent, decision: AgentDecision, ctx: ExecutionContext): void {
  const roster = ctx.parsedOrgAgents || [];
  const notYetHired = roster.filter(r => !ctx.agents.find(a => a.id === r.id));

  const domain = decision.task.replace(/^new:\s*/i, '').trim() || agent.domain;
  const candidate = notYetHired.find(r =>
    r.domain?.toLowerCase().includes(domain.toLowerCase())
  ) || notYetHired[0];

  if (candidate) {
    candidate.parentId = agent.id;
    candidate.status = 'active';
    ctx.agents.push(candidate);

    const msg = createACPMessage('delegation', agent.id, candidate.id, '', {
      body: decision.message || `Welcome aboard, ${candidate.name}!`,
    });
    pushMessage(ctx.agents, msg);
    agent.stats.messagessSent++;
    console.log(`  🐣 ${agent.name} hired ${candidate.name} (L${candidate.level} ${candidate.domain})`);
  } else {
    const name = decision.target !== 'none' ? decision.target : `${domain} Worker`;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!ctx.agents.find(a => a.id === id)) {
      const newAgent = makeAgentPublic(id, name, 'worker', 4, domain, agent.id, `Hired by ${agent.name}`);
      newAgent.status = 'active';
      ctx.agents.push(newAgent);
      console.log(`  🐣 ${agent.name} created ${name} (L4 ${domain})`);
    }
  }
}
