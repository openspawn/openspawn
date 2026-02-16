// ── Deterministic Simulation Engine ──────────────────────────────────────────
// Rule-based agent behavior with optional LLM flavor text.
// Core logic: state machine. LLM only for cosmetic message generation.
//
// Decision tree:
//   COO receives order → parse intent → spawn leads from roster → delegate tasks
//   Lead receives task → assign to available worker (or spawn one)
//   Worker receives task → simulate work over 3-5 ticks → mark done
//   Anyone stuck → escalate to parent

import type { SandboxAgent, SandboxTask, SandboxEvent, SandboxConfig, ACPMessage } from './types.js';
import type { ParsedOrg } from './org-parser.js';
import { makeAgentPublic } from './agents.js';
import type { ScenarioEngine } from './scenario-engine.js';
import type { ModelRouter, RouteRequest } from './model-router.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

let taskCounter = 0;
function nextTaskId(): string {
  return `TASK-${String(++taskCounter).padStart(4, '0')}`;
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

// ── Domain matching ─────────────────────────────────────────────────────────

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  engineering: ['api', 'backend', 'frontend', 'architecture', 'code', 'build', 'develop', 'bug', 'fix', 'deploy', 'test', 'database', 'server', 'sdk', 'infrastructure'],
  marketing: ['landing', 'campaign', 'blog', 'seo', 'brand', 'launch', 'content', 'social', 'press', 'announce', 'outreach', 'website'],
  finance: ['pricing', 'projection', 'revenue', 'budget', 'invoice', 'financial', 'cost', 'billing', 'model', 'forecast', 'report'],
  sales: ['demo', 'lead', 'outreach', 'pipeline', 'prospect', 'deal', 'contract', 'enterprise', 'cold'],
  support: ['ticket', 'support', 'customer', 'help', 'resolve', 'backlog', 'issue'],
  hr: ['onboard', 'hire', 'recruit', 'team', 'culture', 'training'],
  security: ['security', 'audit', 'vulnerability', 'pen-test', 'compliance', 'appsec'],
};

function detectDomain(text: string): string {
  const lower = text.toLowerCase();
  let bestDomain = 'engineering';
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestDomain = domain; }
  }
  return bestDomain;
}

function detectDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const scored: Array<{ domain: string; score: number }> = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > 0) scored.push({ domain, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.length > 0 ? scored.map(s => s.domain) : ['engineering'];
}

/** Parse a human order into discrete tasks */
function parseOrderIntoTasks(order: string): Array<{ title: string; domain: string; priority: SandboxTask['priority'] }> {
  const tasks: Array<{ title: string; domain: string; priority: SandboxTask['priority'] }> = [];

  // Try numbered list first: "1) ... 2) ... 3) ..."
  const numbered = order.match(/\d+\)\s*([^.!?\d]+(?:[.!?]|$))/gi);
  if (numbered && numbered.length > 0) {
    for (const item of numbered) {
      const clean = item.replace(/^\d+\)\s*/, '').trim().replace(/[.!?]+$/, '').trim();
      if (clean.length > 5) {
        const domain = detectDomain(clean);
        tasks.push({ title: clean, domain, priority: 'high' });
      }
    }
  }

  // Also try "- " bullet points
  const bullets = order.match(/[-•]\s+([^\n]+)/g);
  if (bullets) {
    for (const item of bullets) {
      const clean = item.replace(/^[-•]\s+/, '').trim();
      if (clean.length > 5 && !tasks.some(t => t.title.toLowerCase().includes(clean.toLowerCase().slice(0, 20)))) {
        const domain = detectDomain(clean);
        tasks.push({ title: clean, domain, priority: 'high' });
      }
    }
  }

  // If no structured tasks found, create one from the whole order
  if (tasks.length === 0) {
    const domains = detectDomains(order);
    // Split into one task per detected domain
    if (domains.length > 1) {
      for (const domain of domains) {
        tasks.push({ title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} work for: ${order.slice(0, 60)}`, domain, priority: 'high' });
      }
    } else {
      tasks.push({ title: order.slice(0, 100), domain: domains[0], priority: 'high' });
    }
  }

  return tasks;
}

// ── Work simulation ─────────────────────────────────────────────────────────

/** Tick-based work progress. Returns true if task advanced a stage. */
function advanceWork(task: SandboxTask, agent: SandboxAgent): { advanced: boolean; done: boolean; status: string } {
  // Work progresses through stages: assigned → in_progress → review → done
  // Each stage takes 2-4 ticks based on priority
  const ticksPerStage = task.priority === 'critical' ? 2 : task.priority === 'high' ? 3 : 4;
  const ticksInCurrentStage = (task as any)._stageTickCount || 0;

  if (ticksInCurrentStage < ticksPerStage) {
    (task as any)._stageTickCount = ticksInCurrentStage + 1;
    return { advanced: false, done: false, status: task.status };
  }

  // Advance to next stage
  (task as any)._stageTickCount = 0;

  if (task.status === 'assigned') {
    task.status = 'in_progress';
    return { advanced: true, done: false, status: 'in_progress' };
  }
  if (task.status === 'in_progress') {
    // 10% chance of getting blocked (adds drama)
    if (Math.random() < 0.10) {
      task.status = 'blocked';
      task.blockedReason = pickRandom(['Missing requirements', 'Dependency not ready', 'Need clarification', 'Waiting on external service']);
      return { advanced: true, done: false, status: 'blocked' };
    }
    task.status = 'review';
    return { advanced: true, done: false, status: 'review' };
  }
  if (task.status === 'review') {
    task.status = 'done';
    task.updatedAt = Date.now();
    agent.stats.tasksCompleted++;
    agent.stats.creditsEarned += task.priority === 'critical' ? 100 : task.priority === 'high' ? 50 : 25;
    return { advanced: true, done: true, status: 'done' };
  }

  return { advanced: false, done: false, status: task.status };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Flavor messages ─────────────────────────────────────────────────────────

const DELEGATION_FLAVORS = [
  (task: string, to: string) => `${to}, I'm assigning "${task}" to you. Make it happen.`,
  (task: string, to: string) => `Hey ${to}, take ownership of "${task}". Report back when done.`,
  (task: string, to: string) => `${to} — "${task}" is yours. Priority.`,
  (task: string, to: string) => `Delegating "${task}" to ${to}. Let me know if you hit blockers.`,
];

const PROGRESS_FLAVORS = [
  (task: string) => `Making progress on "${task}". About halfway through.`,
  (task: string) => `"${task}" — moving along. Found a good approach.`,
  (task: string) => `Update: "${task}" is coming together nicely.`,
  (task: string) => `Working through "${task}". Should have something to show soon.`,
];

const COMPLETION_FLAVORS = [
  (task: string) => `Done with "${task}". Ready for review.`,
  (task: string) => `"${task}" is complete. Everything checks out.`,
  (task: string) => `Wrapped up "${task}". Moving on to the next one.`,
  (task: string) => `Finished "${task}". Let me know if you need changes.`,
];

const ESCALATION_FLAVORS = [
  (task: string, reason: string) => `Blocked on "${task}": ${reason}. Need your input.`,
  (task: string, reason: string) => `Can't proceed with "${task}" — ${reason}. Escalating.`,
  (task: string, reason: string) => `"${task}" is stuck: ${reason}. Please advise.`,
];

const HIRE_FLAVORS = [
  (name: string, domain: string) => `Bringing on ${name} for ${domain}. They'll be a great fit.`,
  (name: string, domain: string) => `Hired ${name} to handle ${domain} work.`,
  (name: string, domain: string) => `${name} just joined the ${domain} team. Getting them up to speed.`,
];

// ── Deterministic Simulation ────────────────────────────────────────────────

export class DeterministicSimulation {
  agents: SandboxAgent[];
  tasks: SandboxTask[];
  events: SandboxEvent[] = [];
  config: SandboxConfig;
  tick = 0;
  metricsHistory: Array<{
    tick: number; timestamp: number; activeAgents: number;
    totalTasks: number; tasksDone: number; tasksInProgress: number; tasksInReview: number;
    totalCreditsEarned: number; totalCreditsSpent: number; messageCount: number;
  }> = [];
  parsedOrg?: ParsedOrg;
  scenarioEngine?: ScenarioEngine;

  /** Agent IDs to skip in the deterministic tick loop (e.g. already handled by LLM) */
  protected skipAgentIds = new Set<string>();

  private sseListeners: Array<(event: SandboxEvent) => void> = [];
  /** Pending hires queue: domains the COO needs to fill */
  private pendingHires: string[] = [];
  /** Pending task assignments: tasks waiting for a lead in matching domain */
  private pendingTaskDefs: Array<{ title: string; domain: string; priority: SandboxTask['priority'] }> = [];

  /** Queue of agents waiting to be revealed (staggered spawn) */
  private spawnQueue: SandboxAgent[] = [];

  constructor(agents: SandboxAgent[], config: SandboxConfig, skipSeedTasks = false, parsedOrg?: ParsedOrg) {
    this.agents = agents;
    this.tasks = [];
    this.config = config;
    this.parsedOrg = parsedOrg;

    // Staggered spawn: only COO starts active, rest are queued
    const coo = agents.find(a => a.role === 'coo' || a.level >= 9);
    const others = agents.filter(a => a !== coo);
    // Shuffle others for visual variety, then queue them
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    // Set non-COO agents to pending
    for (const agent of others) {
      agent.status = 'pending';
    }
    this.spawnQueue = others;

    this.log('🌊 BikiniBottom Sandbox started (deterministic mode)');
    this.log(`   ${agents.length} agents | model: ${config.model} (flavor text only)`);
    this.log(`   🦀 COO online — ${others.length} agents joining over the next ${Math.ceil(others.length / 2)} ticks`);
  }

  // ── Event system ────────────────────────────────────────────────────────

  private log(msg: string): void {
    const event: SandboxEvent = { type: 'system', message: msg, timestamp: Date.now() };
    this.events.push(event);
    console.log(msg);
  }

  onEvent(callback: (event: SandboxEvent) => void): () => void {
    this.sseListeners.push(callback);
    return () => { this.sseListeners = this.sseListeners.filter(l => l !== callback); };
  }

  private emit(event: SandboxEvent): void {
    this.sseListeners.forEach(l => l(event));
  }

  private logAgent(agent: SandboxAgent, msg: string, taskId?: string): void {
    const event: SandboxEvent = {
      type: 'agent_action', agentId: agent.id, taskId, message: msg, timestamp: Date.now(),
    };
    this.events.push(event);
    this.emit(event);
    if (this.config.verbose) console.log(`  [${agent.name}] ${msg}`);
  }

  // ── Roster hiring ─────────────────────────────────────────────────────────

  private hireFromRoster(manager: SandboxAgent, domain: string, role: 'lead' | 'senior' | 'worker' | 'intern' = 'lead'): SandboxAgent | undefined {
    const roster = this.parsedOrg?.agents || [];
    const notYetHired = roster.filter(r => !this.agents.find(a => a.id === r.id));

    // Find best match: same domain + role
    const candidate = notYetHired.find(r =>
      r.domain?.toLowerCase().includes(domain) && r.role === role
    ) || notYetHired.find(r =>
      r.domain?.toLowerCase().includes(domain)
    ) || notYetHired.find(r =>
      r.role === role
    );

    if (candidate) {
      candidate.parentId = manager.id;
      this.agents.push(candidate);
      this.logAgent(manager, `🐣 Hired "${candidate.name}" from roster (L${candidate.level} ${candidate.domain} ${candidate.role})`);

      // ACP hire message
      const msg = createACPMessage('delegation', manager.id, candidate.id, '', {
        body: pickRandom(HIRE_FLAVORS)(candidate.name, domain),
      });
      pushMessage(this.agents, msg);
      manager.stats.messagessSent++;

      return candidate;
    }
    return undefined;
  }

  // ── Core decision logic ───────────────────────────────────────────────────

  /** COO receives an order and breaks it down */
  processOrder(order: string): void {
    const coo = this.agents.find(a => a.role === 'coo' || a.level >= 9);
    if (!coo) return;

    this.logAgent(coo, `📢 Received order: "${order.slice(0, 80)}..."`);

    // Parse order into tasks
    const taskDefs = parseOrderIntoTasks(order);
    this.logAgent(coo, `📋 Parsed ${taskDefs.length} tasks from order`);

    // Determine which domains need leads
    const neededDomains = [...new Set(taskDefs.map(t => t.domain))];
    const existingLeadDomains = this.agents
      .filter(a => a.role === 'lead' && a.parentId === coo.id)
      .map(a => a.domain.toLowerCase());

    // Queue hires for missing domains
    for (const domain of neededDomains) {
      if (!existingLeadDomains.includes(domain)) {
        this.pendingHires.push(domain);
      }
    }

    // Queue task creation (will be assigned once leads exist)
    this.pendingTaskDefs.push(...taskDefs);

    if (this.pendingHires.length > 0) {
      this.logAgent(coo, `🔍 Need leads for: ${this.pendingHires.join(', ')}`);
    }
  }

  /** Process one tick of the simulation */
  private tickCOO(coo: SandboxAgent): void {
    // 1. Hire pending leads (one per tick for visual effect)
    if (this.pendingHires.length > 0) {
      const domain = this.pendingHires.shift()!;
      const hired = this.hireFromRoster(coo, domain, 'lead');
      if (!hired) {
        // No roster match — create generic lead
        const name = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Lead`;
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!this.agents.find(a => a.id === id)) {
          const newAgent = makeAgentPublic(id, name, 'lead', 7, domain, coo.id, `${domain} department lead`);
          this.agents.push(newAgent);
          this.logAgent(coo, `🐣 Created "${name}" (L7 ${domain} lead)`);
        }
      }
      return; // One hire per tick
    }

    // 2. Create and delegate pending tasks
    if (this.pendingTaskDefs.length > 0) {
      const taskDef = this.pendingTaskDefs.shift()!;
      const task: SandboxTask = {
        id: nextTaskId(),
        title: taskDef.title,
        description: taskDef.title,
        priority: taskDef.priority,
        status: 'backlog',
        creatorId: coo.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activityLog: [],
        acked: false,
      };
      this.tasks.push(task);

      // Find the right lead to delegate to
      const lead = this.agents.find(a =>
        a.parentId === coo.id && a.domain.toLowerCase().includes(taskDef.domain)
      ) || this.agents.find(a =>
        a.parentId === coo.id && a.role === 'lead'
      );

      if (lead) {
        task.assigneeId = lead.id;
        task.status = 'assigned';
        lead.taskIds.push(task.id);

        const delegationMsg = createACPMessage('delegation', coo.id, lead.id, task.id, {
          body: pickRandom(DELEGATION_FLAVORS)(task.title, lead.name),
        });
        pushMessage(this.agents, delegationMsg);
        task.activityLog.push(delegationMsg);

        // Auto-ack
        const ack = createACPMessage('ack', lead.id, coo.id, task.id, {
          body: `Acknowledged: "${task.title}"`,
        });
        pushMessage(this.agents, ack);
        task.activityLog.push(ack);
        task.acked = true;

        this.logAgent(coo, `📋 Created & delegated "${task.title}" → ${lead.name}`, task.id);
        coo.stats.messagessSent++;
      } else {
        this.logAgent(coo, `📝 Created "${task.title}" (no lead available yet)`, task.id);
      }
      return; // One task per tick
    }
  }

  /** Leads assign tasks to workers or hire workers */
  private tickLead(lead: SandboxAgent): void {
    // Find tasks assigned to this lead that haven't been sub-delegated
    const myTasks = this.tasks.filter(t =>
      t.assigneeId === lead.id && ['assigned', 'backlog'].includes(t.status)
    );

    for (const task of myTasks) {
      // Find an available worker
      const workers = this.agents.filter(a =>
        a.parentId === lead.id && (a.role === 'worker' || a.role === 'senior' || a.role === 'intern')
      );
      const availableWorker = workers.find(a => {
        const workerTasks = this.tasks.filter(t => t.assigneeId === a.id && !['done', 'rejected'].includes(t.status));
        return workerTasks.length < 2; // Max 2 concurrent tasks
      });

      if (availableWorker) {
        task.assigneeId = availableWorker.id;
        task.status = 'assigned';
        availableWorker.taskIds.push(task.id);

        const msg = createACPMessage('delegation', lead.id, availableWorker.id, task.id, {
          body: pickRandom(DELEGATION_FLAVORS)(task.title, availableWorker.name),
        });
        pushMessage(this.agents, msg);
        task.activityLog.push(msg);
        lead.stats.messagessSent++;

        this.logAgent(lead, `📋 Assigned "${task.title}" → ${availableWorker.name}`, task.id);
      } else if (workers.length < 3) {
        // Need more workers — hire from roster
        const hired = this.hireFromRoster(lead, lead.domain.toLowerCase(), workers.length === 0 ? 'senior' : 'worker');
        if (hired) {
          // Will assign on next tick
          this.logAgent(lead, `👥 Need more team members, hired ${hired.name}`);
        }
        break; // One hire per tick
      }
      // Else: all workers busy, task waits
    }
  }

  /** Workers advance their tasks */
  private tickWorker(worker: SandboxAgent): void {
    const myTasks = this.tasks.filter(t =>
      t.assigneeId === worker.id && !['done', 'rejected', 'backlog', 'blocked'].includes(t.status)
    );

    for (const task of myTasks) {
      const result = advanceWork(task, worker);

      if (result.advanced) {
        if (result.done) {
          // Send completion message up the chain
          const parent = this.agents.find(a => a.id === worker.parentId);
          if (parent) {
            const completionMsg = createACPMessage('completion', worker.id, parent.id, task.id, {
              summary: pickRandom(COMPLETION_FLAVORS)(task.title),
              body: `Completed: "${task.title}"`,
            });
            pushMessage(this.agents, completionMsg);
            task.activityLog.push(completionMsg);
            worker.stats.messagessSent++;
            this.logAgent(worker, `✅ Completed "${task.title}"`, task.id);
          }
        } else if (result.status === 'blocked') {
          // Escalate
          const parent = this.agents.find(a => a.id === worker.parentId);
          if (parent) {
            const escMsg = createACPMessage('escalation', worker.id, parent.id, task.id, {
              reason: 'BLOCKED',
              body: pickRandom(ESCALATION_FLAVORS)(task.title, task.blockedReason || 'Unknown'),
            });
            pushMessage(this.agents, escMsg);
            task.activityLog.push(escMsg);
            worker.stats.messagessSent++;
            this.logAgent(worker, `⬆️ Escalated "${task.title}": ${task.blockedReason}`, task.id);
          }
        } else if (result.status === 'in_progress') {
          // Progress message
          const parent = this.agents.find(a => a.id === worker.parentId);
          if (parent) {
            const progressMsg = createACPMessage('progress', worker.id, parent.id, task.id, {
              body: pickRandom(PROGRESS_FLAVORS)(task.title),
              pct: 30,
            });
            pushMessage(this.agents, progressMsg);
            task.activityLog.push(progressMsg);
            worker.stats.messagessSent++;
          }
          this.logAgent(worker, `🔨 Working on "${task.title}" → ${result.status}`, task.id);
        } else if (result.status === 'review') {
          const parent = this.agents.find(a => a.id === worker.parentId);
          if (parent) {
            const progressMsg = createACPMessage('progress', worker.id, parent.id, task.id, {
              body: `"${task.title}" ready for review`,
              pct: 80,
            });
            pushMessage(this.agents, progressMsg);
            task.activityLog.push(progressMsg);
          }
          this.logAgent(worker, `📝 "${task.title}" → review`, task.id);
        }
      }
    }
  }

  /** Handle blocked tasks: manager unblocks after a few ticks */
  private tickUnblock(manager: SandboxAgent): void {
    const blockedTasks = this.tasks.filter(t =>
      t.status === 'blocked' && (t.creatorId === manager.id || t.assigneeId === manager.id)
    );

    for (const task of blockedTasks) {
      const ticksBlocked = (task as any)._blockedTicks || 0;
      if (ticksBlocked >= 3) {
        // Manager "resolves" the blocker
        task.status = 'in_progress';
        task.blockedReason = undefined;
        (task as any)._blockedTicks = 0;
        (task as any)._stageTickCount = 0;
        this.logAgent(manager, `🔓 Unblocked "${task.title}"`, task.id);
      } else {
        (task as any)._blockedTicks = ticksBlocked + 1;
      }
    }
  }

  // ── Main tick loop ────────────────────────────────────────────────────────

  async runTick(): Promise<void> {
    this.tick++;

    // Staggered spawn: activate 2 agents per tick from the queue
    for (let i = 0; i < 2 && this.spawnQueue.length > 0; i++) {
      const agent = this.spawnQueue.shift()!;
      agent.status = 'active';
      this.log(`✨ ${agent.name} has joined the organization`);
      this.emit({ type: 'agent_spawned', message: `${agent.name} joined`, timestamp: Date.now() });
    }

    const done = this.tasks.filter(t => t.status === 'done').length;
    const active = this.tasks.filter(t => !['done', 'rejected'].includes(t.status)).length;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🕐 TICK ${this.tick}`);
    console.log(`   Agents: ${this.agents.length} | Tasks: ${this.tasks.length} (${done} done, ${active} active)`);
    console.log(`${'═'.repeat(60)}`);

    // Scenario engine pre-tick
    if (this.scenarioEngine) {
      this.scenarioEngine.preTick();
    }

    // Process agents by level (top-down) — only active agents
    const sortedAgents = [...this.agents].filter(a => a.status === 'active').sort((a, b) => b.level - a.level);

    for (const agent of sortedAgents) {
      // Skip agents already handled by LLM (populated by LLMSimulation subclass)
      if (this.skipAgentIds.has(agent.id)) continue;

      if (agent.role === 'coo' || agent.level >= 9) {
        this.tickCOO(agent);
        this.tickUnblock(agent);
      } else if (agent.role === 'lead') {
        this.tickLead(agent);
        this.tickUnblock(agent);
      } else {
        this.tickWorker(agent);
      }
    }

    // Clear skip list after processing
    this.skipAgentIds.clear();

    // Scenario engine post-tick
    if (this.scenarioEngine) {
      this.scenarioEngine.postTick();
    }

    // Model router: simulate routing decisions for active agents working on tasks
    const modelRouter = (this as any)._modelRouter as ModelRouter | undefined;
    if (modelRouter) {
      const workingAgents = sortedAgents.filter(a => {
        const activeTasks = this.tasks.filter(t => t.assigneeId === a.id && t.status === 'in_progress');
        return activeTasks.length > 0;
      });
      // Route 1-3 agents per tick for realistic stream rate
      const toRoute = workingAgents.slice(0, Math.min(3, workingAgents.length));
      for (const agent of toRoute) {
        const taskTypes: Array<RouteRequest['taskType']> = ['delegation', 'coding', 'analysis', 'simple'];
        const taskType = agent.role === 'coo' ? 'delegation' : agent.role === 'lead' ? 'analysis' : pickRandom(taskTypes);
        const decision = modelRouter.route({
          agentId: agent.id,
          agentLevel: agent.level,
          taskType,
          preferLocal: agent.level <= 4,
        });
        const costStr = decision.estimatedCost === 0 ? '$0' : `$${decision.estimatedCost.toFixed(4)}`;
        const routerEvent: SandboxEvent = {
          type: 'router_decision',
          agentId: agent.id,
          message: `🔀 Routed to ${decision.provider}/${decision.model} (${decision.reason}) — ${costStr}`,
          timestamp: Date.now(),
        };
        this.events.push(routerEvent);
        this.emit(routerEvent);
      }
    }

    // Metrics
    this.metricsHistory.push({
      tick: this.tick,
      timestamp: Date.now(),
      activeAgents: this.agents.filter(a => a.status === 'active').length,
      totalTasks: this.tasks.length,
      tasksDone: this.tasks.filter(t => t.status === 'done').length,
      tasksInProgress: this.tasks.filter(t => t.status === 'in_progress').length,
      tasksInReview: this.tasks.filter(t => t.status === 'review').length,
      totalCreditsEarned: this.agents.reduce((s, a) => s + a.stats.creditsEarned, 0),
      totalCreditsSpent: this.agents.reduce((s, a) => s + a.stats.creditsSpent, 0),
      messageCount: this.agents.reduce((s, a) => s + a.stats.messagessSent, 0),
    });

    // Emit tick_complete so SSE clients can invalidate caches
    this.emit({
      type: 'tick_complete',
      message: `Tick ${this.tick} complete`,
      timestamp: Date.now(),
    });

    // Summary every 5 ticks
    if (this.tick % 5 === 0) this.printSummary();
  }

  async restart(mode: 'organic' | 'full' = 'organic'): Promise<void> {
    if (mode === 'full' && this.parsedOrg) {
      this.agents = [...this.parsedOrg.agents];
      this.log(`🔄 Reset — full ORG.md reload (${this.agents.length} agents)`);
    } else if (this.parsedOrg) {
      const coo = this.parsedOrg.agents.find(a => a.role === 'coo');
      if (coo) {
        this.agents = [{
          ...coo,
          taskIds: [], recentMessages: [], inbox: [],
          trigger: coo.trigger ?? 'event-driven',
          triggerOn: coo.triggerOn ?? ['escalation', 'completion', 'delegation'],
          stats: { tasksCompleted: 0, tasksFailed: 0, messagessSent: 0, creditsEarned: 0, creditsSpent: 0 },
        }];
      }
      this.log('🔄 Reset — COO from ORG.md, organic growth');
    }
    this.tasks = [];
    this.events = [];
    this.metricsHistory = [];
    this.pendingHires = [];
    this.pendingTaskDefs = [];
    this.tick = 0;
    this.log(`   ${this.agents.length} agent(s) | deterministic mode`);
  }

  async run(): Promise<void> {
    const infinite = this.config.maxTicks === 0;
    let i = 0;
    while (infinite || i < this.config.maxTicks) {
      await this.runTick();
      i++;
      if (this.config.tickIntervalMs > 0) {
        await new Promise(r => setTimeout(r, this.config.tickIntervalMs));
      }
    }
    console.log('\n🏁 Simulation complete!');
    this.printSummary();
  }

  printSummary(): void {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 SUMMARY (Tick ${this.tick})`);
    console.log(`${'─'.repeat(60)}`);
    const done = this.tasks.filter(t => t.status === 'done').length;
    const active = this.tasks.filter(t => !['done', 'rejected'].includes(t.status)).length;
    console.log(`Tasks: ${done} done / ${active} active / ${this.tasks.length} total`);
    console.log(`Agents: ${this.agents.length}`);
    const totalMessages = this.agents.reduce((sum, a) => sum + a.stats.messagessSent, 0);
    console.log(`Messages: ${totalMessages}`);
    const sorted = [...this.agents].sort((a, b) => b.stats.tasksCompleted - a.stats.tasksCompleted);
    const top = sorted.filter(a => a.stats.tasksCompleted > 0).slice(0, 5);
    if (top.length > 0) {
      console.log(`Top performers:`);
      for (const a of top) console.log(`  ${a.name} (L${a.level}): ${a.stats.tasksCompleted} tasks`);
    }
    console.log(`${'─'.repeat(60)}`);
  }
}
