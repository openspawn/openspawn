// ── Budget Tracking ──────────────────────────────────────────────────────────

import { loadStore, saveStore } from './task-store.js';
import type { BudgetEntry } from './types.js';

export function getBudget(dir: string, agentId: string): BudgetEntry | null {
  const store = loadStore(dir);
  return store.budgets[agentId] ?? null;
}

export function setBudgetLimit(dir: string, agentId: string, limit: number, currency = 'USD'): BudgetEntry {
  const store = loadStore(dir);
  if (!store.budgets[agentId]) {
    store.budgets[agentId] = { limit, spent: 0, currency };
  } else {
    store.budgets[agentId].limit = limit;
    store.budgets[agentId].currency = currency;
  }
  saveStore(dir, store);
  return store.budgets[agentId];
}

export function spend(dir: string, agentId: string, amount: number, currency = 'USD'): { ok: boolean; remaining: number; entry: BudgetEntry } {
  const store = loadStore(dir);
  if (!store.budgets[agentId]) {
    store.budgets[agentId] = { limit: 0, spent: 0, currency };
  }
  const entry = store.budgets[agentId];
  const remaining = entry.limit - entry.spent;
  if (amount > remaining && entry.limit > 0) {
    return { ok: false, remaining, entry };
  }
  entry.spent = Math.round((entry.spent + amount) * 100) / 100;
  saveStore(dir, store);
  return { ok: true, remaining: Math.round((entry.limit - entry.spent) * 100) / 100, entry };
}

export function getAllBudgets(dir: string): Record<string, BudgetEntry> {
  return loadStore(dir).budgets;
}
