// ── Start Command ──────────────────────────────────────────────────────────
// Detects uv and launches the Python openspawn-server coordinator.

import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

export function buildServerCommand(dir: string, apiDir: string): string[] {
  return ["uv", "run", "--directory", apiDir, "openspawn-server", "--project-dir", dir];
}

function findApiDir(): string | undefined {
  // Walk up from this file to find the monorepo apps/api
  const candidates = [
    join(__dirname, "../../../../apps/api"),
    join(__dirname, "../../../../../apps/api"),
    join(__dirname, "../../../../../../apps/api"),
  ];
  for (const c of candidates) {
    const resolved = resolve(c);
    if (existsSync(join(resolved, "pyproject.toml"))) return resolved;
  }
  return undefined;
}

function checkUv(): boolean {
  try {
    execSync("uv --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function startCommand(_args: string[], ctx: { dir: string }): Promise<void> {
  if (!checkUv()) {
    console.error("Error: uv is required to run the OpenSpawn coordinator.");
    console.error("Install: curl -LsSf https://astral.sh/uv/install.sh | sh");
    process.exit(1);
  }

  const apiDir = findApiDir();
  if (!apiDir) {
    console.error("Error: Could not find apps/api directory. Are you in the OpenSpawn monorepo?");
    process.exit(1);
  }

  const cmd = buildServerCommand(ctx.dir, apiDir);
  console.log("Starting OpenSpawn coordinator...");
  console.log(`Project: ${ctx.dir}`);
  console.log(`API: ${apiDir}`);

  const proc = spawn(cmd[0], cmd.slice(1), {
    stdio: "inherit",
    env: { ...process.env },
  });

  proc.on("error", (err) => {
    console.error(`Failed to start coordinator: ${err.message}`);
    process.exit(1);
  });

  proc.on("exit", (code) => process.exit(code ?? 0));
}
