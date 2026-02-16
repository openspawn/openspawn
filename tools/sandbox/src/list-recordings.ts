#!/usr/bin/env node
// ── List Recorded Simulations ───────────────────────────────────────────────
// Shows all recorded simulation runs with their stats for comparison.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const recordedDir = resolve(__dirname, '..', 'scenarios', 'recorded');

if (!existsSync(recordedDir)) {
  console.log('No recordings found. Run a simulation with SIMULATION_MODE=hybrid to create one.');
  process.exit(0);
}

const files = readdirSync(recordedDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse(); // newest first

if (files.length === 0) {
  console.log('No recordings found. Run a simulation with SIMULATION_MODE=hybrid to create one.');
  process.exit(0);
}

console.log(`\n📼 Recorded Simulations (${files.length} total)\n`);
console.log('─'.repeat(100));
console.log(
  '#'.padEnd(4) +
  'Date'.padEnd(22) +
  'Model'.padEnd(28) +
  'Ticks'.padEnd(7) +
  'Decisions'.padEnd(11) +
  'Tasks'.padEnd(14) +
  'Rate'.padEnd(7) +
  'File'
);
console.log('─'.repeat(100));

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const content = readFileSync(join(recordedDir, file), 'utf8');

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const fm = fmMatch[1];
  const get = (key: string): string => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m?.[1]?.trim() ?? '';
  };

  const recorded = get('recorded');
  const model = get('model') || 'unknown';
  const ticks = get('ticks') || '?';
  const decisions = get('decisions') || '?';
  const tasksTotal = get('tasks_total');
  const tasksDone = get('tasks_done');
  const completionRate = get('completion_rate');
  const actions = get('actions');

  const date = recorded
    ? new Date(recorded).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' })
    : '?';

  const tasksStr = tasksTotal ? `${tasksDone}/${tasksTotal}` : '—';
  const rateStr = completionRate ? `${completionRate}%` : '—';

  console.log(
    `${String(i + 1).padEnd(4)}` +
    `${date.padEnd(22)}` +
    `${model.slice(0, 26).padEnd(28)}` +
    `${String(ticks).padEnd(7)}` +
    `${String(decisions).padEnd(11)}` +
    `${tasksStr.padEnd(14)}` +
    `${rateStr.padEnd(7)}` +
    file
  );

  // Show action distribution if available
  if (actions) {
    console.log(`     └─ ${actions}`);
  }
}

console.log('─'.repeat(100));
console.log(`\nTo replay a specific recording:`);
console.log(`  REPLAY_FILE=tools/sandbox/scenarios/recorded/<filename> pnpm sandbox:replay`);
console.log(`  # or with dashboard:`);
console.log(`  REPLAY_FILE=tools/sandbox/scenarios/recorded/<filename> pnpm dev:sandbox:replay`);
console.log('');
