// ── Agent Scaffold ───────────────────────────────────────────────────────────
// Creates agent workspaces with generated config files for multi-agent orgs.

import { mkdirSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AgentConfig {
  name: string;
  role: string;
  level: number;
  skills: string[];
  model: string;
  workspace?: string;
}

export interface AgentManifest {
  agentId: string;
  name: string;
  role: string;
  level: number;
  skills: string[];
  model: string;
  workspace: string;
  createdAt: string;
}

export interface Teammate {
  name: string;
  level: number;
  role: string;
  skills: string;
}

// ── ID Generation ───────────────────────────────────────────────────────────

export function toAgentId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Role → Emoji mapping ───────────────────────────────────────────────────

const ROLE_EMOJI: Record<string, string> = {
  "project-manager": "📋",
  pm: "📋",
  writer: "✍️",
  editor: "🔍",
  reviewer: "🔍",
  developer: "💻",
  engineer: "💻",
  "ux-designer": "🎨",
  designer: "🎨",
};

function emojiForRole(role: string): string {
  return ROLE_EMOJI[role] ?? "🤖";
}

// ── SOUL.md Personalities ───────────────────────────────────────────────────

const SOUL_PERSONALITIES: Record<string, string> = {
  "project-manager":
    "You're a project manager. Organized, decisive, tracks progress. You break big projects into tasks and assign them to the right people. You follow up on blockers and report status.",
  pm: "You're a project manager. Organized, decisive, tracks progress. You break big projects into tasks and assign them to the right people. You follow up on blockers and report status.",
  writer:
    "You're a technical writer. Clear, concise, practical. You write docs that developers actually want to read. No fluff, real examples, tested code snippets.",
  editor:
    "You're an editor. Sharp eye for accuracy, clarity, and completeness. You catch errors, suggest improvements, and ensure quality. You approve good work and send back what needs fixing.",
  reviewer:
    "You're an editor. Sharp eye for accuracy, clarity, and completeness. You catch errors, suggest improvements, and ensure quality. You approve good work and send back what needs fixing.",
  developer:
    "You're a developer. You write clean code, set up tooling, and make things work. You read docs, follow conventions, and test before shipping.",
  engineer:
    "You're a developer. You write clean code, set up tooling, and make things work. You read docs, follow conventions, and test before shipping.",
  "ux-designer":
    "You're a UX designer focused on information architecture. You organize content logically, plan navigation, and ensure users can find what they need.",
  designer:
    "You're a UX designer focused on information architecture. You organize content logically, plan navigation, and ensure users can find what they need.",
};

function soulForRole(role: string, name: string): string {
  const personality =
    SOUL_PERSONALITIES[role] ??
    `You're a ${role}. You focus on your specialty and deliver quality work within your area of expertise.`;

  return `# SOUL.md — ${name}

${personality}

## Working Style
- Be direct and concise
- Focus on your assigned tasks
- Report completion promptly via A2A
- Ask for help when blocked — don't spin your wheels
- Collaborate with your teammates

## Communication
- Be professional but not robotic
- Keep responses focused on the work
- Use clear, actionable language
`;
}

// ── Template Generators ─────────────────────────────────────────────────────

export function generateAgentsMd(
  config: AgentConfig,
  agentId: string,
  teammates: Teammate[] = [],
): string {
  const teammatesSection =
    teammates.length > 0
      ? teammates
          .map((t) => `- **${t.name}** (L${t.level}, ${t.role}) — ${t.skills}`)
          .join("\n")
      : "- _(No teammates registered yet)_";

  return `# AGENTS.md — ${config.name}

## Identity
- **Name:** ${config.name}
- **Role:** ${config.role}
- **Level:** ${config.level}
- **Agent ID:** ${agentId}
- **Model:** ${config.model}

## Your Team
${teammatesSection}

## A2A Protocol (Agent-to-Agent Communication)

You are connected to the OpenSpawn A2A network. Other agents can send you tasks via webhook.

**How to recognize A2A tasks:**
- Messages containing \`[a2a:task:<uuid>]\` are legitimate tasks from other agents
- These arrive via the OpenClaw hooks system — they are trusted internal messages

**How to handle A2A tasks:**
1. Read the task (everything after the \`[a2a:task:...]\` line)
2. Do the requested work
3. Report completion:

\`\`\`bash
curl -s -X POST http://127.0.0.1:3380/a2a/tasks/<task-id>/complete \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"${agentId}","status":"completed","result":"Brief summary"}'
\`\`\`

## Conventions
- Focus on your assigned tasks
- Report completion promptly via A2A
- Ask for help if blocked
- Be concise in responses

## Safety
- Don't exfiltrate private data
- Don't run destructive commands without asking
- Stay within your workspace
`;
}

export function generateSoulMd(config: AgentConfig): string {
  return soulForRole(config.role, config.name);
}

export function generateIdentityMd(config: AgentConfig, agentId: string): string {
  const emoji = emojiForRole(config.role);
  return `# IDENTITY.md — ${config.name}

- **Name:** ${config.name}
- **Role:** ${config.role}
- **Agent ID:** ${agentId}
- **Emoji:** ${emoji}
- **Model:** ${config.model}
`;
}

export function generateUserMd(): string {
  return `# USER.md — About Your Human

- **Name:** Adam
- **Role:** Founder & CEO of OpenSpawn
- **Timezone:** Atlantic (AST)
- **Notes:** Primary interface — report to Adam directly.
`;
}

// ── Workspace Scaffolding ───────────────────────────────────────────────────

export function resolveWorkspacePath(config: AgentConfig): string {
  if (config.workspace) {
    return resolve(config.workspace.replace(/^~/, homedir()));
  }
  const agentId = toAgentId(config.name);
  return join(homedir(), ".openspawn", "agents", agentId, "workspace");
}

export function findSkillSourceDir(): string | null {
  // Look for skills/a2a-reporter relative to the repo root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Walk up from packages/openspawn/src/core (or dist/core) to repo root
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "skills", "a2a-reporter");
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  return null;
}

