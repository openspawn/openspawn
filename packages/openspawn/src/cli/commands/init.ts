// ── Init Command ────────────────────────────────────────────────────────────
// Scaffolds a new OpenSpawn agent organization: ORG.md, config, workspaces,
// optional Docker infra, optional dry-run simulation.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type WizardAnswers,
  type InitFlags,
  runWizard,
  buildAnswersFromFlags,
  defaultAnswers,
} from "../wizard.js";
import { getTemplate, renderTemplate } from "../templates/index.js";
import { generateWorkspaces } from "../workspace-generator.js";
import { generateDockerInfra } from "../docker-generator.js";
import { simulateDryRun } from "../dry-run.js";
import { writeConfig } from "../../core/config.js";
import { type OpenSpawnConfig, BootstrapMode, RuntimeMode } from "../../core/types.js";
import { parseOrgMdContent } from "../../core/org-parser.js";
import type { Agent } from "../../core/types.js";

// ── Result type ─────────────────────────────────────────────────────────────

export interface ScaffoldResult {
  createdFiles: string[];
  agentCount: number;
  orgContent: string;
}

// ── Flag parsing ────────────────────────────────────────────────────────────

function extractFlag(args: string[], long: string, short?: string): string | undefined {
  const longIdx = args.indexOf(long);
  if (longIdx >= 0 && args[longIdx + 1]) return args[longIdx + 1];
  if (short) {
    const shortIdx = args.indexOf(short);
    if (shortIdx >= 0 && args[shortIdx + 1]) return args[shortIdx + 1];
  }
  return undefined;
}

function hasFlag(args: string[], ...names: string[]): boolean {
  return names.some((n) => args.includes(n));
}

// ── CLI handler ─────────────────────────────────────────────────────────────

export async function initCommand(args: string[], ctx: { dir: string }) {
  const nonInteractive = hasFlag(args, "--yes", "-y", "--non-interactive");
  const dryRun = hasFlag(args, "--dry-run");
  const deploy = hasFlag(args, "--deploy");

  const templateFlag = extractFlag(args, "--template", "-t");
  const portFlag = extractFlag(args, "--port", "-p");

  let answers: WizardAnswers;

  if (nonInteractive) {
    const flags: InitFlags = {};
    if (templateFlag !== undefined) flags.template = templateFlag;
    if (portFlag !== undefined) flags.port = Number(portFlag);
    if (deploy) flags.deploy = true;
    answers = buildAnswersFromFlags(flags);
  } else {
    answers = await runWizard();
  }

  // Override deploy/port from CLI flags even in interactive mode
  if (deploy) answers.deploy = true;
  if (portFlag !== undefined) answers.port = Number(portFlag);

  const result = scaffold(ctx.dir, answers);

  // ── Print results ───────────────────────────────────────────────────────
  const agentLabel = result.agentCount === 1 ? "1 agent" : `${result.agentCount} agents`;

  console.log("\n\u{1faa8} OpenSpawn initialized!\n");
  console.log("Created:");
  console.log("  ORG.md                  \u2014 Your agent organization");
  console.log("  openspawn.json          \u2014 Configuration");
  console.log("  .gitignore");
  console.log("  openclaw-agents.json    \u2014 Agent configs");
  console.log(`  workspaces/             \u2014 Agent workspaces (${agentLabel})`);
  console.log("  .openspawn/tasks.json   \u2014 Task store");

  if (answers.deploy) {
    console.log("  docker-compose.yml      \u2014 Docker infrastructure");
    console.log("  .env                    \u2014 Environment variables");
  }

  console.log("\nNext steps:");
  console.log("  1. Review ORG.md \u2014 your agent org chart");
  console.log("  2. Run: npx openspawn preview     \u2190 see your org in action");
  console.log("  3. Run: npx openspawn start       \u2190 start real coordinator");
  console.log("\nCustomize later:");
  console.log("  Alignment:  Edit \xA7 Identity in ORG.md");
  console.log("  Config:     Edit openspawn.json");
  console.log(`\nTemplate: ${answers.templateName}`);
  console.log(`Team: ${answers.orgName}`);

  // ── Agent tree ────────────────────────────────────────────────────────────
  if (result.agentCount > 0) {
    console.log("\nOrg tree:");
    printAgentTree(result.orgContent);
  }

  // ── Dry run ───────────────────────────────────────────────────────────────
  if (dryRun) {
    const sim = simulateDryRun(result.orgContent);
    console.log("\nDry-run simulation:");
    console.log(`  Agents:      ${sim.agentCount}`);
    console.log(`  Departments: ${sim.departments}`);
    console.log(`  Sample task: "${sim.sampleTask.title}" \u2192 ${sim.sampleTask.assignee}`);
    console.log(`  Delegation:  ${sim.delegationChain.join(" \u2192 ")}`);
  }
}

// ── Pure scaffold function ──────────────────────────────────────────────────

