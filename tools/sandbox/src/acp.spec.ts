import { describe, it, expect, beforeEach } from 'vitest';
import { acpId, resetAcpCounter, createACPMessage, pushMessage } from './acp.js';
import type { SandboxAgent, ACPMessage } from './types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTestAgent(overrides: Partial<SandboxAgent> = {}): SandboxAgent {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    role: 'worker',
    level: 4,
    domain: 'Engineering',
    status: 'active',
    systemPrompt: '',
    taskIds: [],
    recentMessages: [],
    trigger: 'polling',
    inbox: [],
    stats: { tasksCompleted: 0, tasksFailed: 0, messagesSent: 0, creditsEarned: 0, creditsSpent: 0 },
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ACP – acpId', () => {
  beforeEach(() => resetAcpCounter());

  it('generates sequential IDs', () => {
    expect(acpId()).toBe('acp-1');
    expect(acpId()).toBe('acp-2');
    expect(acpId()).toBe('acp-3');
  });

  it('resets counter', () => {
    acpId();
    acpId();
    resetAcpCounter();
    expect(acpId()).toBe('acp-1');
  });
});

describe('ACP – createACPMessage', () => {
  beforeEach(() => resetAcpCounter());

  it('creates a message with all required fields', () => {
    const msg = createACPMessage('delegation', 'alice', 'bob', 'TASK-001');
    expect(msg.id).toBe('acp-1');
    expect(msg.type).toBe('delegation');
    expect(msg.from).toBe('alice');
    expect(msg.to).toBe('bob');
    expect(msg.taskId).toBe('TASK-001');
    expect(msg.timestamp).toBeTypeOf('number');
  });

  it('merges extra fields', () => {
    const msg = createACPMessage('progress', 'a', 'b', 'T1', { body: 'Working on it', pct: 50 });
    expect(msg.body).toBe('Working on it');
    expect(msg.pct).toBe(50);
  });

  it('extra fields override defaults', () => {
    const msg = createACPMessage('ack', 'a', 'b', 'T1', { id: 'custom-id' } as Partial<ACPMessage>);
    expect(msg.id).toBe('custom-id');
  });

  it('creates messages with all valid types', () => {
    const types: ACPMessage['type'][] = ['ack', 'progress', 'escalation', 'completion', 'delegation', 'status_request'];
    for (const t of types) {
      const msg = createACPMessage(t, 'a', 'b', 'T1');
      expect(msg.type).toBe(t);
    }
  });
});

describe('ACP – pushMessage', () => {
  beforeEach(() => resetAcpCounter());

  it('pushes message to sender and receiver recentMessages', () => {
    const alice = makeTestAgent({ id: 'alice', name: 'Alice' });
    const bob = makeTestAgent({ id: 'bob', name: 'Bob' });
    const charlie = makeTestAgent({ id: 'charlie', name: 'Charlie' });
    const agents = [alice, bob, charlie];

    const msg = createACPMessage('delegation', 'alice', 'bob', 'T1');
    pushMessage(agents, msg);

    expect(alice.recentMessages).toHaveLength(1);
    expect(bob.recentMessages).toHaveLength(1);
    expect(charlie.recentMessages).toHaveLength(0);
  });

  it('trims recentMessages to 10', () => {
    const alice = makeTestAgent({ id: 'alice' });
    const bob = makeTestAgent({ id: 'bob' });
    const agents = [alice, bob];

    for (let i = 0; i < 15; i++) {
      pushMessage(agents, createACPMessage('progress', 'alice', 'bob', `T${i}`));
    }

    expect(alice.recentMessages.length).toBeLessThanOrEqual(10);
    expect(bob.recentMessages.length).toBeLessThanOrEqual(10);
  });

  it('routes to event-driven agent inbox when type matches triggerOn', () => {
    const sender = makeTestAgent({ id: 'sender' });
    const receiver = makeTestAgent({
      id: 'receiver',
      trigger: 'event-driven',
      triggerOn: ['delegation', 'escalation'],
    });
    const agents = [sender, receiver];

    pushMessage(agents, createACPMessage('delegation', 'sender', 'receiver', 'T1'));
    expect(receiver.inbox).toHaveLength(1);

    pushMessage(agents, createACPMessage('progress', 'sender', 'receiver', 'T2'));
    expect(receiver.inbox).toHaveLength(1); // progress not in triggerOn
  });

  it('routes to event-driven agent inbox when triggerOn is undefined (accepts all)', () => {
    const sender = makeTestAgent({ id: 'sender' });
    const receiver = makeTestAgent({
      id: 'receiver',
      trigger: 'event-driven',
      triggerOn: undefined,
    });
    const agents = [sender, receiver];

    pushMessage(agents, createACPMessage('progress', 'sender', 'receiver', 'T1'));
    expect(receiver.inbox).toHaveLength(1);
  });

  it('does not route to polling agent inbox', () => {
    const sender = makeTestAgent({ id: 'sender' });
    const receiver = makeTestAgent({ id: 'receiver', trigger: 'polling' });
    const agents = [sender, receiver];

    pushMessage(agents, createACPMessage('delegation', 'sender', 'receiver', 'T1'));
    expect(receiver.inbox).toHaveLength(0);
    expect(receiver.recentMessages).toHaveLength(1);
  });

  it('does not route to inbox if agent is sender only', () => {
    const sender = makeTestAgent({ id: 'sender', trigger: 'event-driven' });
    const receiver = makeTestAgent({ id: 'receiver', trigger: 'event-driven' });
    const agents = [sender, receiver];

    pushMessage(agents, createACPMessage('delegation', 'sender', 'receiver', 'T1'));
    expect(sender.inbox).toHaveLength(0);
    expect(receiver.inbox).toHaveLength(1);
  });

  it('handles self-messages (from === to)', () => {
    const agent = makeTestAgent({ id: 'self', trigger: 'event-driven' });
    const agents = [agent];

    pushMessage(agents, createACPMessage('progress', 'self', 'self', 'T1'));
    expect(agent.recentMessages).toHaveLength(1); // only one copy
    expect(agent.inbox).toHaveLength(1);
  });
});
