// ── Regenerate Command ──────────────────────────────────────────────────────
// Re-generates workspace SOUL.md files and openclaw-agents.json from ORG.md
// and openspawn.json without touching task state or custom workspace files.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseOrgMdContent } from "../../core/org-parser.js";
import { parseConfig } from "../../core/config.js";
import type { Agent, OpenSpawnConfig } from "../../core/types.js";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  level: number;
  reportsTo: string;
  workspace: string;
  model: string;
}

interface FileChange {
  path: string;
  status: "created" | "updated" | "unchanged";
  diff?: string;
}

export interface RegenerateResult {
  changes: FileChange[];
  agentCount: number;
}

// ── Helpers (mirrored from workspace-generator) ─────────────────────────────

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

function resolveParentName(agent: Agent, agentsById: Map<string, Agent>): string {
  if (!agent.parentId) return "";
  const parent = agentsById.get(agent.parentId);
  return parent ? parent.name : "";
}

function buildSoulMd(agent: Agent, config: OpenSpawnConfig, parentName: string): string {
  const lines: string[] = [
    `# SOUL.md — ${agent.name}`,
    "",
    "## Organizational Alignment",
    "",
    `- **Mission:** ${config.alignment.mission}`,
    `- **Vision:** ${config.alignment.vision}`,
    `- **Values:** ${config.alignment.values.join(", ")}`,
    "",
    "## Identity",
    "",
    `**Role:** ${agent.role}`,
    `**Domain:** ${agent.domain}`,
    `**Level:** ${agent.level}`,
  ];

  if (parentName) {
    lines.push(`**Reports to:** ${parentName}`);
  }

  lines.push(
    "",
    `You are ${agent.name}, a level ${agent.level} agent in the ${agent.domain} domain.`,
    "Be competent, direct, and focused on your area of expertise.",
    "",
  );

  return lines.join("\n");
}

function resolveModel(agent: Agent, config: OpenSpawnConfig): string {
  return agent.level >= config.llm.seniorThreshold
    ? config.llm.models.senior
    : config.llm.models.default;
}

// ── Flag parsing ────────────────────────────────────────────────────────────

function hasFlag(args: string[], ...names: string[]): boolean {
  return names.some((n) => args.includes(n));
}

// ── Core regeneration logic (pure, testable) ────────────────────────────────

export function regenerate(dir: string, dryRun: boolean): RegenerateResult {
  const orgPath = join(dir, "ORG.md");
  if (!existsSync(orgPath)) {
    throw new Error(
      "ORG.md not found in current directory. Run `openspawn init` first.",
    );
  }

  const configPath = join(dir, "openspawn.json");
  if (!existsSync(configPath)) {
    throw new Error(
      "openspawn.json not found in current directory. Run `openspawn init` first.",
    );
  }

  const orgContent = readFileSync(orgPath, "utf-8");
  const config = parseConfig(dir);
  const parsed = parseOrgMdContent(orgContent);
  const agents = parsed.agents;

  const agentsById = new Map<string, Agent>();
  for (const agent of agents) {
    agentsById.set(agent.id, agent);
  }

  const changes: FileChange[] = [];
  const agentConfigs: AgentConfig[] = [];

  // ── Regenerate per-agent SOUL.md ────────────────────────────────────────
  for (const agent of agents) {
    const dirName = sanitizeName(agent.name);
    const wsPath = join("workspaces", dirName);
    const fullWsPath = join(dir, wsPath);
    const soulPath = join(fullWsPath, "SOUL.md");

    const parentName = resolveParentName(agent, agentsById);
    const newContent = buildSoulMd(agent, config, parentName);

    let status: FileChange["status"];

    if (!existsSync(soulPath)) {
      status = "created";
      if (!dryRun) {
        mkdirSync(join(fullWsPath, "memory"), { recursive: true });
        writeFileSync(soulPath, newContent, "utf-8");
      }
    } else {
      const existing = readFileSync(soulPath, "utf-8");
      if (existing === newContent) {
        status = "unchanged";
      } else {
        status = "updated";
        if (!dryRun) {
          writeFileSync(soulPath, newContent, "utf-8");
        }
      }
    }

    changes.push({ path: join(wsPath, "SOUL.md"), status });

    agentConfigs.push({
      id: dirName,
      name: agent.name,
      role: agent.role,
      level: agent.level,
      reportsTo: parentName,
      workspace: wsPath,
      model: resolveModel(agent, config),
    });
  }

  // ── Regenerate openclaw-agents.json ─────────────────────────────────────
  const agentsJsonPath = join(dir, "openclaw-agents.json");
  const newAgentsJson = JSON.stringify(agentConfigs, null, 2) + "\n";

  let agentsJsonStatus: FileChange["status"];
  if (!existsSync(agentsJsonPath)) {
    agentsJsonStatus = "created";
    if (!dryRun) {
      writeFileSync(agentsJsonPath, newAgentsJson, "utf-8");
    }
  } else {
    const existing = readFileSync(agentsJsonPath, "utf-8");
    if (existing === newAgentsJson) {
      agentsJsonStatus = "unchanged";
    } else {
      agentsJsonStatus = "updated";
      if (!dryRun) {
        writeFileSync(agentsJsonPath, newAgentsJson, "utf-8");
      }
    }
  }
  changes.push({ path: "openclaw-agents.json", status: agentsJsonStatus });

  return { changes, agentCount: agents.length };
}

// ── CLI handler ─────────────────────────────────────────────────────────────

export async function regenerateCommand(args: string[], ctx: { dir: string }) {
  const dryRun = hasFlag(args, "--dry-run");

  const result = regenerate(ctx.dir, dryRun);

  if (dryRun) {
    console.log("\n🔍 Dry run — no files written\n");
  } else {
    console.log("\n♻️  Regenerated!\n");
  }

  const created = result.changes.filter((c) => c.status === "created");
  const updated = result.changes.filter((c) => c.status === "updated");
  const unchanged = result.changes.filter((c) => c.status === "unchanged");

  if (created.length > 0) {
    console.log("Created:");
    for (const c of created) {
      console.log(`  + ${c.path}`);
    }
  }

  if (updated.length > 0) {
    console.log("Updated:");
    for (const c of updated) {
      console.log(`  ~ ${c.path}`);
    }
  }

  if (unchanged.length > 0) {
    console.log("Unchanged:");
    for (const c of unchanged) {
      console.log(`  · ${c.path}`);
    }
  }

  console.log(`\nAgents: ${result.agentCount}`);
  console.log(`Files changed: ${created.length + updated.length}`);

  if (dryRun) {
    console.log("\nRun without --dry-run to apply changes.");
  }
}
