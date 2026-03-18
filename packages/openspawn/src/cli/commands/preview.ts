// ── Preview Command ───────────────────────────────────────────────────────
// Launches the sandbox simulation + dashboard so users see their org in action.

import { execSync, spawn, exec } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";
import { parseConfig } from "../../core/config.js";
import type { OpenSpawnConfig } from "../../core/types.js";
import { LlmProvider } from "../../core/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

// ── Flags ─────────────────────────────────────────────────────────────────

export interface PreviewFlags {
  port: number;
  open: boolean;
  mode: string;
  scenario: string;
  verbose: boolean;
}

function parsePreviewFlags(args: string[]): PreviewFlags {
  const flags: PreviewFlags = {
    port: 3333,
    open: true,
    mode: "deterministic",
    scenario: "warm-up",
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--port":
        flags.port = Number(args[++i]);
        break;
      case "--no-open":
        flags.open = false;
        break;
      case "--mode":
        flags.mode = args[++i];
        break;
      case "--scenario":
        flags.scenario = args[++i];
        break;
      case "--verbose":
        flags.verbose = true;
        break;
    }
  }

  return flags;
}

// ── Pure helpers ──────────────────────────────────────────────────────────

export function findSandboxDir(): string | undefined {
  const candidates = [
    join(__dirname, "../../../../tools/sandbox"),
    join(__dirname, "../../../../../tools/sandbox"),
    join(__dirname, "../../../../../../tools/sandbox"),
  ];
  for (const c of candidates) {
    const resolved = resolve(c);
    if (existsSync(join(resolved, "package.json"))) return resolved;
  }
  return undefined;
}

export function findWorkspaceRoot(sandboxDir: string): string {
  // Workspace root is two levels up from tools/sandbox/
  return resolve(sandboxDir, "../..");
}

export function buildPreviewEnv(
  config: OpenSpawnConfig,
  flags: PreviewFlags,
): Record<string, string> {
  const env: Record<string, string> = {
    SANDBOX_PORT: String(flags.port),
    SERVE_DASHBOARD: "1",
    SIMULATION_MODE: flags.mode,
    SCENARIO: flags.scenario,
    CLEAN: "1",
    VERBOSE: flags.verbose ? "1" : "0",
  };

  // Map LLM provider
  switch (config.llm.provider) {
    case LlmProvider.Groq:
      env.LLM_PROVIDER = "groq";
      env.GROQ_MODEL = config.llm.models.default;
      break;
    case LlmProvider.OpenRouter:
      env.LLM_PROVIDER = "openrouter";
      env.OPENROUTER_MODEL = config.llm.models.default;
      break;
    case LlmProvider.Ollama:
      env.LLM_PROVIDER = "ollama";
      env.SANDBOX_MODEL = config.llm.models.default;
      break;
    case LlmProvider.Anthropic:
      env.LLM_PROVIDER = "anthropic";
      env.SANDBOX_MODEL = config.llm.models.default;
      break;
    case LlmProvider.OpenAI:
      env.LLM_PROVIDER = "openai";
      env.SANDBOX_MODEL = config.llm.models.default;
      break;
  }

  // Passthrough API keys from parent env
  const passthroughKeys = [
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
  ];
  for (const key of passthroughKeys) {
    if (process.env[key]) {
      env[key] = process.env[key];
    }
  }

  return env;
}

export function ensureDashboardBuild(workspaceRoot: string): void {
  const indexPath = join(workspaceRoot, "dist/apps/dashboard/index.html");
  if (existsSync(indexPath)) return;

  console.log("Building dashboard (first run)...");
  try {
    execSync("pnpm exec nx build dashboard", {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
  } catch {
    console.error("Error: Dashboard build failed. Fix build errors and retry.");
    process.exit(1);
  }
}

function openBrowser(url: string): void {
  const os = platform();
  const cmd = os === "darwin" ? "open" : os === "win32" ? "start" : "xdg-open";
  exec(`${cmd} ${url}`, () => {
    // Ignore errors — browser open is best-effort
  });
}

// ── Main handler ─────────────────────────────────────────────────────────

export async function previewCommand(
  args: string[],
  ctx: { dir: string; orgFile?: string },
): Promise<void> {
  const flags = parsePreviewFlags(args);
  const config = parseConfig(ctx.dir);

  // Resolve ORG.md
  const orgPath = resolve(ctx.dir, ctx.orgFile ?? config.orgFile);
  if (!existsSync(orgPath)) {
    console.error(`Error: ${orgPath} not found.`);
    console.error("Run 'openspawn init' first to scaffold your organization.");
    process.exit(1);
  }

  // Find sandbox
  const sandboxDir = findSandboxDir();
  if (!sandboxDir) {
    console.error("Error: Could not find tools/sandbox/. Are you in the OpenSpawn monorepo?");
    process.exit(1);
  }

  const workspaceRoot = findWorkspaceRoot(sandboxDir);

  // Build dashboard if needed
  ensureDashboardBuild(workspaceRoot);

  // Build env
  const previewEnv = buildPreviewEnv(config, flags);
  const env = { ...process.env, ...previewEnv };

  console.log("Starting OpenSpawn preview...");
  console.log(`  Org:       ${orgPath}`);
  console.log(`  Port:      ${flags.port}`);
  console.log(`  Mode:      ${flags.mode}`);
  console.log(`  Dashboard: http://localhost:${flags.port}/app`);

  // Spawn sandbox
  const proc = spawn("npx", ["tsx", join(sandboxDir, "src/index.ts"), "--org", orgPath], {
    stdio: "inherit",
    env,
    cwd: sandboxDir,
  });

  // Open browser after short delay to let server start
  if (flags.open) {
    setTimeout(() => {
      openBrowser(`http://localhost:${flags.port}/app`);
    }, 2000);
  }

  // Forward signals for graceful shutdown
  const forward = () => {
    proc.kill("SIGTERM");
  };
  process.on("SIGINT", forward);
  process.on("SIGTERM", forward);

  proc.on("error", (err) => {
    console.error(`Failed to start sandbox: ${err.message}`);
    process.exit(1);
  });

  proc.on("exit", (code) => process.exit(code ?? 0));
}
