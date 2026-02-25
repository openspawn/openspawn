import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeDecision, type ExecutionContext } from './decision-executor.js';
import { makeAgentPublic } from './agents.js';
import type { SandboxAgent, SandboxTask } from './types.js';
import type { AgentDecision } from './markdown-decision.js';

// ── Test Helpers ─────────────────────────────────────────────────────────────

function makeCOO(): SandboxAgent {
  return makeAgentPublic('coo', 'COO', 'coo', 10, 'Operations', undefined, 'Test COO');
}

function makeLead(id = 'lead', name = 'Lead'): SandboxAgent {
  return makeAgentPublic(id, name, 'lead', 7, 'Engineering', 'coo', 'Test lead');
}

function makeWorker(id = 'worker', name = 'Worker'): SandboxAgent {
  return makeAgentPublic(id, name, 'worker', 4, 'Engineering', 'lead', 'Test worker');
}

function makeTask(id = 'TASK-0001', assigneeId?: string): SandboxTask {
  return {
    id,
    title: `Test task ${id}`,
    description: `Description for ${id}`,
    priority: 'high',
    status: 'assigned',
    assigneeId,
    creatorId: 'coo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    activityLog: [],
    acked: false,
  };
}

function createContext(agents: SandboxAgent[], tasks: SandboxTask[] = []): ExecutionContext {
  return { agents, tasks };
}

