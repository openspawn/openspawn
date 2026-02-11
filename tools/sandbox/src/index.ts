#!/usr/bin/env node
// ── BikiniBottom Agent Sandbox ───────────────────────────────────────────────
// Runs AI agents in a simulated organization using local Ollama models
// Supports loading org structure from ORG.md or using hardcoded agents

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from sandbox directory (won't override existing env vars)
const __filename2 = fileURLToPath(import.meta.url);
const __sandboxRoot = resolve(dirname(__filename2), '..');
const envPath = join(__sandboxRoot, '.env');
if (existsSync(envPath)) {
  let envCount = 0;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) { process.env[key] = val; envCount++; }
  }
  if (envCount > 0) console.log(`  📋 Loaded ${envCount} vars from ${envPath}`);
} else {
  console.log(`  ⚠ No .env file found at ${envPath}`);
}
import { createAgents, createCOO } from './agents.js';
import { parseOrgMd, type ParsedOrg } from './org-parser.js';
import { initLLM, getProvider, getProviderInfo } from './llm.js';
import { Simulation } from './simulation.js';
import { DeterministicSimulation } from './deterministic.js';
import { startServer } from './server.js';
import { loadAgentConfig, buildSystemPrompt } from './config-loader.js';
import type { SandboxConfig } from './types.js';

const config: SandboxConfig = {
  model: process.env.SANDBOX_MODEL || 'qwen3:0.6b',
  tickIntervalMs: Number(process.env.TICK_INTERVAL) || (process.env.LLM_PROVIDER === 'ollama' ? 2000 : (process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY) ? 5000 : 2000),
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
await initLLM(config);

// Determine org source
const cofounderMode = process.env.COFOUNDER === '1' || process.argv.includes('--cofounder');
const cleanSlate = process.env.CLEAN === '1' || process.argv.includes('--clean') || cofounderMode;

// Check for --org CLI arg or default ORG.md location
const orgArgIdx = process.argv.indexOf('--org');
const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultOrgPath = resolve(__dirname, '..', 'ORG.md');
const orgPath = orgArgIdx !== -1 && process.argv[orgArgIdx + 1]
  ? resolve(process.argv[orgArgIdx + 1])
  : defaultOrgPath;

let parsedOrg: ParsedOrg | undefined;
let agents;

// Always load ORG.md if it exists — it defines who works here
if (existsSync(orgPath)) {
  try {
    parsedOrg = parseOrgMd(orgPath);

    if (cofounderMode) {
      // Cofounder mode: just the COO, but ORG.md is the "hiring plan"
      // Mr. Krabs starts alone and spawns from the roster as needed
      agents = parsedOrg.agents.filter(a => a.role === 'coo' || a.level >= 9);
      console.log(`\n🦀 Cofounder mode — Mr. Krabs starts alone`);
      console.log(`   ${parsedOrg.agents.length} candidates in the hiring plan (ORG.md)`);
    } else {
      agents = parsedOrg.agents;
    }

    console.log(`📄 Loaded org from ORG.md (${agents.length} active agents)`);
    console.log(`   Org: ${parsedOrg.name}`);
    if (parsedOrg.culture.preset) console.log(`   Culture: ${parsedOrg.culture.preset}`);
    if (cleanSlate) console.log(`   🧹 Clean slate — fresh tasks/events`);
  } catch (err) {
    console.error(`⚠ Failed to parse ORG.md: ${err instanceof Error ? err.message : String(err)}`);
    console.log(`📦 Falling back to built-in agents`);
    agents = createAgents();
  }
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

// Run — deterministic mode by default, LLM mode with SIMULATION_MODE=llm
const useLLM = process.env.SIMULATION_MODE === 'llm';
const sim = useLLM
  ? new Simulation(agents, config, cleanSlate, parsedOrg)
  : new DeterministicSimulation(agents, config, cleanSlate, parsedOrg);

if (!useLLM) {
  console.log(`\n🎯 Deterministic mode (set SIMULATION_MODE=llm for LLM-driven agents)`);
}

// Start HTTP API server for dashboard integration
startServer(sim as any);

// Auto-start scenario if SCENARIO env var is set
const scenarioId = process.env.SCENARIO;
if (scenarioId && !useLLM) {
  const { ScenarioEngine } = await import('./scenario-engine.js');
  const { SCENARIO_REGISTRY } = await import('./scenarios/index.js');

  const scenarioDef = SCENARIO_REGISTRY[scenarioId];
  if (scenarioDef) {
    const engine = new ScenarioEngine(scenarioDef);
    const detSim = sim as DeterministicSimulation;
    detSim.scenarioEngine = engine;
    engine.attach(detSim);
    console.log(`\n🎬 Auto-started scenario: ${scenarioDef.meta.name}`);
  } else {
    console.log(`\n⚠️ Unknown scenario: ${scenarioId}. Available: ${Object.keys(SCENARIO_REGISTRY).join(', ')}`);
  }
}

sim.run().catch(err => {
  console.error('💥 Simulation crashed:', err);
  process.exit(1);
});
