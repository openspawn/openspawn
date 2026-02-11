// ── Sandbox Simulation Engine ────────────────────────────────────────────────
// Runs the tick loop, processes agent decisions, maintains state

import type { SandboxAgent, SandboxTask, SandboxEvent, SandboxConfig, AgentAction, ACPMessage } from './types.js';
import { getAgentDecision, buildContext } from './llm.js';
import { makeAgentPublic, createCOO } from './agents.js';
import type { ParsedOrg } from './org-parser.js';

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
  return {
    id: acpId(),
    type,
    from,
    to,
    taskId,
    timestamp: Date.now(),
    ...extra,
  };
}

function pushMessage(agents: SandboxAgent[], msg: ACPMessage): void {
  for (const agent of agents) {
    if (agent.id === msg.from || agent.id === msg.to) {
      agent.recentMessages.push(msg);
      if (agent.recentMessages.length > 10) {
        agent.recentMessages = agent.recentMessages.slice(-10);
      }
    }
    // Route to target agent's inbox if they are event-driven and message type matches
    if (agent.id === msg.to && agent.trigger === 'event-driven') {
      if (!agent.triggerOn || agent.triggerOn.includes(msg.type)) {
        agent.inbox.push(msg);
      }
    }
  }
}

// ── Seed tasks to kickstart the simulation ──────────────────────────────────

function createSeedTasks(): SandboxTask[] {
  const now = Date.now();
  const seeds: Array<{ title: string; desc: string; priority: SandboxTask['priority']; domain: string }> = [
    { title: 'Fix Safari login crash', desc: 'Login page crashes on Safari 18. Reproduce and fix.', priority: 'critical', domain: 'Engineering' },
    { title: 'Q1 financial report', desc: 'Compile Q1 revenue, expenses, and projections.', priority: 'high', domain: 'Finance' },
    { title: 'Launch blog post for v2.0', desc: 'Write and publish announcement post for BikiniBottom v2.0 release.', priority: 'high', domain: 'Marketing' },
    { title: 'Onboard 3 new agents', desc: 'Process onboarding for recently approved agents.', priority: 'normal', domain: 'HR' },
    { title: 'Resolve ticket backlog', desc: '47 unresolved support tickets from last week.', priority: 'high', domain: 'Support' },
    { title: 'Enterprise demo prep', desc: 'Prepare demo environment for Acme Corp eval next week.', priority: 'critical', domain: 'Sales' },
    { title: 'Add rate limiting to API', desc: 'Implement token bucket rate limiter on /api endpoints.', priority: 'high', domain: 'Engineering' },
    { title: 'SEO audit for docs site', desc: 'Run full SEO audit on docs.bikinibottom.dev', priority: 'normal', domain: 'Marketing' },
    { title: 'Update pricing page', desc: 'Refresh pricing page with new tier structure.', priority: 'normal', domain: 'Marketing' },
    { title: 'Automate invoice generation', desc: 'Script monthly invoice generation from billing data.', priority: 'normal', domain: 'Finance' },
    { title: 'Write E2E tests for dashboard', desc: 'Cover critical flows: login, agent view, task board.', priority: 'high', domain: 'Engineering' },
    { title: 'Cold outreach campaign', desc: 'Launch email campaign to 200 qualified leads.', priority: 'normal', domain: 'Sales' },
  ];

  return seeds.map(s => ({
    id: nextTaskId(),
    title: s.title,
    description: s.desc,
    priority: s.priority,
    status: 'backlog' as const,
    creatorId: 'mr-krabs',
    createdAt: now,
    updatedAt: now,
    activityLog: [],
    acked: false,
  }));
}

// ── Simulation class ────────────────────────────────────────────────────────

export interface MetricsSnapshot {
  tick: number;
  timestamp: number;
  activeAgents: number;
  totalTasks: number;
  tasksDone: number;
  tasksInProgress: number;
  tasksInReview: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  messageCount: number;
}