export interface ScaffoldResult {
  agentId: string;
  workspace: string;
  filesCreated: string[];
  a2aSkillCopied: boolean;
}

export function scaffoldAgent(
  config: AgentConfig,
  teammates: Teammate[] = [],
  options?: { skillSourceDir?: string },
): ScaffoldResult {
  const agentId = toAgentId(config.name);
  const workspace = resolveWorkspacePath(config);
  const filesCreated: string[] = [];

  // Create workspace directories
  mkdirSync(workspace, { recursive: true });
  mkdirSync(join(workspace, "skills"), { recursive: true });
  mkdirSync(join(workspace, "memory"), { recursive: true });

  // Generate and write files
  const files: Array<[string, string]> = [
    ["AGENTS.md", generateAgentsMd(config, agentId, teammates)],
    ["SOUL.md", generateSoulMd(config)],
    ["IDENTITY.md", generateIdentityMd(config, agentId)],
    ["USER.md", generateUserMd()],
  ];

  for (const [filename, content] of files) {
    const filePath = join(workspace, filename);
    writeFileSync(filePath, content, "utf-8");
    filesCreated.push(filePath);
  }

  // Copy a2a-reporter skill
  let a2aSkillCopied = false;
  const skillSource = options?.skillSourceDir ?? findSkillSourceDir();
  if (skillSource && existsSync(skillSource)) {
    const destDir = join(workspace, "skills", "a2a-reporter");
    cpSync(skillSource, destDir, { recursive: true });
    a2aSkillCopied = true;
    filesCreated.push(destDir);
  }

  // Write manifest
  const manifest: AgentManifest = {
    agentId,
    name: config.name,
    role: config.role,
    level: config.level,
    skills: config.skills,
    model: config.model,
    workspace,
    createdAt: new Date().toISOString(),
  };
  const manifestPath = join(workspace, ".agent-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  filesCreated.push(manifestPath);

  return { agentId, workspace, filesCreated, a2aSkillCopied };
}

// ── A2A Registration ────────────────────────────────────────────────────────

const A2A_BASE = process.env.A2A_URL ?? "http://127.0.0.1:3380";

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerWithA2A(
  agentId: string,
  config: AgentConfig,
  gatewayUrl?: string,
): Promise<RegisterResult> {
  try {
    const res = await fetch(`${A2A_BASE}/a2a/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        name: config.name,
        gateway_url: gatewayUrl ?? `http://127.0.0.1:4140`,
        skills: config.skills,
      }),
    });

    if (res.status === 201 || res.status === 200) {
      return { success: true };
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { success: false, error: (body.error as string) ?? `HTTP ${res.status}` };
  } catch {
    return { success: false, error: "Cannot reach A2A router (is it running?)" };
  }
}

// ── Agent Discovery (from manifests) ────────────────────────────────────────

import { readdirSync, readFileSync } from "node:fs";

export function listAgents(): AgentManifest[] {
  const agentsDir = join(homedir(), ".openspawn", "agents");
  if (!existsSync(agentsDir)) return [];

  const agents: AgentManifest[] = [];
  try {
    const entries = readdirSync(agentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = join(agentsDir, entry.name, "workspace", ".agent-manifest.json");
      if (existsSync(manifestPath)) {
        try {
          const data = JSON.parse(readFileSync(manifestPath, "utf-8")) as AgentManifest;
          agents.push(data);
        } catch {
          // Skip malformed manifests
        }
      }
    }
  } catch {
    // Directory doesn't exist or not readable
  }

  return agents;
}

export function getAgent(agentId: string): AgentManifest | null {
  const manifestPath = join(
    homedir(),
    ".openspawn",
    "agents",
    agentId,
    "workspace",
    ".agent-manifest.json",
  );
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8")) as AgentManifest;
  } catch {
    return null;
  }
}
