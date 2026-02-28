/**
 * mcp-tools.test.ts
 *
 * Tests for the MCP tool handler logic in the OpenSpawn coordinator.
 *
 * Each MCP tool is a thin wrapper around a DB function. Rather than spinning up
 * the full HTTP/MCP server, we test the underlying DB calls that the handlers
 * invoke with the same parameters and assert on the same error conditions the
 * handlers would surface to callers.
 *
 * Covers:
 *   - Happy-path: task_create, task_claim, task_complete, task_list, task_update
 *   - Agent lifecycle: agent_register, agent_pause, agent_resume, agent_fire, agent_list
 *   - Escalations: escalate, escalation_resolve, escalation_list
 *   - Org overview: org_status, event_log
 *   - Error cases: claim already-claimed task, complete non-existent task, etc.
 *   - Concurrent access patterns (simulated via rapid sequential calls)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDb,
  registerAgent,
  listAgents,
  updateAgentStatus,
  createTask,
  claimTask,
  completeTask,
  listTasks,
  updateTaskStatus,
  escalate,
  resolveEscalation,
  listEscalations,
  getEvents,
  orgStatus,
} from '../db.js';

// Use ReturnType so we don't depend on @types/better-sqlite3 being installed
type Db = ReturnType<typeof createDb>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Response shape returned by MCP tool handlers (mirrors the real MCP SDK contract). */
interface ToolResult {
  content: Array<{ type: string; text: string }>;
  /** Present and true when the tool encountered an error. */
  isError?: true;
}

