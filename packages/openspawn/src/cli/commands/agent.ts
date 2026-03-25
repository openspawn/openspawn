// ── Agent Command ────────────────────────────────────────────────────────────
// CLI for creating, listing, and inspecting agents.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  type AgentConfig,
  type Teammate,
  scaffoldAgent,
  registerWithA2A,
  listAgents,
  getAgent,
} from "../../core/agent-scaffold.js";

const AGENT_HELP = `
openspawn agent - Manage agents

Usage:
  openspawn agent create <name> [options]        Create a new agent workspace
  openspawn agent create-batch <config.json>     Batch create agents from config
  openspawn agent list                           List all created agents
  openspawn agent show <agent-id>                Show agent details

Create Options:
  --role <role>        Agent role (e.g. writer, developer, editor, pm)
  --level <1-10>       Agent level (default: 5)
  --skills <list>      Comma-separated skills
  --model <model>      Model to use (default: anthropic/claude-haiku-3-5)
  --workspace <path>   Custom workspace path
  --no-register        Skip A2A router registration
  --skill-dir <path>   Path to a2a-reporter skill source

Examples:
  openspawn agent create Writer --role writer --level 5 --skills "docs,markdown"
  openspawn agent create PM --role project-manager --level 7 --model "anthropic/claude-sonnet-4-5"
  openspawn agent create-batch agents.json
  openspawn agent list
  openspawn agent show writer
`.trim();

// ── Flag Helpers ────────────────────────────────────────────────────────────

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function getPositionalArgs(args: string[]): string[] {
  const result: string[] = [];
  const flagsWithValue = new Set([
    "--role",
    "--level",
    "--skills",
    "--model",
    "--workspace",
    "--skill-dir",
  ]);
  for (let i = 0; i < args.length; i++) {
    if (flagsWithValue.has(args[i])) {
      i++; // skip value
    } else if (!args[i].startsWith("--")) {
      result.push(args[i]);
    }
  }
  return result;
}

// ── Create Command ──────────────────────────────────────────────────────────

async function createCommand(args: string[]): Promise<void> {
  const positional = getPositionalArgs(args);
  const name = positional[0];

  if (!name) {
    console.error("Usage: openspawn agent create <name> --role <role>");
    process.exit(1);
  }

  const role = parseFlag(args, "--role");
  if (!role) {
    console.error("Error: --role is required");
    process.exit(1);
  }

  const config: AgentConfig = {
    name,
    role,
    level: parseInt(parseFlag(args, "--level") ?? "5", 10),
    skills: (parseFlag(args, "--skills") ?? "").split(",").filter(Boolean),
    model: parseFlag(args, "--model") ?? "anthropic/claude-haiku-3-5",
    workspace: parseFlag(args, "--workspace"),
  };

  const skillDir = parseFlag(args, "--skill-dir");
  const noRegister = hasFlag(args, "--no-register");

  console.log(`\n🤖 Creating agent: ${config.name}`);
  console.log(`   Role: ${config.role} | Level: ${config.level}`);
  console.log(`   Model: ${config.model}`);
  if (config.skills.length > 0) console.log(`   Skills: ${config.skills.join(", ")}`);

  const result = scaffoldAgent(config, [], skillDir ? { skillSourceDir: skillDir } : undefined);

  console.log(`\n✅ Workspace created: ${result.workspace}`);
  console.log(`   Agent ID: ${result.agentId}`);
  console.log(`   Files: ${result.filesCreated.length} created`);
  if (result.a2aSkillCopied) {
    console.log(`   A2A Reporter: ✅ installed`);
  } else {
    console.log(`   A2A Reporter: ⚠️  skill source not found (copy manually)`);
  }

  // Register with A2A router
  if (!noRegister) {
    console.log(`\n📡 Registering with A2A router...`);
    const reg = await registerWithA2A(result.agentId, config);
    if (reg.success) {
      console.log(`   ✅ Registered as "${result.agentId}"`);
    } else {
      console.log(`   ⚠️  Registration failed: ${reg.error}`);
      console.log(`   (You can register later with: openspawn a2a register)`);
    }
  }

  console.log(`\n📋 Next steps:`);
  console.log(`   1. Point an OpenClaw instance at: ${result.workspace}`);
  console.log(`   2. Start the agent and verify AGENTS.md is loaded`);
  console.log(`   3. Send a test task: openspawn a2a send ${result.agentId} "Hello!"`);
  console.log();
}

// ── Batch Create Command ────────────────────────────────────────────────────

interface BatchConfig {
  agents: Array<{
    name: string;
    role: string;
    level?: number;
    skills?: string[];
    model?: string;
    workspace?: string;
  }>;
}

