// ── Markdown Decision Engine ────────────────────────────────────────────────
// Builds lean markdown prompts for LLM agents and parses structured decisions
// from free-form markdown responses.

import type { SandboxAgent, SandboxTask, ACPMessage } from './types.js';
import { loadAgentConfig, buildSystemPrompt } from './config-loader.js';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORG_DIR = resolve(__dirname, '..', 'org');

// ── Types ───────────────────────────────────────────────────────────────────

export type DecisionAction = 'delegate' | 'escalate' | 'complete' | 'work' | 'message' | 'hire' | 'idle';

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

// ── Agent Config Cache ──────────────────────────────────────────────────────

const soulCache = new Map<string, string>();

function getAgentSoul(agentId: string): string {
  if (soulCache.has(agentId)) return soulCache.get(agentId)!;
  const config = loadAgentConfig(agentId, ORG_DIR);
  const soul = buildSystemPrompt(config);
  soulCache.set(agentId, soul);
  return soul;
}

// ── Prompt Builder ──────────────────────────────────────────────────────────

const VALID_ACTIONS: DecisionAction[] = ['delegate', 'escalate', 'complete', 'work', 'message', 'hire', 'idle'];

export function buildAgentPrompt(agent: SandboxAgent, state: SimulationState): string {
  const { agents, tasks, tick } = state;

  // Load agent's soul/personality
  const soul = getAgentSoul(agent.id);

  // Manager info
  const parent = agent.parentId ? agents.find(a => a.id === agent.parentId) : undefined;
  const managerLine = parent ? `**Manager:** ${parent.name} (${parent.id})` : '**Manager:** Human Principal';

  // Tasks: owned, created, or in this agent's domain that are unassigned
  const myTasks = tasks.filter(t =>
    t.assigneeId === agent.id ||
    t.creatorId === agent.id
  );
  const activeTasks = myTasks.filter(t => !['done', 'rejected'].includes(t.status));
  const assignedToMe = activeTasks.filter(t => t.assigneeId === agent.id);
  const iCreated = activeTasks.filter(t => t.creatorId === agent.id && t.assigneeId !== agent.id);

  let taskSection = '';
  if (assignedToMe.length > 0) {
    taskSection += '**Assigned to you (DO THESE FIRST):**\n';
    taskSection += assignedToMe.map(t =>
      `- ${t.id}: "${t.title}" [${t.status}, ${t.priority}]`
    ).join('\n');
    taskSection += '\n';
  }
  if (iCreated.length > 0) {
    taskSection += '**Tasks you created (track progress):**\n';
    taskSection += iCreated.map(t => {
      const assignee = t.assigneeId ? agents.find(a => a.id === t.assigneeId) : undefined;
      return `- ${t.id}: "${t.title}" [${t.status}] → ${assignee?.name ?? 'unassigned'}`;
    }).join('\n');
    taskSection += '\n';
  }

  // Unassigned tasks in the system (for managers to delegate)
  if (agent.level >= 7) {
    const unassigned = tasks.filter(t =>
      !t.assigneeId && !['done', 'rejected'].includes(t.status)
    );
    if (unassigned.length > 0) {
      taskSection += `**Unassigned tasks (${unassigned.length} — delegate these!):**\n`;
      taskSection += unassigned.slice(0, 8).map(t =>
        `- ${t.id}: "${t.title}" [${t.priority}]`
      ).join('\n');
      if (unassigned.length > 8) taskSection += `\n- ... and ${unassigned.length - 8} more`;
      taskSection += '\n';
    }
  }

  if (!taskSection.trim()) {
    taskSection = '(no tasks — look for unassigned work or wait)\n';
  }

  // Direct reports
  const team = agents.filter(a => a.parentId === agent.id && a.status === 'active');
  const teamLines = team.length > 0
    ? team.map(a => {
        const agentTasks = tasks.filter(t => t.assigneeId === a.id && !['done', 'rejected'].includes(t.status));
        const label = agentTasks.length > 0 ? `working (${agentTasks.length} tasks)` : 'idle';
        return `- ${a.name} (${a.id}, L${a.level}) — ${label}`;
      }).join('\n')
    : '(no direct reports — you must WORK on tasks yourself or ESCALATE)';

  // Pending reports (not yet spawned)
  const pendingTeam = agents.filter(a => a.parentId === agent.id && a.status === 'pending');
  const pendingLine = pendingTeam.length > 0
    ? `\n*(${pendingTeam.length} more team members joining soon)*`
    : '';

  // Inbox — recent messages TO this agent
  const inbox = agent.recentMessages
    .filter(m => m.to === agent.id)
    .slice(-5);
  const inboxLines = inbox.length > 0
    ? inbox.map(m => {
        const sender = agents.find(a => a.id === m.from);
        return `- [${m.type}] ${sender?.name ?? m.from}: ${m.body || m.summary || '(no body)'}`;
      }).join('\n')
    : '(empty)';

  // Global situation awareness
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const activeTotalTasks = tasks.filter(t => !['done', 'rejected'].includes(t.status)).length;

  // Build the actions list based on agent level
  let actionsBlock = `**Actions (choose ONE — priority order!):**`;

  if (agent.level >= 7) {
    // Managers: delegate first, then work
    actionsBlock += `
1. **delegate** — assign a task to a direct report (PREFERRED for managers)
2. **work** — do work on a task yourself (describe what you did)
3. **escalate** — ask your manager for help when stuck
4. **complete** — mark a task done (ONLY if status is in_progress or review)
5. **message** — send needed info to another agent (NOT chitchat — must be task-related)
6. **hire** — spawn a new temporary agent (costs credits, use when understaffed)
7. **idle** — truly nothing to do (rare)`;
  } else {
    // Workers: work first
    actionsBlock += `
1. **work** — do work on your assigned task (PREFERRED — describe what you did)
2. **complete** — mark a task done (ONLY if you already worked on it and it's in_progress)
3. **escalate** — ask your manager for help when stuck
4. **message** — send needed info to another agent (NOT chitchat — must be task-related)
5. **idle** — truly nothing to do (rare)`;
  }

  actionsBlock += `

⚠️ RULES:
- You CANNOT complete a task unless you already used "work" on it (status must be in_progress)
- "message" is NOT for chatting — only for requesting/sending task-critical information
- If you have assigned tasks, you MUST work on them before doing anything else`;

  return `# You are ${agent.name}
**Role:** ${agent.role} | **Domain:** ${agent.domain} | **Level:** ${agent.level}
${managerLine}

${soul ? `## Personality\n${soul}\n` : ''}## Situation
Tick ${tick} | ${totalTasks} total tasks | ${doneTasks} done | ${activeTotalTasks} active

## Your Tasks
${taskSection}
## Your Direct Reports (delegate ONLY to these agents)
${teamLines}${pendingLine}

## Inbox
${inboxLines}

${actionsBlock}

## Your Decision
Respond with EXACTLY this format (one action only):

- Action: [work|delegate|complete|message|escalate|hire|idle]
- Target: [agent id or "none"]
- Task: [TASK-XXXX or "new: description"]
- Message: [brief description of what you're doing and why]`;
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