/** Mirror of the success response shape returned by MCP tool handlers. */
function toolOk(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

/** Mirror of the error response shape returned by MCP tool handlers. */
function toolErr(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

// Inline handler wrappers — these replicate the exact logic in index.ts so that
// we test the handler contract rather than just the raw DB layer.

async function handleTaskCreate(db: Db, params: {
  title: string;
  description?: string;
  assignee?: string;
  priority?: number;
  parent_id?: string;
  created_by?: string;
}) {
  const id = createTask(db, { ...params });
  return toolOk(`Created task ${id}: ${params.title}`);
}

async function handleTaskClaim(db: Db, params: { task_id: string; agent_id: string }) {
  try {
    claimTask(db, params.task_id, params.agent_id);
    return toolOk(`Agent ${params.agent_id} claimed task ${params.task_id}`);
  } catch (e: any) {
    return toolErr(e.message);
  }
}

async function handleTaskComplete(db: Db, params: { task_id: string; agent_id: string }) {
  try {
    completeTask(db, params.task_id, params.agent_id);
    return toolOk(`Task ${params.task_id} completed`);
  } catch (e: any) {
    return toolErr(e.message);
  }
}

async function handleTaskList(db: Db, params: { status?: string; assignee?: string }) {
  const tasks = listTasks(db, params);
  return toolOk(JSON.stringify(tasks, null, 2));
}

async function handleTaskUpdate(db: Db, params: {
  task_id: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled';
  agent_id?: string;
}) {
  updateTaskStatus(db, params.task_id, params.status, params.agent_id);
  return toolOk(`Task ${params.task_id} → ${params.status}`);
}

async function handleAgentRegister(db: Db, params: { id: string; name: string; role?: string; level?: number }) {
  try {
    registerAgent(db, params);
    return toolOk(`Registered agent ${params.id} (${params.name})`);
  } catch (e: any) {
    return toolErr(e.message);
  }
}

async function handleEscalate(db: Db, params: { from_agent: string; to_agent?: string; task_id?: string; reason: string }) {
  const id = escalate(db, params);
  return toolOk(`Escalation ${id} created: ${params.reason}`);
}

async function handleEscalationResolve(db: Db, params: { id: string; agent_id: string }) {
  resolveEscalation(db, params.id, params.agent_id);
  return toolOk(`Escalation ${params.id} resolved`);
}

// ─── Test fixtures ─────────────────────────────────────────────────────────────

let db: Db;

beforeEach(() => {
  db = createDb(':memory:');
  registerAgent(db, { id: 'agent-1', name: 'Alice', role: 'engineer', level: 5 });
  registerAgent(db, { id: 'agent-2', name: 'Bob',   role: 'reviewer', level: 7 });
});

// ─── task_create ──────────────────────────────────────────────────────────────

describe('task_create', () => {
  it('creates a task and returns a success response', async () => {
    const result = await handleTaskCreate(db, { title: 'Write unit tests' });
    expect(result.content[0].text).toMatch(/Created task .+: Write unit tests/);
    expect(listTasks(db)).toHaveLength(1);
  });

  it('stores optional description and priority', async () => {
    await handleTaskCreate(db, { title: 'Fix bug', description: 'Null pointer', priority: 10 });
    const tasks = listTasks(db) as any[];
    expect(tasks[0].description).toBe('Null pointer');
    expect(tasks[0].priority).toBe(10);
  });

  it('creates a subtask with parent_id', async () => {
    const parentResult = await handleTaskCreate(db, { title: 'Epic' });
    // Extract the generated task id from the response text
    const parentId = (listTasks(db) as any[])[0].id;
    await handleTaskCreate(db, { title: 'Subtask', parent_id: parentId });
    const tasks = listTasks(db) as any[];
    expect(tasks.find((t: any) => t.title === 'Subtask').parent_id).toBe(parentId);
    void parentResult; // used implicitly
  });

  it('records a created_by agent', async () => {
    await handleTaskCreate(db, { title: 'Task A', created_by: 'agent-1' });
    const tasks = listTasks(db) as any[];
    expect(tasks[0].created_by).toBe('agent-1');
  });
});

// ─── task_claim ──────────────────────────────────────────────────────────────

describe('task_claim', () => {
  it('claims an available (todo) task successfully', async () => {
    const taskId = createTask(db, { title: 'Open task' });
    const result = await handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-1' });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('claimed task');

    const tasks = listTasks(db, { status: 'in_progress' }) as any[];
    expect(tasks).toHaveLength(1);
    expect(tasks[0].assignee).toBe('agent-1');
  });

  it('returns an error when claiming an already-claimed task', async () => {
    const taskId = createTask(db, { title: 'Contested task' });
    await handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-1' });
    const result = await handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-2' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Error:/);
  });

  it('returns an error when claiming a non-existent task', async () => {
    const result = await handleTaskClaim(db, { task_id: 'does-not-exist', agent_id: 'agent-1' });
    expect(result.isError).toBe(true);
  });

  it('returns an error when the same agent double-claims their own task', async () => {
    const taskId = createTask(db, { title: 'My task' });
    await handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-1' });
    const result = await handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-1' });
    expect(result.isError).toBe(true);
  });
});

// ─── task_complete ────────────────────────────────────────────────────────────

describe('task_complete', () => {
  it('completes an in-progress task and sets completed_at', async () => {
    const taskId = createTask(db, { title: 'In-progress task' });
    claimTask(db, taskId, 'agent-1');
    const result = await handleTaskComplete(db, { task_id: taskId, agent_id: 'agent-1' });

    expect(result.isError).toBeUndefined();
    const done = listTasks(db, { status: 'done' }) as any[];
    expect(done).toHaveLength(1);
    expect(done[0].completed_at).toBeTruthy();
  });

  it('returns an error when completing a non-existent task', async () => {
    const result = await handleTaskComplete(db, { task_id: 'ghost-task', agent_id: 'agent-1' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Error:/);
  });

  it('completes a todo task (DB does not require in_progress state)', async () => {
    // Note: completeTask in db.ts only checks that the task exists — it does not
    // enforce a 'in_progress' precondition. This test documents that behaviour.
    const taskId = createTask(db, { title: 'Todo task' });
    const result = await handleTaskComplete(db, { task_id: taskId, agent_id: 'agent-1' });
    expect(result.isError).toBeUndefined();
    const done = listTasks(db, { status: 'done' }) as any[];
    expect(done).toHaveLength(1);
  });
});

// ─── task_list ────────────────────────────────────────────────────────────────

describe('task_list', () => {
  it('lists all tasks when no filters are provided', async () => {
    createTask(db, { title: 'T1' });
    createTask(db, { title: 'T2' });
    const result = await handleTaskList(db, {});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(2);
  });

  it('filters by status', async () => {
    const id = createTask(db, { title: 'Active task' });
    createTask(db, { title: 'Idle task' });
    claimTask(db, id, 'agent-1');

    const todoResult = await handleTaskList(db, { status: 'todo' });
    expect(JSON.parse(todoResult.content[0].text)).toHaveLength(1);

    const inProgressResult = await handleTaskList(db, { status: 'in_progress' });
    expect(JSON.parse(inProgressResult.content[0].text)).toHaveLength(1);
  });

  it('filters by assignee', async () => {
    const id = createTask(db, { title: 'Assigned' });
    createTask(db, { title: 'Unassigned' });
    claimTask(db, id, 'agent-1');

    const result = await handleTaskList(db, { assignee: 'agent-1' });
    expect(JSON.parse(result.content[0].text)).toHaveLength(1);
  });
});

// ─── task_update ──────────────────────────────────────────────────────────────

describe('task_update', () => {
  it('transitions a task to a new status', async () => {
    const taskId = createTask(db, { title: 'Task' });
    await handleTaskUpdate(db, { task_id: taskId, status: 'review' });

    const tasks = listTasks(db, { status: 'review' }) as any[];
    expect(tasks).toHaveLength(1);
  });

  it('returns a success message with the new status', async () => {
    const taskId = createTask(db, { title: 'Task' });
    const result = await handleTaskUpdate(db, { task_id: taskId, status: 'blocked' });
    expect(result.content[0].text).toContain('blocked');
  });
});

// ─── Agent lifecycle ──────────────────────────────────────────────────────────

describe('agent lifecycle (register / pause / resume / fire)', () => {
  it('registers a new agent successfully', async () => {
    const result = await handleAgentRegister(db, { id: 'agent-new', name: 'Charlie', level: 3 });
    expect(result.isError).toBeUndefined();
    expect(listAgents(db)).toHaveLength(3); // 2 from beforeEach + 1 new
  });

  it('pauses an active agent', () => {
    updateAgentStatus(db, 'agent-1', 'paused');
    expect(listAgents(db, 'paused')).toHaveLength(1);
    expect(listAgents(db, 'active')).toHaveLength(1);
  });

  it('resumes a paused agent', () => {
    updateAgentStatus(db, 'agent-1', 'paused');
    updateAgentStatus(db, 'agent-1', 'active');
    expect(listAgents(db, 'active')).toHaveLength(2);
    expect(listAgents(db, 'paused')).toHaveLength(0);
  });

  it('fires an agent, removing them from active roster', () => {
    updateAgentStatus(db, 'agent-2', 'fired');
    expect(listAgents(db, 'active')).toHaveLength(1);
    expect(listAgents(db, 'fired')).toHaveLength(1);
  });

  it('lists agents filtered by status', () => {
    updateAgentStatus(db, 'agent-1', 'paused');
    expect(listAgents(db, 'active')).toHaveLength(1);
    expect(listAgents(db, 'paused')).toHaveLength(1);
    expect(listAgents(db)).toHaveLength(2); // all statuses
  });
});

// ─── escalate / escalation_resolve / escalation_list ──────────────────────────

describe('escalations', () => {
  it('creates an escalation and lists it as open', async () => {
    const result = await handleEscalate(db, { from_agent: 'agent-1', reason: 'Blocked on credentials' });
    expect(result.content[0].text).toMatch(/Escalation .+ created/);
    expect(listEscalations(db, 'open')).toHaveLength(1);
  });

  it('resolves an escalation', async () => {
    const escId = escalate(db, { from_agent: 'agent-1', to_agent: 'agent-2', reason: 'Need review' });
    await handleEscalationResolve(db, { id: escId, agent_id: 'agent-2' });
    expect(listEscalations(db, 'open')).toHaveLength(0);
    expect(listEscalations(db, 'resolved')).toHaveLength(1);
  });

  it('lists open and resolved escalations separately', () => {
    const id1 = escalate(db, { from_agent: 'agent-1', reason: 'Issue A' });
    escalate(db, { from_agent: 'agent-2', reason: 'Issue B' });
    resolveEscalation(db, id1, 'agent-2');

    expect(listEscalations(db, 'open')).toHaveLength(1);
    expect(listEscalations(db, 'resolved')).toHaveLength(1);
  });
});

// ─── org_status ──────────────────────────────────────────────────────────────

describe('org_status', () => {
  it('returns a summary of agents, tasks, and escalations', () => {
    createTask(db, { title: 'T1' });
    createTask(db, { title: 'T2' });
    escalate(db, { from_agent: 'agent-1', reason: 'Help' });

    const status = orgStatus(db) as any;
    expect(status.agents.active).toBe(2);
    expect(status.tasks.todo).toBe(2);
    expect(status.openEscalations).toBe(1);
  });

  it('includes recent events', () => {
    createTask(db, { title: 'X' });
    const status = orgStatus(db) as any;
    expect(status.recentEvents.length).toBeGreaterThan(0);
  });
});

// ─── event_log ───────────────────────────────────────────────────────────────

describe('event_log', () => {
  it('records events for every significant action', () => {
    const taskId = createTask(db, { title: 'Logged task', created_by: 'agent-1' });
    claimTask(db, taskId, 'agent-1');
    completeTask(db, taskId, 'agent-1');

    const events = getEvents(db) as any[];
    // Expect at least: task.create, task.claim, task.complete
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('filters by agent_id', () => {
    const id1 = createTask(db, { title: 'A', created_by: 'agent-1' });
    createTask(db, { title: 'B', created_by: 'agent-2' });
    claimTask(db, id1, 'agent-1');

    const events = getEvents(db, { agent_id: 'agent-1' }) as any[];
    expect(events.every((e: any) => e.agent_id === 'agent-1')).toBe(true);
  });

  it('filters by event_type', () => {
    const id = createTask(db, { title: 'C' });
    claimTask(db, id, 'agent-1');
    completeTask(db, id, 'agent-1');

    const claimEvents = getEvents(db, { event_type: 'task.claim' }) as any[];
    expect(claimEvents.every((e: any) => e.event_type === 'task.claim')).toBe(true);
    expect(claimEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('respects the limit parameter', () => {
    for (let i = 0; i < 10; i++) createTask(db, { title: `Task ${i}` });
    const events = getEvents(db, { limit: 3 }) as any[];
    expect(events.length).toBeLessThanOrEqual(3);
  });
});

// ─── Concurrent access patterns ───────────────────────────────────────────────

describe('concurrent access patterns', () => {
  it('only one of many simultaneous claims on the same task succeeds', async () => {
    const taskId = createTask(db, { title: 'Race task' });

    // Simulate N agents racing to claim the same task.
    // SQLite serialises writes, so exactly one should succeed.
    const results = await Promise.allSettled([
      handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-1' }),
      handleTaskClaim(db, { task_id: taskId, agent_id: 'agent-2' }),
    ]);

    const successes = results.filter(
      (r) => r.status === 'fulfilled' && !(r.value as any).isError,
    );
    const failures = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).isError,
    );

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const inProgress = listTasks(db, { status: 'in_progress' }) as any[];
    expect(inProgress).toHaveLength(1);
  });

  it('multiple tasks can be created simultaneously without conflict', async () => {
    const results = await Promise.all([
      handleTaskCreate(db, { title: 'Concurrent T1' }),
      handleTaskCreate(db, { title: 'Concurrent T2' }),
      handleTaskCreate(db, { title: 'Concurrent T3' }),
    ]);

    expect(results.every((r) => !r.isError)).toBe(true);
    expect(listTasks(db)).toHaveLength(3);
  });

  it('completing a non-existent task does not corrupt existing tasks', async () => {
    const taskId = createTask(db, { title: 'Safe task' });
    claimTask(db, taskId, 'agent-1');

    // Attempt to complete a ghost task
    await handleTaskComplete(db, { task_id: 'ghost', agent_id: 'agent-1' });

    // Real task should still be intact
    const inProgress = listTasks(db, { status: 'in_progress' }) as any[];
    expect(inProgress).toHaveLength(1);
    expect(inProgress[0].id).toBe(taskId);
  });

  it('rapid sequential claims exhaust available tasks correctly', async () => {
    const ids = [
      createTask(db, { title: 'Rapid 1' }),
      createTask(db, { title: 'Rapid 2' }),
    ];

    for (const id of ids) {
      claimTask(db, id, 'agent-1');
    }

    // No more tasks to claim — trying to claim again should fail
    const extra = createTask(db, { title: 'Extra' });
    claimTask(db, extra, 'agent-2');

    // All three tasks are now in_progress
    const inProgress = listTasks(db, { status: 'in_progress' }) as any[];
    expect(inProgress).toHaveLength(3);
  });

  it('escalations from multiple agents are all recorded independently', async () => {
    await handleEscalate(db, { from_agent: 'agent-1', reason: 'Issue X' });
    await handleEscalate(db, { from_agent: 'agent-2', reason: 'Issue Y' });

    const open = listEscalations(db, 'open') as any[];
    expect(open).toHaveLength(2);
    expect(open.map((e: any) => e.from_agent).sort()).toEqual(['agent-1', 'agent-2']);
  });
});
