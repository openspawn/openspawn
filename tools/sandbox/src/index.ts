#!/usr/bin/env node
// ── BikiniBottom Agent Sandbox ───────────────────────────────────────────────
// Runs AI agents in a simulated organization using local Ollama models
// Supports loading org structure from ORG.md or using hardcoded agents

import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAgents, createCOO } from './agents.js';
import { parseOrgMd, type ParsedOrg } from './org-parser.js';
import { initOllama } from './ollama.js';
import { Simulation } from './simulation.js';
import { startServer } from './server.js';
import { loadAgentConfig, buildSystemPrompt } from './config-loader.js';
import type { SandboxConfig } from './types.js';

const config: SandboxConfig = {
  model: process.env.SANDBOX_MODEL || 'qwen3:0.6b',
  tickIntervalMs: Number(process.env.TICK_INTERVAL) || 2000,
  maxTicks: Number(process.env.MAX_TICKS) || 0, // 0 = run forever
  maxConcurrentInferences: Number(process.env.MAX_CONCURRENT) || 4,
  contextWindowTokens: 2048,
  verbose: process.env.VERBOSE !== '0',
  defaultTrigger: (process.env.DEFAULT_TRIGGER as 'polling' | 'event-driven') || 'polling',
};

console.log(`
╔══════════════════════════════════════════╗
║  🌊 BikiniBottom Agent Sandbox 🌊       ║
╚══════════════════════════════════════════╝
`);

console.log(`Config:`);
console.log(`  Model: ${config.model}`);
console.log(`  Tick interval: ${config.tickIntervalMs}ms`);
console.log(`  Max ticks: ${config.maxTicks}`);
console.log(`  Max concurrent: ${config.maxConcurrentInferences}`);
console.log(`  Verbose: ${config.verbose}`);

// Init
initOllama(config);

// Determine org source
const cooOnly = process.env.COO_ONLY === '1' || process.argv.includes('--coo-only');
const cleanSlate = process.env.CLEAN === '1' || process.argv.includes('--clean');

// Theme / org file selection
const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = resolve(__dirname, '..', 'themes');
const themeArgIdx = process.argv.indexOf('--theme');
const themeName = themeArgIdx !== -1 && process.argv[themeArgIdx + 1]
  ? process.argv[themeArgIdx + 1]
  : process.env.SANDBOX_THEME || 'bikini-bottom'; // default theme

// Check for --org CLI arg, then theme, then default ORG.md
const orgArgIdx = process.argv.indexOf('--org');
const themePath = resolve(themesDir, `${themeName}.md`);
const defaultOrgPath = resolve(__dirname, '..', 'ORG.md');
const orgPath = orgArgIdx !== -1 && process.argv[orgArgIdx + 1]
  ? resolve(process.argv[orgArgIdx + 1])
  : existsSync(themePath) ? themePath
  : defaultOrgPath;

let parsedOrg: ParsedOrg | undefined;
let agents;

if (!cooOnly && !cleanSlate && existsSync(orgPath)) {
  try {
    parsedOrg = parseOrgMd(orgPath);
    agents = parsedOrg.agents;
    console.log(`\n📄 Loaded org from ORG.md (${agents.length} agents)`);
    console.log(`   Org: ${parsedOrg.name}`);
    if (parsedOrg.culture.preset) console.log(`   Culture: ${parsedOrg.culture.preset}`);
  } catch (err) {
    console.error(`⚠ Failed to parse ORG.md: ${err instanceof Error ? err.message : String(err)}`);
    console.log(`📦 Falling back to built-in agents`);
    agents = createAgents();
  }
} else if (cooOnly || cleanSlate) {
  agents = createCOO();
  console.log(`\n📦 Using COO-only mode`);
} else {
  agents = createAgents();
  console.log(`\n📦 Using built-in agents (${agents.length} agents)`);
}

// Load agent configs from org/agents/ directory if it exists
const orgDir = resolve(__dirname, '..', 'org');
const agentsConfigDir = join(orgDir, 'agents');
if (existsSync(agentsConfigDir)) {
  let customCount = 0;
  let defaultCount = 0;
  for (const agent of agents) {
    const agentConfigDir = join(agentsConfigDir, agent.id);
    const config = loadAgentConfig(agent.id, orgDir);
    if (config.soul || config.identity || config.agents) {
      const prompt = buildSystemPrompt(config);
      if (prompt) {
        // Config overrides the generated system prompt prefix but keeps the action instructions
        const actionIdx = agent.systemPrompt.indexOf('Respond with JSON ONLY.');
        const actionSuffix = actionIdx !== -1 ? agent.systemPrompt.slice(actionIdx) : '';
        agent.systemPrompt = prompt + '\n\n' + actionSuffix;
      }
      if (existsSync(agentConfigDir)) customCount++;
      else defaultCount++;
    }
  }
  console.log(`\n📂 Loaded agent configs from org/agents/ (${customCount} custom, ${defaultCount} defaults)`);
}

console.log(`\n🤖 ${agents.length} agents:`);
for (const a of agents) {
  const indent = '  '.repeat(Math.max(0, 3 - Math.floor(a.level / 3)));
  console.log(`${indent}L${a.level} ${a.name} (${a.id}) — ${a.domain}`);
}

// Run
const sim = new Simulation(agents, config, cleanSlate, parsedOrg);

// Start HTTP API server for dashboard integration
startServer(sim);

sim.run().catch(err => {
  console.error('💥 Simulation crashed:', err);
  process.exit(1);
});