export class Simulation {
  agents: SandboxAgent[];
  tasks: SandboxTask[];
  events: SandboxEvent[] = [];
  config: SandboxConfig;
  tick = 0;
  /** Time-series metrics captured every tick */
  metricsHistory: MetricsSnapshot[] = [];
  /** Parsed org (if loaded from ORG.md) — used for restart */
  parsedOrg?: ParsedOrg;

  constructor(agents: SandboxAgent[], config: SandboxConfig, skipSeedTasks = false, parsedOrg?: ParsedOrg) {
    this.agents = agents;
    this.tasks = skipSeedTasks ? [] : createSeedTasks();
    this.config = config;
    this.parsedOrg = parsedOrg;
    this.log('🌊 BikiniBottom Sandbox started');
    this.log(`   ${agents.length} agents | ${this.tasks.length} seed tasks | model: ${config.model}`);

    // Kick the COO to start delegating seed tasks
    if (!skipSeedTasks) {
      const coo = agents.find(a => a.role === 'coo' || a.level === 10);
      if (coo) {
        const kickMsg: ACPMessage = {
          id: `acp-boot-${Date.now()}`,
          type: 'delegation',
          from: 'system',
          to: coo.id,
          taskId: '',
          body: `You have ${this.tasks.length} tasks in the backlog. Delegate them to your department leads by domain. Start with critical priority.`,
          timestamp: Date.now(),
        };
        coo.inbox.push(kickMsg);
        coo.recentMessages.push(kickMsg);
      }
    }
  }

  private log(msg: string): void {
    const event: SandboxEvent = {
      type: 'system',
      message: msg,
      timestamp: Date.now(),
    };
    this.events.push(event);
    console.log(msg);
  }

  // SSE listeners for real-time streaming
  private sseListeners: Array<(event: SandboxEvent) => void> = [];

  onEvent(callback: (event: SandboxEvent) => void): () => void {
    this.sseListeners.push(callback);
    return () => { this.sseListeners = this.sseListeners.filter(l => l !== callback); };
  }

  private emit(event: SandboxEvent): void {
    this.sseListeners.forEach(l => l(event));
  }

  private logAgent(agent: SandboxAgent, msg: string, taskId?: string): void {
    const prefix = `  [${agent.name}]`;
    const event: SandboxEvent = {
      type: 'agent_action',
      agentId: agent.id,
      taskId,
      message: msg,
      timestamp: Date.now(),
    };
    this.events.push(event);
    this.emit(event);
    if (this.config.verbose) console.log(`${prefix} ${msg}`);
  }