async function batchCreateCommand(args: string[]): Promise<void> {
  const configPath = args[0];
  if (!configPath) {
    console.error("Usage: openspawn agent create-batch <config.json>");
    process.exit(1);
  }

  const fullPath = resolve(configPath);
  if (!existsSync(fullPath)) {
    console.error(`❌ Config file not found: ${fullPath}`);
    process.exit(1);
  }

  let batch: BatchConfig;
  try {
    batch = JSON.parse(readFileSync(fullPath, "utf-8")) as BatchConfig;
  } catch (err) {
    console.error(`❌ Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (!Array.isArray(batch.agents) || batch.agents.length === 0) {
    console.error("❌ Config must have a non-empty 'agents' array");
    process.exit(1);
  }

  const noRegister = hasFlag(args, "--no-register");
  const skillDir = parseFlag(args, "--skill-dir");

  // Build teammate list for cross-referencing
  const configs: AgentConfig[] = batch.agents.map((a) => ({
    name: a.name,
    role: a.role,
    level: a.level ?? 5,
    skills: a.skills ?? [],
    model: a.model ?? "anthropic/claude-haiku-3-5",
    workspace: a.workspace,
  }));

  console.log(`\n🚀 Batch creating ${configs.length} agents...\n`);

  for (const config of configs) {
    // Build teammates (everyone except self)
    const teammates: Teammate[] = configs
      .filter((c) => c.name !== config.name)
      .map((c) => ({
        name: c.name,
        level: c.level,
        role: c.role,
        skills: c.skills.join(", "),
      }));

    console.log(`🤖 ${config.name} (${config.role}, L${config.level})`);

    const result = scaffoldAgent(
      config,
      teammates,
      skillDir ? { skillSourceDir: skillDir } : undefined,
    );

    console.log(`   ✅ ${result.workspace}`);
    if (!result.a2aSkillCopied) {
      console.log(`   ⚠️  A2A Reporter skill not found`);
    }

    // Register with A2A router
    if (!noRegister) {
      const reg = await registerWithA2A(result.agentId, config);
      if (reg.success) {
        console.log(`   📡 Registered`);
      } else {
        console.log(`   ⚠️  Registration: ${reg.error}`);
      }
    }
  }

  console.log(`\n✅ ${configs.length} agents created!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Start OpenClaw instances for each agent`);
  console.log(`   2. Run: openspawn agent list`);
  console.log(`   3. Test: openspawn a2a send <agent-id> "Hello!"`);
  console.log();
}

// ── List Command ────────────────────────────────────────────────────────────

function listCommand(): void {
  const agents = listAgents();

  if (agents.length === 0) {
    console.log("\nNo agents found. Create one with: openspawn agent create <name> --role <role>\n");
    return;
  }

  console.log(`\n📋 Agents (${agents.length}):\n`);
  for (const a of agents) {
    console.log(`  🤖 ${a.name} (${a.agentId})`);
    console.log(`     Role: ${a.role} | Level: ${a.level} | Model: ${a.model}`);
    console.log(`     Skills: ${a.skills.join(", ") || "none"}`);
    console.log(`     Workspace: ${a.workspace}`);
    console.log();
  }
}

// ── Show Command ────────────────────────────────────────────────────────────

function showCommand(args: string[]): void {
  const agentId = args[0];
  if (!agentId) {
    console.error("Usage: openspawn agent show <agent-id>");
    process.exit(1);
  }

  const agent = getAgent(agentId);
  if (!agent) {
    console.error(`❌ Agent '${agentId}' not found`);
    console.error("   Run: openspawn agent list");
    process.exit(1);
  }

  console.log(`\n🤖 ${agent.name}\n`);
  console.log(`  Agent ID:  ${agent.agentId}`);
  console.log(`  Role:      ${agent.role}`);
  console.log(`  Level:     ${agent.level}`);
  console.log(`  Model:     ${agent.model}`);
  console.log(`  Skills:    ${agent.skills.join(", ") || "none"}`);
  console.log(`  Workspace: ${agent.workspace}`);
  console.log(`  Created:   ${agent.createdAt}`);
  console.log();
}

// ── Router ──────────────────────────────────────────────────────────────────

export async function agentCommand(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(AGENT_HELP);
    return;
  }

  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case "create":
      return createCommand(rest);
    case "create-batch":
      return batchCreateCommand(rest);
    case "list":
      return listCommand();
    case "show":
      return showCommand(rest);
    default:
      console.error(`Unknown agent subcommand: ${sub}`);
      console.log(AGENT_HELP);
      process.exit(1);
  }
}
