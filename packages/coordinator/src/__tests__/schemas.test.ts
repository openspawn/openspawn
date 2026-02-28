/**
 * schemas.test.ts
 *
 * Tests for TaskResultSchema and parseTaskResult helper.
 *
 * Covers:
 *   - Valid structured results (each discriminated-union variant)
 *   - Invalid results (wrong type, missing required fields)
 *   - Backward-compat: plain string → freeform wrapper
 *   - JSON string that encodes a valid structured result
 *   - JSON string that encodes an invalid result → ZodError
 *   - Integration: completeTask stores the validated result in SQLite
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import { TaskResultSchema, parseTaskResult } from '../schemas.js';
import type { TaskResult } from '../schemas.js';
import { createDb, registerAgent, createTask, claimTask, completeTask, listTasks } from '../db.js';

// ─── TaskResultSchema — valid variants ────────────────────────────────────────

describe('TaskResultSchema — valid variants', () => {
  it('pr_merged with all fields', () => {
    const result = TaskResultSchema.parse({
      type: 'pr_merged',
      pr: 42,
      branch: 'feat/cool-thing',
      description: 'Merged the cool thing PR',
    });
    expect(result.type).toBe('pr_merged');
    if (result.type === 'pr_merged') {
      expect(result.pr).toBe(42);
      expect(result.branch).toBe('feat/cool-thing');
    }
  });

  it('pr_merged with only required fields', () => {
    const result = TaskResultSchema.parse({ type: 'pr_merged', pr: 7 });
    expect(result.type).toBe('pr_merged');
    if (result.type === 'pr_merged') {
      expect(result.pr).toBe(7);
      expect(result.branch).toBeUndefined();
    }
  });

  it('file_created', () => {
    const result = TaskResultSchema.parse({
      type: 'file_created',
      paths: ['src/foo.ts', 'src/bar.ts'],
      description: 'Added two files',
    });
    expect(result.type).toBe('file_created');
    if (result.type === 'file_created') {
      expect(result.paths).toHaveLength(2);
    }
  });

  it('docs_updated', () => {
    const result = TaskResultSchema.parse({
      type: 'docs_updated',
      files: ['README.md'],
    });
    expect(result.type).toBe('docs_updated');
    if (result.type === 'docs_updated') {
      expect(result.files).toContain('README.md');
    }
  });

  it('config_changed', () => {
    const result = TaskResultSchema.parse({
      type: 'config_changed',
      changes: ['Set LOG_LEVEL=debug', 'Added DB_URL'],
    });
    expect(result.type).toBe('config_changed');
    if (result.type === 'config_changed') {
      expect(result.changes).toHaveLength(2);
    }
  });

  it('research_complete with sources', () => {
    const result = TaskResultSchema.parse({
      type: 'research_complete',
      findings: 'React 19 is fast',
      sources: ['https://react.dev'],
    });
    expect(result.type).toBe('research_complete');
    if (result.type === 'research_complete') {
      expect(result.findings).toContain('React 19');
      expect(result.sources).toHaveLength(1);
    }
  });

  it('research_complete without sources', () => {
    const result = TaskResultSchema.parse({
      type: 'research_complete',
      findings: 'Nothing to report',
    });
    expect(result.type).toBe('research_complete');
  });

  it('error with recoverable flag', () => {
    const result = TaskResultSchema.parse({
      type: 'error',
      reason: 'Rate limit exceeded',
      recoverable: true,
    });
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.recoverable).toBe(true);
    }
  });

  it('error without recoverable (optional)', () => {
    const result = TaskResultSchema.parse({ type: 'error', reason: 'Boom' });
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.recoverable).toBeUndefined();
    }
  });

  it('escalation — all severity levels are accepted', () => {
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    for (const severity of severities) {
      const result = TaskResultSchema.parse({
        type: 'escalation',
        issue: `Severity ${severity} problem`,
        severity,
      });
      expect(result.type).toBe('escalation');
      if (result.type === 'escalation') {
        expect(result.severity).toBe(severity);
      }
    }
  });

  it('freeform', () => {
    const result = TaskResultSchema.parse({
      type: 'freeform',
      text: 'Did some stuff, hard to categorise',
    });
    expect(result.type).toBe('freeform');
    if (result.type === 'freeform') {
      expect(result.text).toContain('categorise');
    }
  });
});

// ─── TaskResultSchema — invalid inputs ────────────────────────────────────────

describe('TaskResultSchema — invalid inputs', () => {
  it('rejects an unknown type discriminant', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'unknown_type', value: 42 }),
    ).toThrow(ZodError);
  });

  it('rejects pr_merged with missing pr field', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'pr_merged', branch: 'main' }),
    ).toThrow(ZodError);
  });

  it('rejects pr_merged when pr is a string instead of number', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'pr_merged', pr: 'not-a-number' }),
    ).toThrow(ZodError);
  });

  it('rejects file_created with missing paths', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'file_created', description: 'oops' }),
    ).toThrow(ZodError);
  });

  it('rejects file_created when paths is not an array', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'file_created', paths: 'src/foo.ts' }),
    ).toThrow(ZodError);
  });

  it('rejects docs_updated with missing files', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'docs_updated' }),
    ).toThrow(ZodError);
  });

  it('rejects config_changed with missing changes', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'config_changed' }),
    ).toThrow(ZodError);
  });

  it('rejects research_complete with missing findings', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'research_complete' }),
    ).toThrow(ZodError);
  });

  it('rejects error with missing reason', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'error', recoverable: true }),
    ).toThrow(ZodError);
  });

  it('rejects escalation with invalid severity value', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'escalation', issue: 'Oops', severity: 'extreme' }),
    ).toThrow(ZodError);
  });

  it('rejects escalation with missing severity', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'escalation', issue: 'Something bad' }),
    ).toThrow(ZodError);
  });

  it('rejects freeform with missing text', () => {
    expect(() =>
      TaskResultSchema.parse({ type: 'freeform' }),
    ).toThrow(ZodError);
  });

  it('rejects null input', () => {
    expect(() => TaskResultSchema.parse(null)).toThrow(ZodError);
  });

  it('rejects completely empty object', () => {
    expect(() => TaskResultSchema.parse({})).toThrow(ZodError);
  });
});

// ─── parseTaskResult — string input (backward compat) ────────────────────────

describe('parseTaskResult — string inputs', () => {
  it('wraps a plain string as freeform (backward compat)', () => {
    const result = parseTaskResult('Done the thing');
    expect(result).toEqual({ type: 'freeform', text: 'Done the thing' });
  });

  it('wraps an empty string as freeform', () => {
    const result = parseTaskResult('');
    expect(result).toEqual({ type: 'freeform', text: '' });
  });

  it('parses a JSON-encoded structured result (string)', () => {
    const raw = JSON.stringify({ type: 'pr_merged', pr: 100 });
    const result = parseTaskResult(raw);
    expect(result.type).toBe('pr_merged');
    if (result.type === 'pr_merged') {
      expect(result.pr).toBe(100);
    }
  });

  it('throws ZodError for a JSON string with invalid structure', () => {
    const raw = JSON.stringify({ type: 'pr_merged', pr: 'not-a-number' });
    expect(() => parseTaskResult(raw)).toThrow(ZodError);
  });

  it('throws ZodError for JSON with an unknown type', () => {
    const raw = JSON.stringify({ type: 'made_up', foo: 'bar' });
    expect(() => parseTaskResult(raw)).toThrow(ZodError);
  });
});

// ─── parseTaskResult — object input ──────────────────────────────────────────

describe('parseTaskResult — object inputs', () => {
  it('validates a valid structured object directly', () => {
    const result = parseTaskResult({ type: 'file_created', paths: ['a.ts'] });
    expect(result.type).toBe('file_created');
  });

  it('throws ZodError for an invalid object', () => {
    expect(() =>
      parseTaskResult({ type: 'file_created' }), // missing paths
    ).toThrow(ZodError);
  });

  it('throws ZodError for an object with unknown type', () => {
    expect(() => parseTaskResult({ type: 'surprise', data: 1 })).toThrow(ZodError);
  });
});

// ─── Integration: completeTask stores result in SQLite ────────────────────────

describe('completeTask — result storage integration', () => {
  let db: ReturnType<typeof createDb>;

  beforeEach(() => {
    db = createDb(':memory:');
    registerAgent(db, { id: 'agent-1', name: 'Alice' });
  });

  it('stores a structured result when task is completed', () => {
    const taskId = createTask(db, { title: 'Ship it', created_by: 'agent-1' });
    claimTask(db, taskId, 'agent-1');

    const result: TaskResult = { type: 'pr_merged', pr: 99, branch: 'feat/ship' };
    completeTask(db, taskId, 'agent-1', result);

    const tasks = listTasks(db, { status: 'done' }) as any[];
    expect(tasks).toHaveLength(1);
    const stored = JSON.parse(tasks[0].result);
    expect(stored.type).toBe('pr_merged');
    expect(stored.pr).toBe(99);
    expect(stored.branch).toBe('feat/ship');
  });

  it('stores null result when no result is provided (backward compat)', () => {
    const taskId = createTask(db, { title: 'Silent task' });
    completeTask(db, taskId, 'agent-1');

    const tasks = listTasks(db, { status: 'done' }) as any[];
    expect(tasks).toHaveLength(1);
    expect(tasks[0].result).toBeNull();
  });

  it('stores a freeform result correctly', () => {
    const taskId = createTask(db, { title: 'Misc work' });
    const result: TaskResult = { type: 'freeform', text: 'Did some stuff' };
    completeTask(db, taskId, 'agent-1', result);

    const tasks = listTasks(db, { status: 'done' }) as any[];
    const stored = JSON.parse(tasks[0].result);
    expect(stored.type).toBe('freeform');
    expect(stored.text).toBe('Did some stuff');
  });

  it('sets completed_at timestamp when completing with a result', () => {
    const taskId = createTask(db, { title: 'Timed task' });
    completeTask(db, taskId, 'agent-1', { type: 'freeform', text: 'done' });

    const tasks = listTasks(db, { status: 'done' }) as any[];
    expect(tasks[0].completed_at).toBeTruthy();
  });
});
