#!/usr/bin/env node
// ── OpenSpawn CLI ────────────────────────────────────────────────────────────

import { initCommand } from "./commands/init.js";
import { previewCommand } from "./commands/preview.js";
import { startCommand } from "./commands/start.js";

const HELP = `
openspawn - Multi-agent organization CLI

Usage: openspawn <command> [options]

Commands:
  init [directory]               Create agent organization
    -t, --template <name>        Template to use
    -y, --yes                    Skip wizard, use defaults
    --non-interactive            Same as --yes
    --dry-run                    Simulate after scaffold
    --deploy                     Generate Docker infra
    -p, --port <n>               Coordinator port (default: 8787)
  preview                        Preview org in local sandbox
    --port <n>                   Dashboard port (default: 3333)
    --no-open                    Don't auto-open browser
    --mode <mode>                Simulation: deterministic|hybrid|llm
    --scenario <id>              Override scenario
    --verbose                    Show agent decisions in terminal
  start                          Start local coordinator

Options:
  --org-file <path>              Path to ORG.md (default: ./ORG.md)
  --dir <path>                   Working directory (default: .)
  --help, -h                     Show help
  --version, -v                  Show version
`.trim();

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(HELP);
    process.exit(0);
  }

  if (args[0] === "--version" || args[0] === "-v") {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    console.log(pkg.version);
    process.exit(0);
  }

  const command = args[0];
  const rest = args.slice(1);

  // Extract global flags
  const dirIdx = rest.indexOf("--dir");
  let dir = process.cwd();
  if (dirIdx >= 0 && rest[dirIdx + 1]) {
    dir = rest[dirIdx + 1];
    rest.splice(dirIdx, 2);
  }

  const orgIdx = rest.indexOf("--org-file");
  let orgFile: string | undefined;
  if (orgIdx >= 0 && rest[orgIdx + 1]) {
    orgFile = rest[orgIdx + 1];
    rest.splice(orgIdx, 2);
  }

  const ctx = { dir, orgFile };

  switch (command) {
    case "init":
      return initCommand(rest, ctx);
    case "preview":
      return previewCommand(rest, ctx);
    case "start":
      return startCommand(rest, ctx);
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
