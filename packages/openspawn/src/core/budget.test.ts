import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setBudgetLimit, spend, getBudget, getAllBudgets } from './budget.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'openspawn-budget-'));
});

describe('budget', () => {
  it('sets and retrieves budget', () => {
    setBudgetLimit(dir, 'agent-1', 100);
    const b = getBudget(dir, 'agent-1');
    expect(b!.limit).toBe(100);
    expect(b!.spent).toBe(0);
  });

  it('records spend', () => {
    setBudgetLimit(dir, 'agent-1', 50);
    const r = spend(dir, 'agent-1', 10.5);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(39.5);
  });

  it('rejects overspend', () => {
    setBudgetLimit(dir, 'agent-1', 5);
    const r = spend(dir, 'agent-1', 10);
    expect(r.ok).toBe(false);
  });

  it('lists all budgets', () => {
    setBudgetLimit(dir, 'a', 10);
    setBudgetLimit(dir, 'b', 20);
    const all = getAllBudgets(dir);
    expect(Object.keys(all).length).toBe(2);
  });
});
