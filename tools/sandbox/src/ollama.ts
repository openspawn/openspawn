// ── Ollama Client ────────────────────────────────────────────────────────────
// Handles inference calls with concurrency limiting and retries

import type { SandboxAgent, SandboxTask, AgentAction, SandboxConfig, ACPMessage } from './types.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message: { content: string };
  total_duration: number;
  eval_count: number;
}

// Semaphore for concurrency limiting
class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    return new Promise(resolve => this.queue.push(() => { this.running++; resolve(); }));
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

let semaphore: Semaphore;

export function initOllama(config: SandboxConfig): void {
  semaphore = new Semaphore(config.maxConcurrentInferences);
}

/** Call Ollama and get a parsed action from an agent */
export async function getAgentDecision(
  agent: SandboxAgent,
  context: string,
  config: SandboxConfig,
): Promise<AgentAction> {
  await semaphore.acquire();
  try {
    const messages: OllamaMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: context },
    ];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages,
        options: {
          temperature: 0.7,
          num_predict: 256,  // Keep responses short
        },
        // Disable thinking mode for qwen3 — it eats tokens and returns empty content
        think: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as OllamaResponse;
    const raw = data.message.content.trim();

    // Track inference cost
    agent.stats.creditsSpent += data.eval_count; // tokens as proxy

    // Parse JSON from response (handle markdown code blocks, broken JSON)
    let jsonStr = raw;
    
    // Strip markdown code fences
    jsonStr = jsonStr.replace(/^```json?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim();
    
    // Strip leading non-JSON chars (bullets, whitespace)
    jsonStr = jsonStr.replace(/^[^{]*/, '');
    
    // Find the JSON object — use brace counting for nested objects
    const start = jsonStr.indexOf('{');
    if (start >= 0) {
      let depth = 0;
      let end = start;
      for (let i = start; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') depth++;
        else if (jsonStr[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      jsonStr = jsonStr.substring(start, end + 1);
    }
    
    try {
      const action = JSON.parse(jsonStr) as AgentAction;
      return action;
    } catch {
      // Try fixing common 0.6B mistakes: "key", instead of "key":
      const fixed = jsonStr.replace(/"([^"]+)"\s*,\s*"/g, '"$1":"');
      try {
        return JSON.parse(fixed) as AgentAction;
      } catch {
        if (config.verbose) {
          console.log(`  ⚠ ${agent.name} unparseable: ${jsonStr.substring(0, 120)}`);
        }
        return { action: 'idle' };
      }
    }
  } finally {
    semaphore.release();
  }
}

/** Build context string for an agent's turn */
export function buildContext(
  agent: SandboxAgent,
  allAgents: SandboxAgent[],
  tasks: SandboxTask[],
  recentEvents: string[],
): string {
  const lines: string[] = [];

  // Inbox messages (for event-driven agents)
  if (agent.inbox.length > 0) {
    lines.push(`== INBOX (REQUIRES YOUR ATTENTION) ==`);
    for (const msg of agent.inbox) {
      const fromAgent = allAgents.find(a => a.id === msg.from);
      const fromName = fromAgent?.name ?? msg.from;
      const content = msg.body || msg.summary || msg.type;
      lines.push(`- [${msg.type}] From ${fromName}: "${content}"`);
    }
    lines.push('');
  }

  // Your info
  lines.push(`== YOUR STATUS ==`);
  lines.push(`ID: ${agent.id} | Level: ${agent.level} | Domain: ${agent.domain}`);
  lines.push(`Tasks completed: ${agent.stats.tasksCompleted} | Credits: ${agent.stats.creditsEarned - agent.stats.creditsSpent}`);

  // Your team — show IDs prominently so the model uses them
  const children = allAgents.filter(a => a.parentId === agent.id);
  if (children.length > 0) {
    lines.push(`\n== YOUR DIRECT REPORTS (use targetAgentId exactly) ==`);
    for (const c of children) {
      const cTasks = tasks.filter(t => t.assigneeId === c.id && t.status !== 'done');
      lines.push(`- ID="${c.id}" ${c.name} [${c.domain}] ${cTasks.length} tasks`);
    }
  }

  // Your manager
  if (agent.parentId) {
    const parent = allAgents.find(a => a.id === agent.parentId);
    if (parent) lines.push(`\nManager: ${parent.name} (${parent.id})`);
  }

  // Your tasks
  const myTasks = tasks.filter(t => t.assigneeId === agent.id && t.status !== 'done');
  const pendingDelegation = tasks.filter(t => t.creatorId === agent.id && t.status === 'pending' && !t.assigneeId);
  
  if (myTasks.length > 0) {
    lines.push(`\n== YOUR ASSIGNED TASKS ==`);
    for (const t of myTasks) {
      lines.push(`- [${t.id}] "${t.title}" (${t.priority}) — ${t.status}`);
    }
  }

  if (pendingDelegation.length > 0) {
    lines.push(`\n== TASKS AWAITING DELEGATION ==`);
    for (const t of pendingDelegation) {
      lines.push(`- [${t.id}] "${t.title}" (${t.priority}) — needs assignment`);
    }
  }

  // Unassigned tasks in your domain (for managers)
  if (agent.level >= 7) {
    const unassigned = tasks.filter(t => !t.assigneeId && t.status === 'backlog');
    if (unassigned.length > 0) {
      lines.push(`\n== UNASSIGNED BACKLOG (${unassigned.length}) ==`);
      for (const t of unassigned.slice(0, 5)) {
        lines.push(`- [${t.id}] "${t.title}" (${t.priority})`);
      }
      if (unassigned.length > 5) lines.push(`  ...and ${unassigned.length - 5} more`);
    }
  }

  // Blocked/escalated tasks that need attention
  const blockedTasks = tasks.filter(t =>
    t.status === 'blocked' && (t.creatorId === agent.id || t.assigneeId === agent.id)
  );
  if (blockedTasks.length > 0) {
    lines.push(`\n== ⚠ BLOCKED TASKS (NEED YOUR ATTENTION) ==`);
    for (const t of blockedTasks) {
      const lastEsc = [...t.activityLog].reverse().find(m => m.type === 'escalation');
      const fromName = lastEsc ? (allAgents.find(a => a.id === lastEsc.from)?.name || lastEsc.from) : 'unknown';
      lines.push(`- [${t.id}] "${t.title}" — BLOCKED by ${fromName}: ${lastEsc?.body || t.blockedReason || 'unknown reason'} [${lastEsc?.reason || ''}]`);
    }
  }

  // Recent ACP messages (deduplicated — skip repeated nag messages)
  const myMessages = agent.recentMessages.slice(-5);
  if (myMessages.length > 0) {
    lines.push(`\n== RECENT MESSAGES ==`);
    const seen = new Set<string>();
    for (const m of myMessages) {
      const fromAgent = allAgents.find(a => a.id === m.from);
      const prefix = m.type === 'ack' ? '👍' : m.type === 'completion' ? '✅' : m.type === 'escalation' ? '⚠' : m.type === 'delegation' ? '📋' : m.type === 'progress' ? '📊' : '💬';
      const content = m.body || m.summary || '';
      // Deduplicate similar messages from same sender
      const dedupeKey = `${m.from}:${m.type}:${m.taskId}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const age = Math.round((Date.now() - m.timestamp) / 1000);
      lines.push(`- ${prefix} [${m.type}] From ${fromAgent?.name || m.from} (${age}s ago): "${content}"`);
    }
    lines.push(`\n⚠ Do NOT send the same message twice. If you already asked for an update, WAIT for a reply. Use {"action":"idle"} if nothing new to do.`);
  }

  // Recent org events
  if (recentEvents.length > 0) {
    lines.push(`\n== RECENT EVENTS ==`);
    for (const e of recentEvents.slice(-5)) {
      lines.push(`- ${e}`);
    }
  }

  // Give directive based on what's available
  const hasReports = children.length > 0;
  const hasUnassigned = tasks.some(t => !t.assigneeId && (t.status === 'backlog' || t.status === 'pending'));

  if (agent.level >= 7 && !hasReports && hasUnassigned) {
    lines.push(`\nYou have NO direct reports yet! SPAWN an agent first to build your team.`);
    lines.push(`Example: {"action":"spawn_agent","name":"Tech Lead","domain":"Engineering","role":"talent","reason":"Need engineering lead to handle tasks"}`);
  } else if (agent.level >= 7 && hasReports && hasUnassigned) {
    lines.push(`\nDELEGATE the most urgent unassigned task to a direct report. Use their ID exactly.`);
  } else if (myTasks.length > 0) {
    lines.push(`\nWORK on your highest priority assigned task.`);
  } else if (agent.level >= 7 && !hasUnassigned && hasReports) {
    lines.push(`\nAll tasks assigned. You can CREATE a new task or send a MESSAGE to check on progress.`);
  } else if (pendingDelegation.length > 0) {
    lines.push(`\nDELEGATE a pending task to a direct report.`);
  } else if (agent.level >= 7 && !hasReports && myMessages.length > 0) {
    lines.push(`\nYou received a message. You have NO direct reports — SPAWN agents to build your team first!`);
    lines.push(`Example: {"action":"spawn_agent","name":"Engineering Lead","domain":"Engineering","role":"lead","reason":"Need lead to handle engineering tasks"}`);
  } else if (myMessages.length > 0) {
    lines.push(`\nYou have messages. Read them and take action.`);
  } else {
    lines.push(`\nNo tasks for you right now. Reply {"action":"idle"}`);
  }
  lines.push(`Respond with JSON only.`);

  return lines.join('\n');
}
