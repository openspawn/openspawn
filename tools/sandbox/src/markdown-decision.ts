// ── Markdown Decision Engine ────────────────────────────────────────────────
// Builds lean markdown prompts for LLM agents and parses structured decisions
// from free-form markdown responses.

import type { SandboxAgent, SandboxTask, ACPMessage } from './types.js';

// ── Types ───────────────────────────────────────────────────────────────────

export type DecisionAction = 'delegate' | 'escalate' | 'complete' | 'message' | 'hire';

export interface AgentDecision {
  action: DecisionAction;
  target: string;
  task: string;
  message: string;
  raw: string;
}

export interface SimulationState {
  agents: SandboxAgent[];
  tasks: SandboxTask[];
  tick: number;
}

// ── Prompt Builder ──────────────────────────────────────────────────────────

const VALID_ACTIONS: DecisionAction[] = ['delegate', 'escalate', 'complete', 'message', 'hire'];

export function buildAgentPrompt(agent: SandboxAgent, state: SimulationState): string {
  const { agents, tasks } = state;

  // Header
  const parent = agent.parentId ? agents.find(a => a.id === agent.parentId) : undefined;
  const managerLine = parent ? `Manager: ${parent.name} (${parent.role})` : 'Manager: none (you report to the Human Principal)';

  // Tasks owned or created by this agent
  const myTasks = tasks.filter(t => t.assigneeId === agent.id || t.creatorId === agent.id);
  const taskLines = myTasks.length > 0
    ? myTasks.map(t => {
        const assignee = t.assigneeId ? agents.find(a => a.id === t.assigneeId) : undefined;
        const assigneeLabel = assignee ? assignee.name : 'unassigned';
        return `- ${t.id}: ${t.title} [${t.status}, ${t.priority}] → ${assigneeLabel}`;
      }).join('\n')
    : '- (no tasks yet)';

  // Direct reports
  const team = agents.filter(a => a.parentId === agent.id && a.status === 'active');
  const teamLines = team.length > 0
    ? team.map(a => {
        const busy = tasks.some(t => t.assigneeId === a.id && !['done', 'rejected', 'backlog'].includes(t.status));
        return `- ${a.name} (L${a.level} ${a.role}) — ${busy ? 'busy' : 'idle'}`;
      }).join('\n')
    : '- (no direct reports)';

  // Inbox — recent messages TO this agent
  const inbox = agent.recentMessages
    .filter(m => m.to === agent.id)
    .slice(-5);
  const inboxLines = inbox.length > 0
    ? inbox.map(m => {
        const sender = agents.find(a => a.id === m.from);
        const senderName = sender?.name ?? m.from;
        return `- [From ${senderName}]: ${m.body || m.summary || m.type}`;
      }).join('\n')
    : '- (empty)';

  return `# ${agent.name} — ${agent.role} (${agent.domain}, L${agent.level})
${managerLine}

## Your Tasks
${taskLines}

## Your Team
${teamLines}

## Inbox
${inboxLines}

## Decide
Pick ONE action and respond in this exact format:

## Decision
- Action: [delegate|escalate|complete|message|hire]
- Target: [agent name or "none"]
- Task: [TASK-XX or "new: description"]
- Message: [what you want to say]`;
}

// ── Response Parser ─────────────────────────────────────────────────────────

export function parseDecision(response: string): AgentDecision | null {
  const actionMatch = response.match(/Action:\s*(\w+)/i);
  const targetMatch = response.match(/Target:\s*([^\n]+)/i);
  const taskMatch = response.match(/Task:\s*([^\n]+)/i);
  const messageMatch = response.match(/Message:\s*([^\n]+)/i);

  if (!actionMatch) return null;

  const action = actionMatch[1].toLowerCase() as DecisionAction;
  if (!VALID_ACTIONS.includes(action)) return null;

  return {
    action,
    target: targetMatch?.[1]?.trim() ?? 'none',
    task: taskMatch?.[1]?.trim() ?? '',
    message: messageMatch?.[1]?.trim() ?? '',
    raw: response,
  };
}

// ── Agent ID Resolver ───────────────────────────────────────────────────────

/** Fuzzy-match a human-readable name to an agent ID */
export function resolveAgentId(name: string, agents: SandboxAgent[]): string | undefined {
  if (!name || name === 'none') return undefined;

  const trimmed = name.trim();

  // Exact ID match
  const byId = agents.find(a => a.id === trimmed);
  if (byId) return byId.id;

  // Exact name match (case-insensitive)
  const byName = agents.find(a => a.name.toLowerCase() === trimmed.toLowerCase());
  if (byName) return byName.id;

  // Name contains (case-insensitive)
  const lower = trimmed.toLowerCase();
  const byContains = agents.find(a => a.name.toLowerCase().includes(lower));
  if (byContains) return byContains.id;

  // First-name match
  const firstName = lower.split(/\s+/)[0];
  if (firstName.length >= 2) {
    const byFirst = agents.find(a => a.name.toLowerCase().startsWith(firstName));
    if (byFirst) return byFirst.id;
  }

  // Partial ID match
  const byPartialId = agents.find(a => a.id.includes(lower.replace(/\s+/g, '-')));
  if (byPartialId) return byPartialId.id;

  return undefined;
}
