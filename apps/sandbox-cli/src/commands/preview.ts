import { Command } from "commander";
import pc from "picocolors";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { icons } from "../lib/output.js";

interface Agent {
  name: string;
  level: number;
  domain: string;
  model: string;
  pool?: number;
  children: Agent[];
}

function parseOrgMd(content: string): { name: string; agents: Agent[] } {
  const lines = content.split("\n");
  let orgName = "My Organization";
  const rootAgents: Agent[] = [];
  const stack: { level: number; agent: Agent }[] = [];
  let inStructure = false;
  let currentAgent: Agent | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Org name from H1
    const h1 = trimmed.match(/^# (.+)/);
    if (h1 && !orgName) {
      orgName = h1[1];
      continue;
    }

    // Enter structure section
    if (trimmed === "## Structure") {
      inStructure = true;
      continue;
    }

    // Exit structure on next H2
    if (inStructure && trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      inStructure = false;
      continue;
    }

    if (!inStructure) continue;

    // Parse headings as agents
    const heading = trimmed.match(/^(#{3,6}) (.+)/);
    if (heading) {
      const depth = heading[1].length - 3; // 0-based
      const agent: Agent = {
        name: heading[2],
        level: 5,
        domain: "general",
        model: "default",
        children: [],
      };
      currentAgent = agent;

      // Find parent
      while (stack.length > 0 && stack[stack.length - 1].level >= depth) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].agent.children.push(agent);
      } else {
        rootAgents.push(agent);
      }

      stack.push({ level: depth, agent });
      continue;
    }

    // Parse metadata
    if (currentAgent && trimmed.startsWith("- **")) {
      const meta = trimmed.match(/\*\*(\w+):\*\*\s*(.+)/);
      if (meta) {
        const key = meta[1].toLowerCase();
        const val = meta[2].trim();
        if (key === "level") currentAgent.level = parseInt(val) || 5;
        if (key === "domain") currentAgent.domain = val;
        if (key === "model") currentAgent.model = val;
        if (key === "pool") currentAgent.pool = parseInt(val) || 1;
      }
    }
  }

  return { name: orgName, agents: rootAgents };
}

function levelColor(level: number): (s: string) => string {
  if (level >= 9) return pc.red;
  if (level >= 7) return pc.yellow;
  if (level >= 5) return pc.cyan;
  return pc.dim;
}

function levelLabel(level: number): string {
  const labels: Record<number, string> = {
    10: "CEO",
    9: "VP/Director",
    8: "Senior Lead",
    7: "Lead",
    6: "Senior",
    5: "Mid",
    4: "Junior",
    3: "Junior",
    2: "Intern",
    1: "Intern",
  };
  return labels[level] || `L${level}`;
}

function printTree(agents: Agent[], prefix = "", isLast = true, isRoot = true): void {
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const last = i === agents.length - 1;
    const connector = isRoot ? "" : last ? "└── " : "├── ";
    const childPrefix = isRoot ? "" : last ? "    " : "│   ";

    const color = levelColor(agent.level);
    const poolStr = agent.pool ? pc.dim(` ×${agent.pool}`) : "";
    const levelStr = pc.dim(`[L${agent.level} ${levelLabel(agent.level)}]`);
    const domainStr = pc.dim(`(${agent.domain})`);

    console.log(
      `${prefix}${connector}${color(pc.bold(agent.name))}${poolStr} ${levelStr} ${domainStr}`
    );

    if (agent.children.length > 0) {
      printTree(agent.children, prefix + childPrefix, last, false);
    }
  }
}

function countAgents(agents: Agent[]): number {
  let count = 0;
  for (const a of agents) {
    count += a.pool || 1;
    count += countAgents(a.children);
  }
  return count;
}

function countDomains(agents: Agent[], domains = new Set<string>()): Set<string> {
  for (const a of agents) {
    domains.add(a.domain);
    countDomains(a.children, domains);
  }
  return domains;
}

export function createPreviewCommand(): Command {
  const cmd = new Command("preview");

  cmd
    .description("Preview your organization structure from ORG.md")
    .argument("[path]", "Path to ORG.md or directory containing it", ".")
    .action(async (path: string) => {
      // Find ORG.md
      let orgPath = path;
      if (!orgPath.endsWith(".md")) {
        orgPath = join(path, "ORG.md");
      }

      if (!existsSync(orgPath)) {
        console.log(
          `\n${icons.error} ${pc.red("ORG.md not found")} at ${pc.dim(orgPath)}`
        );
        console.log(
          `\n  Run ${pc.cyan("openspawn init my-org")} to create one.\n`
        );
        process.exit(1);
      }

      const content = readFileSync(orgPath, "utf-8");
      const org = parseOrgMd(content);
      const totalAgents = countAgents(org.agents);
      const domains = countDomains(org.agents);
      const maxLevel = Math.max(
        ...org.agents.flatMap(function getLevel(a: Agent): number[] {
          return [a.level, ...a.children.flatMap(getLevel)];
        })
      );

      console.log("");
      console.log(
        `${icons.rocket} ${pc.bold(pc.white(org.name))}`
      );
      console.log(
        `  ${pc.dim(`${totalAgents} agents · ${domains.size} domains · max level L${maxLevel}`)}`
      );
      console.log("");
      console.log(pc.dim("  Organization Structure:"));
      console.log("");

      printTree(org.agents, "  ");

      console.log("");
      console.log(pc.dim("  ─────────────────────────────────────"));
      console.log(
        `  ${pc.dim("Agents:")} ${pc.bold(String(totalAgents))}  ${pc.dim("Domains:")} ${pc.bold(String(domains.size))}  ${pc.dim("Levels:")} L1-L${maxLevel}`
      );
      console.log("");
      console.log(
        `  ${pc.dim("Edit")} ${pc.cyan("ORG.md")} ${pc.dim("to customize your organization.")}`
      );
      console.log(
        `  ${pc.dim("Docs:")} ${pc.cyan("https://openspawn.ai/docs/reference/org-md-reference")}`
      );
      console.log("");
    });

  return cmd;
}
