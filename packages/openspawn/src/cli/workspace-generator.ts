// ── Workspace Generator ─────────────────────────────────────────────────────
// Generates per-agent workspace directories with SOUL.md, AGENTS.md, memory/,
// and an openclaw-agents.json config file at the project root.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Agent, OpenSpawnConfig } from "../core/types.js";
import { parseOrgMdContent } from "../core/org-parser.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  level: number;
  reportsTo: string;
  workspace: string;
  model: string;
}

export interface WorkspaceResult {
  agentCount: number;
  workspacePaths: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const AGENTS_MD_CONTENT = `# AGENTS.md - Agent Workspace

## Every Session

1. Read \`SOUL.md\` — this is who you are
2. Check \`memory/\` for recent context

## Memory

- **Daily notes:** \`memory/YYYY-MM-DD.md\` — raw logs of what happened
- Write down anything worth remembering. Files are your only continuity.

## Safety

- Don't run destructive commands without asking.
- When in doubt, ask.
`;

function resolveModel(agent: Agent, config: OpenSpawnConfig): string {
  return agent.level >= config.llm.seniorThreshold
    ? config.llm.models.senior
    : config.llm.models.default;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function generateWorkspaces(
  dir: string,
  orgContent: string,
  config: OpenSpawnConfig,
): WorkspaceResult {
  const parsed = parseOrgMdContent(orgContent);
  const agents = parsed.agents;

  const agentsById = new Map<string, Agent>();
  for (const agent of agents) {
    agentsById.set(agent.id, agent);
  }

  const workspacePaths: string[] = [];
  const agentConfigs: AgentConfig[] = [];

  for (const agent of agents) {
    const dirName = sanitizeName(agent.name);
    const wsPath = join("workspaces", dirName);
    const fullWsPath = join(dir, wsPath);

    // Create workspace + memory dirs
    mkdirSync(join(fullWsPath, "memory"), { recursive: true });

    // Write SOUL.md
    const parentName = resolveParentName(agent, agentsById);
    writeFileSync(join(fullWsPath, "SOUL.md"), buildSoulMd(agent, config, parentName), "utf-8");

    // Write AGENTS.md
    writeFileSync(join(fullWsPath, "AGENTS.md"), AGENTS_MD_CONTENT, "utf-8");

    workspacePaths.push(fullWsPath);

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

  // Write openclaw-agents.json
  writeFileSync(
    join(dir, "openclaw-agents.json"),
    JSON.stringify(agentConfigs, null, 2) + "\n",
    "utf-8",
  );

  return { agentCount: agents.length, workspacePaths };
}