  /** Resolve an agent from a possibly garbled ID/name from the LLM */
  private resolveAgent(fromAgent: SandboxAgent, raw: string): SandboxAgent | undefined {
    const s = raw.toLowerCase().trim().replace(/['"()]/g, '');
    
    const exact = this.agents.find(a => a.id === s);
    if (exact) return exact;
    
    const idMatch = this.agents.find(a => s.includes(a.id));
    if (idMatch) return idMatch;
    
    const nameMatch = this.agents.find(a => s.includes(a.name.toLowerCase()));
    if (nameMatch) return nameMatch;
    
    const words = s.split(/[\s-]+/).filter(w => w.length > 2);
    const partialMatch = this.agents.find(a => {
      const aWords = a.name.toLowerCase().split(/[\s-]+/);
      return words.some(w => aWords.some(aw => aw.includes(w) || w.includes(aw)));
    });
    if (partialMatch) return partialMatch;

    const levelMatch = s.match(/l(\d+)/i);
    if (levelMatch) {
      const level = parseInt(levelMatch[1]);
      const children = this.agents.filter(a => a.parentId === fromAgent.id);
      const levelChild = children.find(a => a.level === level);
      if (levelChild) return levelChild;
      if (children.length > 0) return children[0];
    }
    
    const domains = ['engineering', 'finance', 'marketing', 'sales', 'support', 'hr'];
    const domainHit = domains.find(d => s.includes(d));
    if (domainHit) {
      const children = this.agents.filter(a => a.parentId === fromAgent.id);
      const domainChild = children.find(a => a.domain.toLowerCase() === domainHit);
      if (domainChild) return domainChild;
    }
    
    const children = this.agents.filter(a => a.parentId === fromAgent.id && a.status === 'active');
    if (children.length > 0) return children[0];

    return undefined;
  }

  /** Auto-generate ACK message when task is assigned */
  private autoAck(task: SandboxTask, assigneeId: string, delegatorId: string): void {
    const ack = createACPMessage('ack', assigneeId, delegatorId, task.id, {
      body: `Acknowledged: "${task.title}"`,
    });
    pushMessage(this.agents, ack);
    task.activityLog.push(ack);
    task.acked = true;
  }

  /** Auto-generate delegation message */
  private autoDelegation(task: SandboxTask, delegatorId: string, assigneeId: string, reason: string): void {
    const msg = createACPMessage('delegation', delegatorId, assigneeId, task.id, {
      body: reason,
    });
    pushMessage(this.agents, msg);
    task.activityLog.push(msg);
  }

  /** Create completion message and bubble up */
  private completeTask(task: SandboxTask, agentId: string, summary: string): void {
    // Find who delegated to this agent
    const delegatorId = task.creatorId;
    const completionMsg = createACPMessage('completion', agentId, delegatorId, task.id, {
      summary,
      body: `Completed: "${task.title}"`,
    });
    pushMessage(this.agents, completionMsg);
    task.activityLog.push(completionMsg);

    // Bubble up: if the delegator was assigned this task by their parent, notify upward
    const delegator = this.agents.find(a => a.id === delegatorId);
    if (delegator?.parentId) {
      const parentTask = this.tasks.find(t =>
        t.id === task.id && t.assigneeId === delegatorId
      );
      // If the delegator's parent assigned the original task, bubble completion
      if (parentTask || delegator.parentId) {
        const bubbleMsg = createACPMessage('completion', delegatorId, delegator.parentId, task.id, {
          summary,
          body: `Completed (via ${this.agents.find(a => a.id === agentId)?.name}): "${task.title}"`,
        });
        pushMessage(this.agents, bubbleMsg);
      }
    }
  }

  /** Process a single agent action */
  private processAction(agent: SandboxAgent, action: AgentAction): void {
    switch (action.action) {
      case 'delegate': {
        const task = this.tasks.find(t => t.id === action.taskId);
        const target = this.resolveAgent(agent, String(action.targetAgentId));
        if (task && target) {
          task.assigneeId = target.id;
          task.status = 'assigned';
          task.updatedAt = Date.now();
          target.taskIds.push(task.id);
          // ACP: delegation + auto-ack
          const reason = action.reason || action.description || task.title;
          this.autoDelegation(task, agent.id, target.id, reason);
          this.autoAck(task, target.id, agent.id);
          this.logAgent(agent, `📋 Delegated "${task.title}" → ${target.name}: ${reason}`, task.id);
        } else if (!task) {
          const fuzzyTask = this.tasks.find(t =>
            t.status === 'backlog' || t.status === 'pending'
          );
          if (fuzzyTask && target) {
            fuzzyTask.assigneeId = target.id;
            fuzzyTask.status = 'assigned';
            fuzzyTask.updatedAt = Date.now();
            target.taskIds.push(fuzzyTask.id);
            const reason = action.reason || action.description || fuzzyTask.title;
            this.autoDelegation(fuzzyTask, agent.id, target.id, reason);
            this.autoAck(fuzzyTask, target.id, agent.id);
            this.logAgent(agent, `📋 Delegated "${fuzzyTask.title}" → ${target.name} (task fuzzy): ${reason}`);
          } else {
            this.logAgent(agent, `⚠ Failed to delegate: task=${action.taskId} target=${action.targetAgentId}`);
          }
        } else {
          this.logAgent(agent, `⚠ Failed to delegate: no target for "${action.targetAgentId}"`);
        }
        break;
      }

      case 'work': {
        const task = this.tasks.find(t => t.id === action.taskId);
        if (task) {
          if (task.status === 'assigned') task.status = 'in_progress';
          else if (task.status === 'in_progress') task.status = 'review';
          else if (task.status === 'review') {
            task.status = 'done';
            task.updatedAt = Date.now();
            agent.stats.tasksCompleted++;
            agent.stats.creditsEarned += 50;
            // ACP: completion
            this.completeTask(task, agent.id, action.result);
          }
          task.updatedAt = Date.now();

          // ACP: progress update (for non-done transitions)
          if (task.status !== 'done') {
            const pctMap: Record<string, number> = { in_progress: 30, review: 70 };
            const progress = createACPMessage('progress', agent.id, task.creatorId, task.id, {
              body: action.result,
              pct: pctMap[task.status] ?? 50,
            });
            task.activityLog.push(progress);
            pushMessage(this.agents, progress);
          }

          this.logAgent(agent, `🔨 Working on "${task.title}" → ${task.status}: ${action.result}`, task.id);
        }
        break;
      }

      case 'message': {
        const target = this.resolveAgent(agent, String(action.to));
        if (target) {
          // Use ACPMessage format for regular messages too
          const msg = createACPMessage('status_request', agent.id, target.id, '', {
            body: action.content,
          });
          pushMessage(this.agents, msg);
          agent.stats.messagessSent++;
          this.logAgent(agent, `💬 → ${target.name}: "${action.content.substring(0, 80)}"`);
        }
        break;
      }

      case 'escalate': {
        const task = this.tasks.find(t => t.id === action.taskId);
        const parent = this.agents.find(a => a.id === agent.parentId);
        if (task && parent) {
          // ACP: escalation message
          const reason = action.reason || 'BLOCKED';
          const body = action.body || action.reason;
          const escalation = createACPMessage('escalation', agent.id, parent.id, task.id, {
            reason,
            body: String(body),
          });
          pushMessage(this.agents, escalation);
          task.activityLog.push(escalation);

          task.assigneeId = undefined;
          task.status = 'blocked';
          task.blockedReason = String(body);
          task.updatedAt = Date.now();
          agent.taskIds = agent.taskIds.filter(id => id !== task.id);
          this.logAgent(agent, `⬆️ Escalated "${task.title}" to ${parent.name}: [${reason}] ${body}`);
        }
        break;
      }

      case 'create_task': {
        const rawTitle = action.title || action.name || action.task;
        const newTask: SandboxTask = {
          id: nextTaskId(),
          title: rawTitle ? String(rawTitle) : `${agent.name} - Task ${this.tasks.length + 1}`,
          description: String(action.description || action.desc || ''),
          priority: (['low', 'normal', 'high', 'critical'].includes(String(action.priority))
            ? String(action.priority) as SandboxTask['priority']
            : 'normal'),
          status: 'backlog',
          creatorId: agent.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          activityLog: [],
          acked: false,
        };
        this.tasks.push(newTask);
        this.logAgent(agent, `📝 Created task: "${newTask.title}" (${newTask.priority})`);
        break;
      }

      case 'review': {
        const task = this.tasks.find(t => t.id === action.taskId);
        if (task) {
          if (action.verdict === 'approve') {
            task.status = 'done';
            task.updatedAt = Date.now();
            const assignee = this.agents.find(a => a.id === task.assigneeId);
            if (assignee) assignee.stats.tasksCompleted++;
            // ACP: completion on approval
            this.completeTask(task, task.assigneeId || agent.id, action.feedback);
            this.logAgent(agent, `✅ Approved "${task.title}": ${action.feedback}`);
          } else {
            task.status = 'in_progress';
            task.updatedAt = Date.now();
            this.logAgent(agent, `❌ Rejected "${task.title}": ${action.feedback}`);
          }
        }
        break;
      }

      case 'spawn_agent': {
        if (agent.level < 7) {
          this.logAgent(agent, `⚠ Not authorized to spawn agents (L${agent.level} < L7)`);
          break;
        }

        const requestedDomain = String(action.domain || agent.domain).toLowerCase();
        const requestedRole = String(action.role || 'worker').toLowerCase();
        const requestedName = String(action.name || '').toLowerCase();

        // Try to hire from ORG.md roster first (cofounder mode / matching)
        const roster = this.parsedOrg?.agents || [];
        const notYetHired = roster.filter(r => !this.agents.find(a => a.id === r.id));
        const candidate = notYetHired.find(r =>
          r.domain?.toLowerCase().includes(requestedDomain) ||
          requestedName.includes(r.name.toLowerCase().split(' ')[0]) ||
          (requestedRole === 'lead' && r.role === 'lead' && r.domain?.toLowerCase().includes(requestedDomain))
        ) || notYetHired.find(r =>
          r.role === requestedRole || r.domain?.toLowerCase().includes(requestedDomain)
        );

        if (candidate) {
          // Hire from roster — use the predefined character
          candidate.parentId = agent.id;
          candidate.systemPrompt = candidate.systemPrompt || `Hired by ${agent.name}. ${action.reason || ''}`;
          this.agents.push(candidate);
          this.logAgent(agent, `🐣 Hired "${candidate.name}" from roster (L${candidate.level} ${candidate.domain} ${candidate.role}): ${action.reason}`);
          break;
        }

        // No roster match — create a new agent
        const roleLevels: Record<string, number> = {
          talent: 9, lead: 7, senior: 6, worker: 4, intern: 1,
        };
        const newRole = requestedRole;
        const newLevel = roleLevels[newRole] || 4;
        const newDomain = String(action.domain || agent.domain);
        const newName = String(action.name || `${newDomain} ${newRole}`);
        const newId = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

        if (this.agents.find(a => a.id === newId)) {
          this.logAgent(agent, `⚠ Agent "${newName}" already exists`);
          break;
        }

        const newAgent = makeAgentPublic(
          newId, newName,
          newRole as SandboxAgent['role'], newLevel, newDomain,
          agent.id,
          `Spawned by ${agent.name}. ${action.reason || ''}`,
        );
        this.agents.push(newAgent);
        this.logAgent(agent, `🐣 Spawned "${newName}" (L${newLevel} ${newDomain} ${newRole}): ${action.reason}`);
        break;
      }

      case 'idle':
        this.logAgent(agent, `😴 Idle`);
        break;

      default:
        this.logAgent(agent, `❓ Unknown action: ${JSON.stringify(action).substring(0, 100)}`);
    }
  }

  /** Run a single simulation tick */
  async runTick(): Promise<void> {
    this.tick++;
    const recentEventMsgs = this.events.slice(-10).map(e => e.message);

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🕐 TICK ${this.tick}`);
    console.log(`   Tasks: ${this.tasks.length} total | ${this.tasks.filter(t => t.status === 'done').length} done | ${this.tasks.filter(t => t.status !== 'done' && t.status !== 'rejected').length} active`);
    console.log(`${'═'.repeat(60)}`);

    const actingAgents = this.agents.filter(agent => {
      // Event-driven agents: only act if inbox has NEW messages
      // (recentMessages is history — don't wake just because history exists)
      if (agent.trigger === 'event-driven') {
        const hasWork = agent.inbox.length > 0;
        if (hasWork) console.log(`    ✉️ ${agent.name} inbox: ${agent.inbox.length} → WILL ACT`);
        return hasWork;
      }
      // Polling agents: existing level-based frequency
      if (agent.level >= 9) return true;
      if (agent.level >= 6) return this.tick % 2 === 0;
      if (agent.level >= 3) return this.tick % 3 === 0;
      return this.tick % 5 === 0;
    });

    // Debug: show inbox state for event-driven agents
    const eventAgents = this.agents.filter(a => a.trigger === 'event-driven');
    for (const ea of eventAgents) {
      if (ea.inbox.length > 0) console.log(`  📬 ${ea.name} has ${ea.inbox.length} inbox messages`);
    }
    // Limit agents per tick for cloud APIs (Groq free = 30 RPM)
    // Shuffle so every agent gets a fair turn across ticks
    for (let i = actingAgents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [actingAgents[i], actingAgents[j]] = [actingAgents[j], actingAgents[i]];
    }
    const maxPerTick = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY ? 6 : actingAgents.length;
    const agentsThisTick = actingAgents.slice(0, maxPerTick);
    if (actingAgents.length > maxPerTick) {
      console.log(`  ${actingAgents.length} agents want to act, capping to ${maxPerTick} this tick\n`);
    } else {
      console.log(`  ${agentsThisTick.length} agents acting this tick\n`);
    }

    const promises = agentsThisTick.map(async (agent) => {
      try {
        const context = buildContext(agent, this.agents, this.tasks, recentEventMsgs);
        const action = await getAgentDecision(agent, context, this.config);
        this.processAction(agent, action);
        // Clear inbox after event-driven agent processes its turn
        if (agent.trigger === 'event-driven') {
          agent.inbox = [];
        }
      } catch (err) {
        this.logAgent(agent, `💥 Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    await Promise.all(promises);

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
  }

  /** Reset the simulation.
   *  mode='organic' (default): start with just the COO — org grows from scratch
   *  mode='full': reload the full ORG.md structure (or hardcoded agents if no org) */
  async restart(mode: 'organic' | 'full' = 'organic'): Promise<void> {
    if (mode === 'full' && this.parsedOrg) {
      this.agents = [...this.parsedOrg.agents];
      this.log(`🔄 Sandbox reset — full ORG.md reload (${this.agents.length} agents)`);
    } else if (this.parsedOrg) {
      // Organic: just the COO from the parsed org
      const coo = this.parsedOrg.agents.find(a => a.role === 'coo');
      this.agents = coo ? [{ ...coo, taskIds: [], recentMessages: [], inbox: [], trigger: coo.trigger ?? 'event-driven', triggerOn: coo.triggerOn ?? ['escalation', 'completion', 'delegation'], stats: { tasksCompleted: 0, tasksFailed: 0, messagessSent: 0, creditsEarned: 0, creditsSpent: 0 } }] : createCOO();
      this.log('🔄 Sandbox reset — COO from ORG.md, organic growth');
    } else {
      this.agents = createCOO();
      this.log('🔄 Sandbox reset — starting with COO only');
    }
    this.tasks = createSeedTasks();
    this.events = [];
    this.metricsHistory = [];
    this.tick = 0;
    this.log(`   ${this.agents.length} agent(s) | ${this.tasks.length} seed tasks | model: ${this.config.model}`);
  }

  /** Run the full simulation (loops forever if maxTicks=0) */
  async run(): Promise<void> {
    const infinite = this.config.maxTicks === 0;
    let i = 0;
    while (infinite || i < this.config.maxTicks) {
      await this.runTick();
      i++;

      if (this.tick % 5 === 0) {
        this.printSummary();
      }

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
    
    const totalMessages = this.agents.reduce((sum, a) => sum + a.stats.messagessSent, 0);
    const totalCompleted = this.agents.reduce((sum, a) => sum + a.stats.tasksCompleted, 0);
    console.log(`Messages sent: ${totalMessages} | Tasks completed by agents: ${totalCompleted}`);
    
    const sorted = [...this.agents].sort((a, b) => b.stats.tasksCompleted - a.stats.tasksCompleted);
    const top = sorted.filter(a => a.stats.tasksCompleted > 0).slice(0, 5);
    if (top.length > 0) {
      console.log(`\nTop performers:`);
      for (const a of top) {
        console.log(`  ${a.name} (L${a.level}): ${a.stats.tasksCompleted} tasks, ${a.stats.messagessSent} messages`);
      }
    }
    console.log(`${'─'.repeat(60)}`);
  }
}
