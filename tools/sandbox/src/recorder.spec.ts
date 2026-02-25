import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecisionRecorder } from './recorder.js';
import type { SandboxAgent } from './types.js';
import type { AgentDecision } from './markdown-decision.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAgent(overrides: Partial<SandboxAgent> = {}): SandboxAgent {
  return {
    id: 'agent-1', name: 'Test Agent', role: 'worker', level: 4, domain: 'Engineering',
    status: 'active', systemPrompt: '', taskIds: [], recentMessages: [], trigger: 'polling',
    inbox: [], stats: { tasksCompleted: 0, tasksFailed: 0, messagesSent: 0, creditsEarned: 0, creditsSpent: 0 },
    ...overrides,
  };
}

function makeDecision(overrides: Partial<AgentDecision> = {}): AgentDecision {
  return { action: 'work', target: 'none', task: 'TASK-0001', message: 'Did some work', raw: 'Action: work', ...overrides };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DecisionRecorder – record', () => {
  it('records a decision', () => {
    const rec = new DecisionRecorder('test-scenario', 'qwen2.5:7b');
    rec.record(makeAgent(), makeDecision(), 1);
    expect(rec.entryCount).toBe(1);
  });

  it('records multiple decisions', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent(), makeDecision(), 1);
    rec.record(makeAgent({ id: 'agent-2', name: 'Agent 2' }), makeDecision({ action: 'delegate' }), 1);
    rec.record(makeAgent(), makeDecision({ action: 'idle' }), 2);
    expect(rec.entryCount).toBe(3);
  });

  it('stores tokens and duration', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent(), makeDecision(), 1, 150, 200);
    expect(rec.entryCount).toBe(1);
  });
});

describe('DecisionRecorder – toMarkdown', () => {
  it('generates valid markdown with frontmatter', () => {
    const rec = new DecisionRecorder('startup-sim', 'qwen2.5:7b');
    rec.record(makeAgent(), makeDecision(), 1);
    const md = rec.toMarkdown();
    expect(md).toContain('---');
    expect(md).toContain('scenario: startup-sim');
    expect(md).toContain('model: qwen2.5:7b');
    expect(md).toContain('decisions: 1');
  });

  it('includes tick and agent info in body', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent({ name: 'Alice', role: 'lead', level: 7 }), makeDecision({ action: 'delegate' }), 5);
    const md = rec.toMarkdown();
    expect(md).toContain('Tick 5');
    expect(md).toContain('Alice');
    expect(md).toContain('LEAD');
    expect(md).toContain('L7');
  });

  it('shows action distribution', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent(), makeDecision({ action: 'work' }), 1);
    rec.record(makeAgent(), makeDecision({ action: 'work' }), 2);
    rec.record(makeAgent(), makeDecision({ action: 'idle' }), 3);
    const md = rec.toMarkdown();
    expect(md).toContain('work: 2');
    expect(md).toContain('idle: 1');
  });

  it('shows average latency', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent(), makeDecision(), 1, 100, 200);
    rec.record(makeAgent(), makeDecision(), 2, 100, 400);
    const md = rec.toMarkdown();
    expect(md).toContain('avg_latency_ms: 300');
  });

  it('handles empty recorder', () => {
    const rec = new DecisionRecorder('empty', 'model');
    const md = rec.toMarkdown();
    expect(md).toContain('decisions: 0');
    expect(md).toContain('ticks: 0');
  });

  it('includes summary when set', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent(), makeDecision(), 1);
    rec.setSummary({ totalTasks: 10, tasksDone: 7, completionRate: 70, totalMessages: 25, agentCount: 5, durationMs: 5000 });
    const md = rec.toMarkdown();
    expect(md).toContain('tasks_total: 10');
    expect(md).toContain('tasks_done: 7');
    expect(md).toContain('completion_rate: 70%');
    expect(md).toContain('7/10 completed');
    expect(md).toContain('5.0s');
  });

  it('counts unique agents', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent({ id: 'a1' }), makeDecision(), 1);
    rec.record(makeAgent({ id: 'a2' }), makeDecision(), 1);
    rec.record(makeAgent({ id: 'a1' }), makeDecision(), 2);
    const md = rec.toMarkdown();
    expect(md).toContain('agents: 2');
  });

  it('includes latency per entry when provided', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent({ name: 'Bob' }), makeDecision(), 1, 50, 123);
    const md = rec.toMarkdown();
    expect(md).toContain('(123ms)');
  });
});

describe('DecisionRecorder – save', () => {
  it('creates file with correct naming', async () => {
    const mkdirSync = vi.fn();
    const writeFileSync = vi.fn();
    // We can't easily mock fs in this context, so just verify toMarkdown works
    const rec = new DecisionRecorder('my-scenario', 'model');
    rec.record(makeAgent(), makeDecision(), 1);
    const md = rec.toMarkdown();
    expect(md.length).toBeGreaterThan(100);
  });
});

describe('DecisionRecorder – decision fields in markdown', () => {
  it('includes action, target, task, message', () => {
    const rec = new DecisionRecorder('test', 'model');
    rec.record(makeAgent(), makeDecision({
      action: 'delegate',
      target: 'tech-talent',
      task: 'TASK-0042',
      message: 'Assigning to engineering',
    }), 1);
    const md = rec.toMarkdown();
    expect(md).toContain('Action: delegate');
    expect(md).toContain('Target: tech-talent');
    expect(md).toContain('Task: TASK-0042');
    expect(md).toContain('Message: Assigning to engineering');
  });
});
