#!/usr/bin/env npx tsx
/**
 * Converts a recorded LLM simulation markdown into dashboard replay-data format.
 * Usage: npx tsx tools/sandbox/scripts/convert-recording-to-replay.ts [input.md] [output.ts]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2] || 'tools/sandbox/scenarios/recorded/2026-02-17T01-17-49-llm-simulation.md';
const output = process.argv[3] || 'apps/dashboard/src/components/live/replay-data-llm.ts';
const content = readFileSync(input, 'utf8');

const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
const fm = fmMatch?.[1] || '';
const getFm = (key: string): string => {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m?.[1]?.trim() ?? '';
};

const totalTicks = parseInt(getFm('ticks')) || 48;
const totalDecisions = parseInt(getFm('decisions')) || 387;
const tasksDone = parseInt(getFm('tasks_done')) || 53;
const tasksTotal = parseInt(getFm('tasks_total')) || 191;
const model = getFm('model');

const AGENT_MAP: Record<string, string> = {
  'Mr. Krabs': 'mr-krabs', 'SpongeBob SquarePants': 'spongebob-squarepants',
  'SpongeBob': 'spongebob-squarepants', 'Squidward Tentacles': 'squidward-tentacles',
  'Sandy Cheeks': 'sandy-cheeks', 'Karen': 'karen', 'Pearl Krabs': 'pearl-krabs',
  'Perch Perkins': 'perch-perkins', 'Barnacle Boy': 'barnacle-boy',
  'Squilliam Fancyson': 'squilliam-fancyson', 'Patrick Star': 'patrick-star',
  'Gary': 'gary', 'Plankton': 'plankton', 'Plankton Jr.': 'plankton-jr',
  'Plankton Jr': 'plankton-jr', 'Mermaid Man': 'mermaid-man',
  'Larry the Lobster': 'larry-the-lobster', 'Bubble Bass': 'bubble-bass',
  'Dennis': 'dennis', 'Flying Dutchman': 'flying-dutchman',
  'Mrs. Puff': 'mrs-puff', 'Fred': 'fred-1',
};

function resolveId(name: string): string {
  return AGENT_MAP[name] || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function resolveTarget(target: string): string {
  for (const [key, val] of Object.entries(AGENT_MAP)) {
    if (key.toLowerCase() === target.toLowerCase() || key.toLowerCase().startsWith(target.toLowerCase())) return val;
  }
  return target.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface Decision { tick: number; agentName: string; action: string; target: string; task: string; message: string; }
const decisions: Decision[] = [];
const re = /^## Tick (\d+) — (.+?) \(\w+, L\d+\) \(\d+ms\)\n- Action: (.+)\n- Target: (.+)\n- Task: (.+)\n- Message: (.+)/gm;
let m;
while ((m = re.exec(content)) !== null) {
  decisions.push({ tick: parseInt(m[1]), agentName: m[2], action: m[3].trim(), target: m[4].trim(), task: m[5].trim(), message: m[6].trim().replace(/^"|"$/g, '') });
}
console.log(`Parsed ${decisions.length} decisions`);

const SCALE = 2.5;
const MAX_TICK = Math.ceil(totalTicks * SCALE);

interface Ev { tick: number; type: string; data: Record<string, any>; }
const events: Ev[] = [];
const seen = new Set<string>();

const acts = [
  { num: 1, name: 'Act I: Order Received', narrative: 'Mr. Krabs receives the 10K patty order and begins delegation.' },
  { num: 2, name: 'Act II: Organization', narrative: 'Leads assigned. The org structure takes shape.' },
  { num: 3, name: 'Act III: Full Production', narrative: 'All 9 agents working. Tasks flow through the hierarchy.' },
  { num: 4, name: 'Act IV: Crunch Time', narrative: 'Delegation intensifies. 387 decisions, 191 tasks created.' },
  { num: 5, name: 'Act V: Results', narrative: `${tasksDone}/${tasksTotal} tasks completed. LLM coordination at scale.` },
];

[0, 5, 15, 30, 40].forEach((b, i) => events.push({ tick: Math.round(b * SCALE), type: 'act_change', data: { act: i } }));

for (const d of decisions) {
  const t = Math.max(1, Math.round(d.tick * SCALE));
  const from = resolveId(d.agentName);
  if (!seen.has(from)) { seen.add(from); events.push({ tick: t, type: 'node_status', data: { agent: from, status: 'working' } }); }
  if (d.action === 'delegate') {
    events.push({ tick: t, type: 'delegation', data: { from, to: resolveTarget(d.target), text: `📋 ${d.agentName} → ${d.target}: ${d.message.slice(0, 120)}` } });
  } else if (d.action === 'work') {
    events.push({ tick: t, type: 'message', data: { from, text: `🔨 ${d.message.slice(0, 120)}` } });
  } else if (d.action === 'idle') {
    events.push({ tick: t, type: 'message', data: { from, text: `💤 ${d.message.slice(0, 120)}` } });
  }
}

for (let t = 0; t <= MAX_TICK; t += 8) {
  const p = t / MAX_TICK;
  events.push({ tick: t, type: 'stat_update', data: { stats: { kitchenRate: Math.floor(p * 20), queueSize: Math.max(0, Math.floor(p * tasksTotal) - Math.floor(p * tasksDone)), deliveryRate: Math.floor(p * 12), revenue: Math.floor(p * 50000), margin: +(3.5 + p * 0.5).toFixed(1), budgetUsed: Math.floor(p * 95), pattiesProduced: Math.floor(p * tasksTotal), pattiesDelivered: Math.floor(p * tasksDone) } } });
}
events.push({ tick: MAX_TICK - 2, type: 'stat_update', data: { stats: { kitchenRate: 0, deliveryRate: 0, queueSize: 0, pattiesProduced: tasksTotal, pattiesDelivered: tasksDone, revenue: 50000, margin: 3.8, budgetUsed: 96 } } });
events.push({ tick: MAX_TICK - 1, type: 'completion', data: { from: 'mr-krabs', text: `🎉 LLM Simulation complete! ${tasksDone}/${tasksTotal} tasks. ${totalDecisions} decisions by ${model}.` } });
for (const id of seen) events.push({ tick: MAX_TICK, type: 'node_status', data: { agent: id, status: 'idle' } });

events.sort((a, b) => a.tick - b.tick || a.type.localeCompare(b.type));
const filtered: Ev[] = [];
const cap = new Map<number, number>();
for (const e of events) {
  if (e.type === 'message' || e.type === 'delegation') { const c = cap.get(e.tick) || 0; if (c >= 3) continue; cap.set(e.tick, c + 1); }
  filtered.push(e);
}
console.log(`Generated ${filtered.length} events across ${MAX_TICK} ticks`);

writeFileSync(output, `// Auto-generated LLM Recording Replay Data
// Source: ${input} | Model: ${model}
// ${totalDecisions} decisions, ${totalTicks} ticks, ${tasksDone}/${tasksTotal} tasks

import type { ReplayEvent } from './replay-data';

export const LLM_ACTS = ${JSON.stringify(acts, null, 2)} as const;

export const LLM_METADATA = {
  model: ${JSON.stringify(model)},
  recorded: ${JSON.stringify(getFm('recorded'))},
  ticks: ${totalTicks}, decisions: ${totalDecisions}, agents: ${seen.size},
  tasksDone: ${tasksDone}, tasksTotal: ${tasksTotal},
  completionRate: '${getFm('completion_rate')}',
  avgLatencyMs: ${parseInt(getFm('avg_latency_ms')) || 357},
};

export const LLM_MAX_TICK = ${MAX_TICK};
export const LLM_TARGET = ${tasksTotal};
export const LLM_DELIVERED = ${tasksDone};

export const LLM_TIMELINE: ReplayEvent[] = ${JSON.stringify(filtered, null, 2)};
`);
console.log(`Written to ${output}`);
