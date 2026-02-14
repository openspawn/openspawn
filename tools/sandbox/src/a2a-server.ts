// ── A2A Protocol Server ──────────────────────────────────────────────────────
// Bridges A2A protocol to the BikiniBottom DeterministicSimulation engine

import type { ServerResponse } from 'node:http';
import type { DeterministicSimulation } from './deterministic.js';
import type { SandboxAgent, SandboxTask } from './types.js';
import type {
  AgentCard, AgentSkill, Task, TaskState, TaskStatus, Message, Part,
  Artifact, SendMessageRequest, StreamEvent, TaskStatusUpdateEvent, TaskArtifactUpdateEvent,
} from './a2a-types.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'https://bikinibottom.ai';

function generateTaskId(): string {
  return `a2a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateContextId(): string {
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Map SandboxTask.status → A2A TaskState */
function mapStatus(status: SandboxTask['status']): TaskState {
  switch (status) {
    case 'backlog':
    case 'pending':
    case 'assigned':
      return 'submitted';
    case 'in_progress':
    case 'review':
      return 'working';
    case 'done':
      return 'completed';
    case 'blocked':
      return 'input-required';
    case 'rejected':
      return 'failed';
    default:
      return 'submitted';
  }
}

/** Extract text from A2A message parts */
function extractText(message: Message): string {
  return message.parts
    .filter((p): p is { kind: 'text'; text: string } => p.kind === 'text')
    .map(p => p.text)
    .join('\n');
}

/** Domain keyword matching (mirrors deterministic.ts DOMAIN_KEYWORDS) */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  engineering: ['api', 'backend', 'frontend', 'architecture', 'code', 'build', 'develop', 'bug', 'fix', 'deploy', 'test', 'database', 'server', 'sdk', 'infrastructure'],
  marketing: ['landing', 'campaign', 'blog', 'seo', 'brand', 'launch', 'content', 'social', 'press', 'announce', 'outreach', 'website'],
  finance: ['pricing', 'projection', 'revenue', 'budget', 'invoice', 'financial', 'cost', 'billing', 'model', 'forecast', 'report'],
  sales: ['demo', 'lead', 'outreach', 'pipeline', 'prospect', 'deal', 'contract', 'enterprise', 'cold'],
  support: ['ticket', 'support', 'customer', 'help', 'resolve', 'backlog', 'issue'],
  hr: ['onboard', 'hire', 'recruit', 'team', 'culture', 'training'],
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

/** Build skill list for an agent based on domain */
function domainSkills(domain: string): AgentSkill[] {
  const skillMap: Record<string, AgentSkill[]> = {
    operations: [
      { id: 'task-delegation', name: 'Task Delegation', description: 'Delegate tasks to specialized agent teams' },
      { id: 'agent-coordination', name: 'Agent Coordination', description: 'Coordinate multi-agent workflows with hierarchical delegation' },
    ],
    engineering: [
      { id: 'code-development', name: 'Code Development', description: 'Build software features, APIs, and systems' },
      { id: 'bug-fixing', name: 'Bug Fixing', description: 'Find and fix software bugs' },
      { id: 'code-review', name: 'Code Review', description: 'Review code for quality and security' },
    ],
    marketing: [
      { id: 'content-creation', name: 'Content Creation', description: 'Create marketing content and copy' },
      { id: 'seo-optimization', name: 'SEO Optimization', description: 'Optimize content for search engines' },
      { id: 'campaign-management', name: 'Campaign Management', description: 'Plan and execute marketing campaigns' },
    ],
    finance: [
      { id: 'financial-analysis', name: 'Financial Analysis', description: 'Analyze financial data and generate reports' },
      { id: 'budget-management', name: 'Budget Management', description: 'Track budgets, invoices, and expenses' },
    ],
    sales: [
      { id: 'lead-generation', name: 'Lead Generation', description: 'Find and qualify sales leads' },
      { id: 'account-management', name: 'Account Management', description: 'Manage client relationships' },
    ],
    support: [
      { id: 'ticket-resolution', name: 'Ticket Resolution', description: 'Resolve customer support tickets' },
      { id: 'escalation-handling', name: 'Escalation Handling', description: 'Handle complex escalated issues' },
    ],
    hr: [
      { id: 'recruitment', name: 'Recruitment', description: 'Source and screen candidates' },
      { id: 'onboarding', name: 'Onboarding', description: 'Help new agents get productive' },
    ],
  };
  return skillMap[domain.toLowerCase()] || skillMap['engineering']!;
}

// ── Tracked A2A Task ────────────────────────────────────────────────────────

interface TrackedTask {
  a2aTask: Task;
  sandboxTaskId: string | null;
  contextId: string;
  history: Message[];
  artifacts: Artifact[];
  subscribers: ServerResponse[];
}

// ── A2AServer ───────────────────────────────────────────────────────────────

export class A2AServer {
  private sim: DeterministicSimulation;
  private trackedTasks = new Map<string, TrackedTask>();

  constructor(sim: DeterministicSimulation) {
    this.sim = sim;

    // Subscribe to simulation events to update A2A tasks
    this.sim.onEvent((event) => {
      if (!event.taskId) return;
      // Find tracked task by sandbox task ID
      for (const [, tracked] of this.trackedTasks) {
        if (tracked.sandboxTaskId !== event.taskId) continue;

        const sandboxTask = this.sim.tasks.find(t => t.id === event.taskId);
        if (!sandboxTask) continue;

        const newState = mapStatus(sandboxTask.status);
        const oldState = tracked.a2aTask.status.state;
        if (newState === oldState) continue;

        // Update status
        tracked.a2aTask.status = {
          state: newState,
          message: {
            role: 'agent',
            parts: [{ kind: 'text', text: event.message }],
          },
          timestamp: new Date().toISOString(),
        };

        const isFinal = newState === 'completed' || newState === 'failed' || newState === 'canceled';

        // Generate artifact on completion
        if (newState === 'completed') {
          const lastActivity = sandboxTask.activityLog[sandboxTask.activityLog.length - 1];
          const artifact: Artifact = {
            artifactId: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: 'Task Result',
            description: `Result of: ${sandboxTask.title}`,
            parts: [{ kind: 'text', text: lastActivity?.body || lastActivity?.summary || 'Task completed successfully.' }],
          };
          tracked.artifacts.push(artifact);
          tracked.a2aTask.artifacts = [...tracked.artifacts];

          // Push artifact event to subscribers
          const artEvent: TaskArtifactUpdateEvent = {
            kind: 'artifact-update',
            taskId: tracked.a2aTask.id,
            contextId: tracked.contextId,
            artifact,
          };
          this.pushToSubscribers(tracked, artEvent);
        }

        // Push status event to subscribers
        const statusEvent: TaskStatusUpdateEvent = {
          kind: 'status-update',
          taskId: tracked.a2aTask.id,
          contextId: tracked.contextId,
          status: tracked.a2aTask.status,
          final: isFinal,
        };
        this.pushToSubscribers(tracked, statusEvent);

        // Close subscribers on final
        if (isFinal) {
          for (const sub of tracked.subscribers) {
            try { sub.end(); } catch { /* ignore */ }
          }
          tracked.subscribers = [];
        }
      }
    });
  }

  private pushToSubscribers(tracked: TrackedTask, event: StreamEvent): void {
    const data = JSON.stringify(event);
    tracked.subscribers = tracked.subscribers.filter(sub => {
      try {
        sub.write(`data: ${data}\n\n`);
        return true;
      } catch {
        return false;
      }
    });
  }

  // ── Agent Cards ─────────────────────────────────────────────────────────

  getControlPlaneCard(): AgentCard {
    return {
      name: 'BikiniBottom',
      description: `AI agent orchestration control plane — ${this.sim.agents.length} agents coordinating in real-time`,
      url: BASE_URL,
      version: '1.0.0',
      capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: false },
      skills: [
        { id: 'task-delegation', name: 'Task Delegation', description: 'Delegate tasks to specialized agent teams across engineering, marketing, finance, and support domains' },
        { id: 'agent-coordination', name: 'Agent Coordination', description: 'Coordinate multi-agent workflows with hierarchical delegation and ACP messaging' },
      ],
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain', 'application/json'],
      protocolVersion: '0.3',
    };
  }

  getAgentCard(agentId: string): AgentCard | null {
    const agent = this.sim.agents.find(a => a.id === agentId);
    if (!agent) return null;

    return {
      name: agent.name,
      description: `L${agent.level} ${agent.domain} ${agent.role} — ${agent.systemPrompt.split('.')[0]}.`,
      url: `${BASE_URL}/agents/${agent.id}`,
      version: '1.0.0',
      capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: false },
      skills: domainSkills(agent.domain),
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain', 'application/json'],
      protocolVersion: '0.3',
    };
  }

  // ── Message Handling ──────────────────────────────────────────────────────

  handleSendMessage(req: SendMessageRequest): Task {
    const text = extractText(req.message);
    if (!text) {
      throw { code: 'InvalidRequest', message: 'Message must contain at least one text part', status: 400 };
    }

    const taskId = generateTaskId();
    const contextId = req.message.contextId || generateContextId();

    // Create A2A task
    const a2aTask: Task = {
      id: taskId,
      contextId,
      status: {
        state: 'submitted',
        message: req.message,
        timestamp: new Date().toISOString(),
      },
      history: [req.message],
      artifacts: [],
    };

    const tracked: TrackedTask = {
      a2aTask,
      sandboxTaskId: null,
      contextId,
      history: [req.message],
      artifacts: [],
      subscribers: [],
    };

    this.trackedTasks.set(taskId, tracked);

    // Route to simulation via processOrder (same as /api/order)
    this.sim.processOrder(text);

    // Find the most recently created sandbox task (just created by processOrder)
    const latestTask = this.sim.tasks[this.sim.tasks.length - 1];
    if (latestTask) {
      tracked.sandboxTaskId = latestTask.id;
      a2aTask.metadata = { sandboxTaskId: latestTask.id, domain: detectDomain(text) };

      // Update to working if already assigned
      if (latestTask.status !== 'backlog') {
        a2aTask.status = {
          state: 'working',
          message: {
            role: 'agent',
            parts: [{ kind: 'text', text: `Task routed to ${detectDomain(text)} team` }],
          },
          timestamp: new Date().toISOString(),
        };
      }
    }

    return a2aTask;
  }

  handleStreamMessage(req: SendMessageRequest, res: ServerResponse): void {
    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'A2A-Version': '0.3',
    });

    let task: Task;
    try {
      task = this.handleSendMessage(req);
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      res.end();
      return;
    }

    // Send initial task
    res.write(`data: ${JSON.stringify({ kind: 'status-update', taskId: task.id, contextId: task.contextId, status: task.status, final: false })}\n\n`);

    // Register as subscriber
    const tracked = this.trackedTasks.get(task.id);
    if (tracked) {
      tracked.subscribers.push(res);
    }

    res.on('close', () => {
      if (tracked) {
        tracked.subscribers = tracked.subscribers.filter(s => s !== res);
      }
    });
  }

  handleGetTask(taskId: string, historyLength?: number): Task {
    const tracked = this.trackedTasks.get(taskId);
    if (!tracked) {
      throw { code: 'TaskNotFound', message: `Task ${taskId} not found`, status: 404 };
    }

    // Sync status from sandbox task
    if (tracked.sandboxTaskId) {
      const sandboxTask = this.sim.tasks.find(t => t.id === tracked.sandboxTaskId);
      if (sandboxTask) {
        tracked.a2aTask.status.state = mapStatus(sandboxTask.status);
      }
    }

    const task = { ...tracked.a2aTask };
    if (historyLength !== undefined) {
      task.history = tracked.history.slice(-historyLength);
    } else {
      task.history = [...tracked.history];
    }
    task.artifacts = [...tracked.artifacts];
    return task;
  }

  handleListTasks(params: {
    contextId?: string;
    status?: string;
    pageSize?: number;
    pageToken?: string;
  }): { tasks: Task[]; nextPageToken?: string; pageSize: number; totalSize: number } {
    let entries = Array.from(this.trackedTasks.values());

    // Filter by contextId
    if (params.contextId) {
      entries = entries.filter(t => t.contextId === params.contextId);
    }

    // Filter by status
    if (params.status) {
      entries = entries.filter(t => t.a2aTask.status.state === params.status);
    }

    // Sort by timestamp desc
    entries.sort((a, b) =>
      new Date(b.a2aTask.status.timestamp).getTime() - new Date(a.a2aTask.status.timestamp).getTime()
    );

    const totalSize = entries.length;
    const pageSize = params.pageSize || 20;
    const startIndex = params.pageToken ? parseInt(params.pageToken, 10) : 0;
    const page = entries.slice(startIndex, startIndex + pageSize);
    const nextPageToken = startIndex + pageSize < totalSize ? String(startIndex + pageSize) : undefined;

    // Sync statuses
    for (const tracked of page) {
      if (tracked.sandboxTaskId) {
        const sandboxTask = this.sim.tasks.find(t => t.id === tracked.sandboxTaskId);
        if (sandboxTask) {
          tracked.a2aTask.status.state = mapStatus(sandboxTask.status);
        }
      }
    }

    return {
      tasks: page.map(t => ({ ...t.a2aTask, history: undefined })),
      nextPageToken,
      pageSize,
      totalSize,
    };
  }

  handleCancelTask(taskId: string): Task {
    const tracked = this.trackedTasks.get(taskId);
    if (!tracked) {
      throw { code: 'TaskNotFound', message: `Task ${taskId} not found`, status: 404 };
    }

    const currentState = tracked.a2aTask.status.state;
    if (currentState === 'completed' || currentState === 'failed' || currentState === 'canceled') {
      throw { code: 'InvalidStateTransition', message: `Cannot cancel task in ${currentState} state`, status: 400 };
    }

    tracked.a2aTask.status = {
      state: 'canceled',
      message: { role: 'agent', parts: [{ kind: 'text', text: 'Task canceled by user' }] },
      timestamp: new Date().toISOString(),
    };

    // Cancel sandbox task if linked
    if (tracked.sandboxTaskId) {
      const sandboxTask = this.sim.tasks.find(t => t.id === tracked.sandboxTaskId);
      if (sandboxTask) {
        sandboxTask.status = 'rejected';
        sandboxTask.updatedAt = Date.now();
      }
    }

    // Notify subscribers
    const statusEvent: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId: tracked.contextId,
      status: tracked.a2aTask.status,
      final: true,
    };
    this.pushToSubscribers(tracked, statusEvent);
    for (const sub of tracked.subscribers) {
      try { sub.end(); } catch { /* ignore */ }
    }
    tracked.subscribers = [];

    return tracked.a2aTask;
  }

  handleSubscribe(taskId: string, res: ServerResponse): void {
    const tracked = this.trackedTasks.get(taskId);
    if (!tracked) {
      res.writeHead(404, { 'Content-Type': 'application/json', 'A2A-Version': '0.3' });
      res.end(JSON.stringify({ code: 'TaskNotFound', message: `Task ${taskId} not found` }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'A2A-Version': '0.3',
    });

    // Send current state
    const statusEvent: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId: tracked.contextId,
      status: tracked.a2aTask.status,
      final: false,
    };
    res.write(`data: ${JSON.stringify(statusEvent)}\n\n`);

    // Check if already terminal
    const state = tracked.a2aTask.status.state;
    if (state === 'completed' || state === 'failed' || state === 'canceled') {
      // Send artifacts if any
      for (const artifact of tracked.artifacts) {
        const artEvent: TaskArtifactUpdateEvent = {
          kind: 'artifact-update',
          taskId,
          contextId: tracked.contextId,
          artifact,
        };
        res.write(`data: ${JSON.stringify(artEvent)}\n\n`);
      }
      // Send final
      res.write(`data: ${JSON.stringify({ ...statusEvent, final: true })}\n\n`);
      res.end();
      return;
    }

    tracked.subscribers.push(res);
    res.on('close', () => {
      tracked.subscribers = tracked.subscribers.filter(s => s !== res);
    });
  }
}