/** Suppress console output during tests */
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('decision-executor', () => {
  describe('delegate', () => {
    it('assigns task to target agent', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const task = makeTask('TASK-0001', 'coo');
      const ctx = createContext([coo, lead], [task]);

      const decision: AgentDecision = {
        action: 'delegate',
        target: 'lead',
        task: 'TASK-0001',
        message: 'Handle this please',
      };

      executeDecision(coo, decision, ctx);

      expect(task.assigneeId).toBe('lead');
      expect(task.status).toBe('assigned');
      expect(lead.taskIds).toContain('TASK-0001');
    });

    it('creates ACP delegation message in activity log', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const task = makeTask('TASK-0001');
      const ctx = createContext([coo, lead], [task]);

      executeDecision(coo, {
        action: 'delegate',
        target: 'lead',
        task: 'TASK-0001',
        message: 'Take this',
      }, ctx);

      const delegationMsg = task.activityLog.find(m => m.type === 'delegation');
      expect(delegationMsg).toBeDefined();
      expect(delegationMsg!.from).toBe('coo');
      expect(delegationMsg!.to).toBe('lead');
    });

    it('auto-acks delegation', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const task = makeTask('TASK-0001');
      const ctx = createContext([coo, lead], [task]);

      executeDecision(coo, {
        action: 'delegate',
        target: 'lead',
        task: 'TASK-0001',
        message: 'Do it',
      }, ctx);

      expect(task.acked).toBe(true);
      const ackMsg = task.activityLog.find(m => m.type === 'ack');
      expect(ackMsg).toBeDefined();
    });

    it('increments messagesSent stat', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const ctx = createContext([coo, lead], [makeTask('TASK-0001')]);

      executeDecision(coo, {
        action: 'delegate',
        target: 'lead',
        task: 'TASK-0001',
        message: 'Go',
      }, ctx);

      expect(coo.stats.messagesSent).toBe(1);
    });

    it('creates new task when task ref not found', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const ctx = createContext([coo, lead], []);

      executeDecision(coo, {
        action: 'delegate',
        target: 'lead',
        task: 'new: Build the API',
        message: 'Build it',
      }, ctx);

      expect(ctx.tasks).toHaveLength(1);
      expect(ctx.tasks[0].title).toContain('Build the API');
      expect(ctx.tasks[0].assigneeId).toBe('lead');
    });

    it('handles missing target gracefully', () => {
      const coo = makeCOO();
      const ctx = createContext([coo], [makeTask('TASK-0001')]);

      // Should not throw
      executeDecision(coo, {
        action: 'delegate',
        target: 'nonexistent',
        task: 'TASK-0001',
        message: 'Go',
      }, ctx);

      // Task should remain unchanged
      expect(ctx.tasks[0].assigneeId).toBeUndefined();
    });
  });

  describe('escalate', () => {
    it('sends escalation ACP message to parent', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const task = makeTask('TASK-0001', 'lead');
      const ctx = createContext([coo, lead], [task]);

      executeDecision(lead, {
        action: 'escalate',
        target: 'coo',
        task: 'TASK-0001',
        message: 'Blocked on this',
      }, ctx);

      const escMsg = task.activityLog.find(m => m.type === 'escalation');
      expect(escMsg).toBeDefined();
      expect(escMsg!.from).toBe('lead');
      expect(escMsg!.to).toBe('coo');
      expect(escMsg!.reason).toBe('BLOCKED');
    });

    it('increments messagesSent on escalation', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const ctx = createContext([coo, lead], [makeTask('TASK-0001', 'lead')]);

      executeDecision(lead, {
        action: 'escalate',
        target: 'coo',
        task: 'TASK-0001',
        message: 'Stuck',
      }, ctx);

      expect(lead.stats.messagesSent).toBe(1);
    });

    it('does nothing when agent has no parent', () => {
      const orphan = makeAgentPublic('orphan', 'Orphan', 'worker', 4, 'Eng', undefined, 'No parent');
      const ctx = createContext([orphan], []);

      // Should not throw
      executeDecision(orphan, {
        action: 'escalate',
        target: 'none',
        task: 'TASK-9999',
        message: 'Help',
      }, ctx);

      expect(orphan.stats.messagesSent).toBe(0);
    });
  });

  describe('complete', () => {
    it('marks task as done', () => {
      const coo = makeCOO();
      const worker = makeWorker();
      const task = makeTask('TASK-0001', 'worker');
      const ctx = createContext([coo, worker], [task]);

      executeDecision(worker, {
        action: 'complete',
        target: 'none',
        task: 'TASK-0001',
        message: 'All done',
      }, ctx);

      expect(task.status).toBe('done');
    });

    it('increments tasksCompleted stat', () => {
      const coo = makeCOO();
      const worker = makeWorker();
      const task = makeTask('TASK-0001', 'worker');
      const ctx = createContext([coo, worker], [task]);

      executeDecision(worker, {
        action: 'complete',
        target: 'none',
        task: 'TASK-0001',
        message: 'Done',
      }, ctx);

      expect(worker.stats.tasksCompleted).toBe(1);
    });

    it('awards credits based on priority', () => {
      const coo = makeCOO();
      const worker = makeWorker();
      const task = makeTask('TASK-0001', 'worker');
      task.priority = 'high';
      const ctx = createContext([coo, worker], [task]);

      executeDecision(worker, {
        action: 'complete',
        target: 'none',
        task: 'TASK-0001',
        message: 'Done',
      }, ctx);

      expect(worker.stats.creditsEarned).toBe(50); // high priority = 50
    });

    it('awards 100 credits for critical priority', () => {
      const coo = makeCOO();
      const worker = makeWorker();
      const task = makeTask('TASK-0001', 'worker');
      task.priority = 'critical';
      const ctx = createContext([coo, worker], [task]);

      executeDecision(worker, {
        action: 'complete',
        target: 'none',
        task: 'TASK-0001',
        message: 'Done',
      }, ctx);

      expect(worker.stats.creditsEarned).toBe(100);
    });

    it('sends completion ACP message to parent', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const worker = makeWorker();
      const task = makeTask('TASK-0001', 'worker');
      const ctx = createContext([coo, lead, worker], [task]);

      executeDecision(worker, {
        action: 'complete',
        target: 'none',
        task: 'TASK-0001',
        message: 'Finished it',
      }, ctx);

      const completionMsg = task.activityLog.find(m => m.type === 'completion');
      expect(completionMsg).toBeDefined();
      expect(completionMsg!.from).toBe('worker');
      expect(completionMsg!.to).toBe('lead'); // worker's parent
    });

    it('does nothing when task not found', () => {
      const worker = makeWorker();
      const ctx = createContext([worker], []);

      // Should not throw
      executeDecision(worker, {
        action: 'complete',
        target: 'none',
        task: 'NONEXISTENT',
        message: 'Done',
      }, ctx);

      expect(worker.stats.tasksCompleted).toBe(0);
    });
  });

  describe('message', () => {
    it('sends ACP status_request message', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const ctx = createContext([coo, lead], []);

      executeDecision(coo, {
        action: 'message',
        target: 'lead',
        task: 'none',
        message: 'How is everything going?',
      }, ctx);

      expect(coo.stats.messagesSent).toBe(1);

      // Lead should have received the message
      const received = lead.recentMessages.find(m => m.from === 'coo');
      expect(received).toBeDefined();
      expect(received!.body).toBe('How is everything going?');
    });
  });

  describe('hire', () => {
    it('hires from roster when available', () => {
      const coo = makeCOO();
      const rosterAgent = makeAgentPublic('alice', 'Alice', 'lead', 7, 'Engineering', undefined, 'From roster');
      const ctx = createContext([coo], []);
      ctx.parsedOrgAgents = [coo, rosterAgent];

      executeDecision(coo, {
        action: 'hire',
        target: 'alice',
        task: 'Engineering',
        message: 'Welcome aboard!',
      }, ctx);

      expect(ctx.agents).toHaveLength(2);
      expect(ctx.agents.find(a => a.id === 'alice')).toBeDefined();
      expect(ctx.agents.find(a => a.id === 'alice')!.parentId).toBe('coo');
    });

    it('creates generic agent when no roster match', () => {
      const coo = makeCOO();
      const ctx = createContext([coo], []);
      ctx.parsedOrgAgents = [coo]; // No other agents in roster

      executeDecision(coo, {
        action: 'hire',
        target: 'New Worker',
        task: 'Marketing',
        message: 'Hired!',
      }, ctx);

      expect(ctx.agents).toHaveLength(2);
      const hired = ctx.agents.find(a => a.id !== 'coo');
      expect(hired).toBeDefined();
      expect(hired!.name).toBe('New Worker');
    });

    it('sets hired agent as active with correct parent', () => {
      const coo = makeCOO();
      const rosterAgent = makeAgentPublic('bob', 'Bob', 'worker', 4, 'Finance', undefined, 'Roster');
      const ctx = createContext([coo], []);
      ctx.parsedOrgAgents = [coo, rosterAgent];

      executeDecision(coo, {
        action: 'hire',
        target: 'bob',
        task: 'Finance',
        message: 'Welcome!',
      }, ctx);

      const bob = ctx.agents.find(a => a.id === 'bob');
      expect(bob!.status).toBe('active');
      expect(bob!.parentId).toBe('coo');
    });
  });

  describe('ACP message routing', () => {
    it('event-driven agents receive messages in inbox', () => {
      const coo = makeCOO(); // L10, event-driven
      const lead = makeLead(); // L7, event-driven
      const task = makeTask('TASK-0001', 'lead');
      const ctx = createContext([coo, lead], [task]);

      // Worker escalates → should land in COO's inbox since COO is event-driven
      executeDecision(lead, {
        action: 'escalate',
        target: 'coo',
        task: 'TASK-0001',
        message: 'Blocked',
      }, ctx);

      // COO should have the escalation in inbox (event-driven + escalation is in triggerOn)
      const cooInbox = coo.inbox.filter(m => m.type === 'escalation');
      expect(cooInbox.length).toBeGreaterThanOrEqual(1);
    });

    it('keeps recentMessages capped at 10', () => {
      const coo = makeCOO();
      const lead = makeLead();
      const ctx = createContext([coo, lead], []);

      // Send 15 messages
      for (let i = 0; i < 15; i++) {
        executeDecision(coo, {
          action: 'message',
          target: 'lead',
          task: 'none',
          message: `Message ${i}`,
        }, ctx);
      }

      expect(coo.recentMessages.length).toBeLessThanOrEqual(10);
      expect(lead.recentMessages.length).toBeLessThanOrEqual(10);
    });
  });
});
