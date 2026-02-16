// ── LLM Simulation Engine ───────────────────────────────────────────────────
// Extends DeterministicSimulation to use LLM decisions for L7+ agents.
// Workers (L1-6) remain deterministic. Falls back to deterministic if LLM fails.

import { DeterministicSimulation } from './deterministic.js';
import { generate, isOllamaAvailable, getLLMConfig, type LLMConfig } from './llm-provider.js';
import { buildAgentPrompt, parseDecision, resolveAgentId, type AgentDecision, type SimulationState } from './markdown-decision.js';
import { DecisionRecorder } from './recorder.js';
import { makeAgentPublic } from './agents.js';
import type { SandboxAgent, SandboxTask, SandboxConfig, ACPMessage } from './types.js';
import type { ParsedOrg } from './org-parser.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helpers (duplicated from deterministic.ts to avoid modifying it) ────────

let llmTaskCounter = 10000; // offset to avoid collisions with deterministic counter
function nextLLMTaskId(): string {
  return `TASK-${String(++llmTaskCounter).padStart(4, '0')}`;
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

// ── LLM Simulation ─────────────────────────────────────────────────────────

export class LLMSimulation extends DeterministicSimulation {
  private llmConfig: LLMConfig;
  private recorder: DecisionRecorder | null = null;
  private recording: boolean;
  private ollamaAvailable: boolean | null = null; // null = not checked yet
  private scenarioOrder: string = '';

  constructor(
    agents: SandboxAgent[],
    config: SandboxConfig,
    skipSeedTasks = false,
    parsedOrg?: ParsedOrg,
    recording = false,
  ) {
    super(agents, config, skipSeedTasks, parsedOrg);
    this.llmConfig = getLLMConfig();
    this.recording = recording;

    const modeLabel = recording ? 'record' : 'hybrid';
    console.log(`\n🧠 LLM Simulation (${modeLabel} mode)`);
    console.log(`   Model: ${this.llmConfig.model} @ ${this.llmConfig.baseUrl}`);
    console.log(`   L7+ agents use LLM decisions, L1-6 stay deterministic`);
  }

  private getSimState(): SimulationState {
    return {
      agents: this.agents,
      tasks: this.tasks,
      tick: this.tick,
    };
  }

  /** Override runTick to inject LLM decisions for L7+ agents before deterministic tick */
  async runTick(): Promise<void> {
    // Check Ollama availability on first tick
    if (this.ollamaAvailable === null) {
      this.ollamaAvailable = await isOllamaAvailable(this.llmConfig);
      if (!this.ollamaAvailable) {
        console.log('⚠️  Ollama not available — all agents will use deterministic logic');
      }
    }

    // Run LLM decisions for active L7+ agents BEFORE the deterministic tick.
    // Successfully handled agents are added to skipAgentIds so the deterministic
    // loop doesn't double-process them. Failed agents fall through to deterministic.
    if (this.ollamaAvailable) {
      const llmAgents = this.agents.filter(a =>
        a.status === 'active' && a.level >= 7
      );

      for (const agent of llmAgents) {
        try {
          await this.tickAgentLLM(agent);
        } catch (err) {
          console.log(`  ⚠️ LLM error for ${agent.name}: ${err instanceof Error ? err.message : String(err)}`);
          // Don't add to skipAgentIds — deterministic tick will handle this agent
        }
      }
    }

    // Run the normal deterministic tick (skips LLM-handled agents, handles L1-6 + fallbacks)
    await super.runTick();
  }

  private async tickAgentLLM(agent: SandboxAgent): Promise<void> {
    const state = this.getSimState();
    const prompt = buildAgentPrompt(agent, state);
    const response = await generate(prompt, this.llmConfig);
    const decision = parseDecision(response.text);

    if (!decision) {
      console.log(`  ⚠️ ${agent.name}: LLM response unparseable, falling back to deterministic`);
      return; // deterministic tick will handle
    }

    console.log(`  🧠 ${agent.name}: ${decision.action} → ${decision.target} | ${decision.message.slice(0, 60)}`);

    // Record if in recording mode
    if (this.recording) {
      if (!this.recorder) {
        this.recorder = new DecisionRecorder(
          this.scenarioOrder || 'LLM Simulation',
          this.llmConfig.model,
        );
      }
      this.recorder.record(agent, decision, this.tick, response.tokens, response.durationMs);
    }

    // Execute the decision
    this.executeDecision(agent, decision);

    // Mark this agent so the deterministic tick skips it
    this.skipAgentIds.add(agent.id);
  }

  private executeDecision(agent: SandboxAgent, decision: AgentDecision): void {
    switch (decision.action) {
      case 'delegate': {
        // If agent has no active direct reports, convert to work
        const hasReports = this.agents.some(a => a.parentId === agent.id && a.status === 'active');
        if (!hasReports) {
          console.log(`  ⚠️ ${agent.name}: no active reports — converting delegate to work`);
          this.executeWork(agent, { ...decision, action: 'work' });
          break;
        }
        this.executeDelegation(agent, decision);
        break;
      }
      case 'escalate':
        this.executeEscalation(agent, decision);
        break;
      case 'work':
        this.executeWork(agent, decision);
        break;
      case 'complete':
        this.executeCompletion(agent, decision);
        break;
      case 'message':
        this.executeMessage(agent, decision);
        break;
      case 'hire':
        this.executeHire(agent, decision);
        break;
      case 'idle':
        // Do nothing — agent explicitly chose to wait
        break;
    }
  }

  private executeDelegation(agent: SandboxAgent, decision: AgentDecision): void {
    const targetId = resolveAgentId(decision.target, this.agents);
    const target = targetId ? this.agents.find(a => a.id === targetId) : undefined;
    if (!target) {
      console.log(`  ⚠️ ${agent.name}: delegate target "${decision.target}" not found`);
      return;
    }

    // Guard: can't delegate to your parent or someone above you — that's escalation
    if (target.id === agent.parentId || target.level > agent.level) {
      console.log(`  ⚠️ ${agent.name}: can't delegate UP to ${target.name} (L${target.level}) — converting to escalation`);
      this.executeEscalation(agent, { ...decision, action: 'escalate' });
      return;
    }

    // Guard: prefer delegating to direct reports, not sideways
    const isDirectReport = target.parentId === agent.id;
    const isSubordinate = target.level < agent.level;
    if (!isDirectReport && !isSubordinate) {
      console.log(`  ⚠️ ${agent.name}: ${target.name} is not a report — converting to message`);
      this.executeMessage(agent, { ...decision, action: 'message' });
      return;
    }

    // Find or create task
    let task = this.resolveTask(decision.task, agent);
    if (!task) {
      // Create new task from "new: description"
      const title = decision.task.replace(/^new:\s*/i, '').trim() || decision.message.slice(0, 80);
      task = this.createTask(title, agent);
    }

    // Assign to target
    task.assigneeId = target.id;
    task.status = 'assigned';
    if (!target.taskIds.includes(task.id)) target.taskIds.push(task.id);

    const msg = createACPMessage('delegation', agent.id, target.id, task.id, {
      body: decision.message || `Delegating "${task.title}" to ${target.name}`,
    });
    pushMessage(this.agents, msg);
    task.activityLog.push(msg);
    agent.stats.messagessSent++;

    // Auto-ack
    const ack = createACPMessage('ack', target.id, agent.id, task.id, {
      body: `Acknowledged: "${task.title}"`,
    });
    pushMessage(this.agents, ack);
    task.activityLog.push(ack);
    task.acked = true;
  }

  private executeEscalation(agent: SandboxAgent, decision: AgentDecision): void {
    const parent = agent.parentId ? this.agents.find(a => a.id === agent.parentId) : undefined;
    if (!parent) return;

    const task = this.resolveTask(decision.task, agent);
    const taskId = task?.id ?? '';

    const msg = createACPMessage('escalation', agent.id, parent.id, taskId, {
      reason: 'BLOCKED',
      body: decision.message || `Escalating: ${decision.task}`,
    });
    pushMessage(this.agents, msg);
    if (task) task.activityLog.push(msg);
    agent.stats.messagessSent++;
  }

  private executeWork(agent: SandboxAgent, decision: AgentDecision): void {
    let task = this.resolveTask(decision.task, agent);
    if (!task) {
      // Try to find any task assigned to this agent
      task = this.tasks.find(t => t.assigneeId === agent.id && !['done', 'rejected'].includes(t.status));
    }
    if (!task) return;

    // Mark task as in-progress
    if (task.status === 'assigned' || task.status === 'backlog') {
      task.status = 'in_progress';
    }
    task.updatedAt = Date.now();

    // Log progress
    const progressMsg = createACPMessage('progress', agent.id, agent.parentId || '', task.id, {
      body: decision.message || `Working on "${task.title}"`,
    });
    pushMessage(this.agents, progressMsg);
    task.activityLog.push(progressMsg);
    agent.stats.messagessSent++;
  }

  private executeCompletion(agent: SandboxAgent, decision: AgentDecision): void {
    let task = this.resolveTask(decision.task, agent);
    if (!task) {
      // Try to find any in-progress task assigned to this agent
      task = this.tasks.find(t => t.assigneeId === agent.id && t.status === 'in_progress');
    }
    if (!task) return;

    // Guard: only complete tasks that have been worked on (in_progress or review)
    if (task.status !== 'in_progress' && task.status !== 'review') {
      console.log(`  ⚠️ ${agent.name}: Can't complete "${task.title}" (status: ${task.status}) — must work on it first`);
      // Auto-convert to work action instead
      this.executeWork(agent, { ...decision, action: 'work' });
      return;
    }

    // Guard: only the assignee or creator can complete
    if (task.assigneeId !== agent.id && task.creatorId !== agent.id) return;

    task.status = 'done';
    task.updatedAt = Date.now();
    agent.stats.tasksCompleted++;
    agent.stats.creditsEarned += task.priority === 'critical' ? 100 : task.priority === 'high' ? 50 : 25;

    const parent = agent.parentId ? this.agents.find(a => a.id === agent.parentId) : undefined;
    if (parent) {
      const msg = createACPMessage('completion', agent.id, parent.id, task.id, {
        summary: decision.message || `Completed: "${task.title}"`,
        body: `Completed: "${task.title}"`,
      });
      pushMessage(this.agents, msg);
      task.activityLog.push(msg);
      agent.stats.messagessSent++;
    }
  }

  private executeMessage(agent: SandboxAgent, decision: AgentDecision): void {
    const targetId = resolveAgentId(decision.target, this.agents);
    if (!targetId) return;

    const task = this.resolveTask(decision.task, agent);
    const msg = createACPMessage('status_request', agent.id, targetId, task?.id ?? '', {
      body: decision.message,
    });
    pushMessage(this.agents, msg);
    agent.stats.messagessSent++;
  }

  private executeHire(agent: SandboxAgent, decision: AgentDecision): void {
    // Try to use roster-based hiring from the parent class
    // Access parsedOrg through the inherited property
    const roster = (this as any).parsedOrg?.agents || [];
    const notYetHired = roster.filter((r: SandboxAgent) => !this.agents.find(a => a.id === r.id));

    const domain = decision.task.replace(/^new:\s*/i, '').trim() || agent.domain;
    const candidate = notYetHired.find((r: SandboxAgent) =>
      r.domain?.toLowerCase().includes(domain.toLowerCase())
    ) || notYetHired[0];

    if (candidate) {
      candidate.parentId = agent.id;
      candidate.status = 'active';
      this.agents.push(candidate);

      const msg = createACPMessage('delegation', agent.id, candidate.id, '', {
        body: decision.message || `Welcome aboard, ${candidate.name}!`,
      });
      pushMessage(this.agents, msg);
      agent.stats.messagessSent++;
      console.log(`  🐣 ${agent.name} hired ${candidate.name} (L${candidate.level} ${candidate.domain})`);
    } else {
      // Create a generic agent
      const name = decision.target !== 'none' ? decision.target : `${domain} Worker`;
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!this.agents.find(a => a.id === id)) {
        const newAgent = makeAgentPublic(id, name, 'worker', 4, domain, agent.id, `Hired by ${agent.name}`);
        newAgent.status = 'active';
        this.agents.push(newAgent);
        console.log(`  🐣 ${agent.name} created ${name} (L4 ${domain})`);
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private resolveTask(taskRef: string, agent: SandboxAgent): SandboxTask | undefined {
    if (!taskRef) return undefined;
    // Direct ID match (e.g. "TASK-0001")
    const byId = this.tasks.find(t => t.id === taskRef);
    if (byId) return byId;
    // Partial match
    const upper = taskRef.toUpperCase();
    return this.tasks.find(t => t.id === upper) ||
      this.tasks.find(t => t.assigneeId === agent.id && !['done', 'rejected'].includes(t.status));
  }

  private createTask(title: string, creator: SandboxAgent): SandboxTask {
    const task: SandboxTask = {
      id: nextLLMTaskId(),
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
    this.tasks.push(task);
    return task;
  }

  /** Override processOrder to capture scenario name for recording */
  processOrder(order: string): void {
    this.scenarioOrder = order;
    super.processOrder(order);
  }

  /** Save recording when simulation stops */
  async saveRecording(): Promise<string | null> {
    if (!this.recorder || this.recorder.entryCount === 0) return null;
    const dir = resolve(__dirname, '..', 'scenarios', 'recorded');
    const filepath = await this.recorder.save(dir);
    console.log(`\n📼 Recording saved: ${filepath}`);
    return filepath;
  }

  /** Override restart to save recording first */
  async restart(mode: 'organic' | 'full' = 'organic'): Promise<void> {
    if (this.recording) {
      await this.saveRecording();
      this.recorder = null;
    }
    await super.restart(mode);
  }
}