export function scaffold(dir: string, answers: WizardAnswers): ScaffoldResult {
  const createdFiles: string[] = [];

  // 1. ORG.md — skip if already exists
  const orgPath = join(dir, "ORG.md");
  let orgContent: string;

  if (existsSync(orgPath)) {
    console.log("ORG.md already exists, skipping");
    orgContent = readFileSync(orgPath, "utf-8");
  } else {
    const template = getTemplate(answers.templateName);
    if (!template) {
      throw new Error(`Unknown template: ${answers.templateName}`);
    }
    orgContent = renderTemplate(template, answers.orgName);

    // Inject alignment only when user customized it; otherwise keep template defaults
    if (answers.customizedAlignment) {
      orgContent = injectAlignment(orgContent, answers);
    }

    writeFileSync(orgPath, orgContent, "utf-8");
    createdFiles.push("ORG.md");
  }

  // 2. Config
  const config = buildConfig(answers);
  writeConfig(dir, config);
  createdFiles.push("openspawn.json");

  // 3. .gitignore
  const gitignorePath = join(dir, ".gitignore");
  writeFileSync(
    gitignorePath,
    ["node_modules", ".env", "data/", "*.db", ".openspawn/", ""].join("\n"),
    "utf-8",
  );
  createdFiles.push(".gitignore");

  // 4. .openspawn/tasks.json
  const dotDir = join(dir, ".openspawn");
  mkdirSync(dotDir, { recursive: true });
  writeFileSync(
    join(dotDir, "tasks.json"),
    JSON.stringify({ version: 1, tasks: [], budgets: {} }, null, 2) + "\n",
    "utf-8",
  );
  createdFiles.push(".openspawn/tasks.json");

  // 5. Workspaces
  const wsResult = generateWorkspaces(dir, orgContent, config);
  createdFiles.push("openclaw-agents.json");
  createdFiles.push("workspaces/");

  // 6. Docker (optional)
  if (answers.deploy) {
    generateDockerInfra(dir, answers.port);
    createdFiles.push("docker-compose.yml");
    createdFiles.push(".env");
  }

  return {
    createdFiles,
    agentCount: wsResult.agentCount,
    orgContent,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildConfig(answers: WizardAnswers): OpenSpawnConfig {
  return {
    orgFile: "ORG.md",
    coordinator: { port: answers.port },
    llm: {
      provider: answers.llmProvider,
      models: { default: answers.defaultModel, senior: answers.seniorModel },
      seniorThreshold: 7,
    },
    budget: {
      perAgentLimit: answers.budgetLimit,
      period: "weekly",
      alertThreshold: answers.alertThreshold,
      overageBehavior: answers.overageBehavior,
    },
    escalation: { behavior: answers.escalationBehavior },
    alignment: {
      mission: answers.mission,
      vision: answers.vision,
      values: answers.values,
    },
    culture: { preset: answers.culturePreset },
    spawning: {
      maxConcurrentAgents: 2,
      idleTimeoutSeconds: 300,
      bootstrapMode: BootstrapMode.Hybrid,
    },
    runtime: {
      mode: RuntimeMode.Local,
      database: ".openspawn/openspawn.db",
    },
  };
}

function injectAlignment(orgContent: string, answers: WizardAnswers): string {
  const alignmentBlock = [
    "",
    "## Identity",
    "",
    `- **Mission:** ${answers.mission}`,
    `- **Vision:** ${answers.vision}`,
    `- **Values:** ${answers.values.join(", ")}`,
    "",
  ].join("\n");

  // If ## Identity already exists, replace it
  const identityRegex = /## Identity[\s\S]*?(?=\n## |\n$)/;
  if (identityRegex.test(orgContent)) {
    return orgContent.replace(identityRegex, alignmentBlock.trim());
  }

  // Otherwise, inject after the H1 heading
  const h1Match = orgContent.match(/^# .+$/m);
  if (h1Match) {
    const insertPos = (h1Match.index ?? 0) + h1Match[0].length;
    return orgContent.slice(0, insertPos) + "\n" + alignmentBlock + orgContent.slice(insertPos);
  }

  // Fallback: prepend
  return alignmentBlock + "\n" + orgContent;
}

function printAgentTree(orgContent: string): void {
  const org = parseOrgMdContent(orgContent);
  if (!org.agents.length) return;

  console.log(org.name);

  const childrenOf = new Map<string | undefined, Agent[]>();
  for (const agent of org.agents) {
    const parent = agent.parentId;
    const siblings = childrenOf.get(parent);
    if (siblings) {
      siblings.push(agent);
    } else {
      childrenOf.set(parent, [agent]);
    }
  }

  const roots = childrenOf.get(undefined) ?? [];

  function printTree(agent: Agent, prefix: string, isLast: boolean) {
    const connector = isLast ? "\u2514\u2500\u2500 " : "\u251c\u2500\u2500 ";
    const roleLabel = agent.role !== "worker" ? agent.role : "";
    const parts = [agent.name];
    if (roleLabel) parts.push(`(${roleLabel}, L${agent.level})`);
    else parts.push(`(L${agent.level})`);
    console.log(`${prefix}${connector}${parts.join(" ")}`);

    const children = childrenOf.get(agent.id) ?? [];
    const nextPrefix = prefix + (isLast ? "    " : "\u2502   ");
    children.forEach((child, i) => {
      printTree(child, nextPrefix, i === children.length - 1);
    });
  }

  roots.forEach((root, i) => {
    printTree(root, "", i === roots.length - 1);
  });
}

export { defaultAnswers };
