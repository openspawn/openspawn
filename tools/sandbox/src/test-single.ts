// Quick test: what does Agent Dennis see and decide?
import { createAgents } from './agents.js';
import { buildContext, initOllama, getAgentDecision } from './ollama.js';
import type { SandboxTask, SandboxConfig } from './types.js';

const config: SandboxConfig = {
  model: 'qwen3:0.6b',
  tickIntervalMs: 0,
  maxTicks: 1,
  maxConcurrentInferences: 1,
  contextWindowTokens: 2048,
  verbose: true,
  defaultTrigger: 'polling',
};

initOllama(config);
const agents = createAgents();
const dennis = agents.find(a => a.id === 'dennis')!;

const tasks: SandboxTask[] = [
  { id: 'TASK-0001', title: 'Fix Safari login crash', description: '', priority: 'critical', status: 'backlog', creatorId: 'dennis', createdAt: Date.now(), updatedAt: Date.now(), activityLog: [], acked: false },
  { id: 'TASK-0002', title: 'Q1 financial report', description: '', priority: 'high', status: 'backlog', creatorId: 'dennis', createdAt: Date.now(), updatedAt: Date.now(), activityLog: [], acked: false },
  { id: 'TASK-0003', title: 'Launch blog post for v2.0', description: '', priority: 'high', status: 'backlog', creatorId: 'dennis', createdAt: Date.now(), updatedAt: Date.now(), activityLog: [], acked: false },
];

const context = buildContext(dennis, agents, tasks, []);
console.log('=== CONTEXT SENT TO MODEL ===');
console.log(context);
console.log('\n=== CALLING MODEL ===');

const action = await getAgentDecision(dennis, context, config);
console.log('\n=== PARSED ACTION ===');
console.log(JSON.stringify(action, null, 2));
