// ── Worktree Command ─────────────────────────────────────────────────────────
// CLI for managing git worktrees per agent.
//
// Usage:
//   openspawn worktree create <agent-id> --repo <org/repo> [--branch <name>] [--base <branch>]
//   openspawn worktree list
//   openspawn worktree remove <agent-id> --repo <org/repo>
//   openspawn worktree sync [--agent <id>]

import {
  createWorktree,
  listWorktrees,
  removeWorktree,
  syncWorktrees,
  validateAgentId,
  validateRepoString,
} from "../../core/worktree.js";

const WORKTREE_HELP = `
openspawn worktree - Git worktree management for multi-agent repos

Usage:
  openspawn worktree create <agent-id> --repo <org/repo> [--branch <name>] [--base <branch>]
  openspawn worktree list
  openspawn worktree remove <agent-id> --repo <org/repo>
  openspawn worktree sync [--agent <id>]

Commands:
  create    Create a worktree for an agent (branch defaults to <agent-id>-workspace)
  list      List all agent worktrees
  remove    Remove an agent's worktree
  sync      Fetch and rebase all (or one agent's) worktrees onto main

Examples:
  openspawn worktree create dennis --repo openspawn/openspawn
  openspawn worktree create ceo --repo openspawn/openspawn --branch ceo-feature-x
  openspawn worktree list
  openspawn worktree remove dennis --repo openspawn/openspawn
  openspawn worktree sync --agent dennis
`.trim();

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) {
    return args[idx + 1];
  }
  return undefined;
}

export async function worktreeCommand(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(WORKTREE_HELP);
    return;
  }

  const subcommand = args[0];
  const rest = args.slice(1);

  switch (subcommand) {
    case "create":
      return handleCreate(rest);
    case "list":
      return handleList();
    case "remove":
      return handleRemove(rest);
    case "sync":
      return handleSync(rest);
    default:
      console.error(`Unknown worktree subcommand: ${subcommand}`);
      console.log(WORKTREE_HELP);
      process.exit(1);
  }
}

function handleCreate(args: string[]): void {
  const agentId = args[0];
  if (!agentId || agentId.startsWith("--")) {
    console.error("Error: <agent-id> is required.");
    console.log("Usage: openspawn worktree create <agent-id> --repo <org/repo>");
    process.exit(1);
  }

  if (!validateAgentId(agentId)) {
    console.error(`Error: Invalid agent ID '${agentId}'. Use alphanumeric characters, hyphens, or underscores.`);
    process.exit(1);
  }

  const repoStr = parseFlag(args, "--repo");
  if (!repoStr) {
    console.error("Error: --repo <org/repo> is required.");
    process.exit(1);
  }

  const parsed = validateRepoString(repoStr);
  if (!parsed) {
    console.error(`Error: Invalid repo format '${repoStr}'. Expected 'org/repo'.`);
    process.exit(1);
  }

  const branch = parseFlag(args, "--branch");
  const baseBranch = parseFlag(args, "--base");

  try {
    const info = createWorktree({
      agentId,
      org: parsed.org,
      repo: parsed.repo,
      branch,
      baseBranch,
    });
    console.log(`✅ Created worktree for agent '${info.agentId}'`);
    console.log(`   Repo:   ${info.org}/${info.repo}`);
    console.log(`   Branch: ${info.branch}`);
    console.log(`   Path:   ${info.path}`);
    console.log(`   Hooks:  pre-push, pre-commit installed`);
  } catch (e) {
    console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

function handleList(): void {
  const worktrees = listWorktrees();

  if (worktrees.length === 0) {
    console.log("No agent worktrees found.");
    console.log("Create one: openspawn worktree create <agent-id> --repo <org/repo>");
    return;
  }

  console.log(`Found ${worktrees.length} worktree(s):\n`);

  const maxAgent = Math.max(...worktrees.map((w) => w.agentId.length), 5);
  const maxRepo = Math.max(...worktrees.map((w) => `${w.org}/${w.repo}`.length), 4);
  const maxBranch = Math.max(...worktrees.map((w) => w.branch.length), 6);

  const header = `${"AGENT".padEnd(maxAgent)}  ${"REPO".padEnd(maxRepo)}  ${"BRANCH".padEnd(maxBranch)}  PATH`;
  console.log(header);
  console.log("-".repeat(header.length + 20));

  for (const wt of worktrees) {
    const status = wt.exists ? "" : " ⚠️ missing";
    console.log(
      `${wt.agentId.padEnd(maxAgent)}  ${`${wt.org}/${wt.repo}`.padEnd(maxRepo)}  ${wt.branch.padEnd(maxBranch)}  ${wt.path}${status}`,
    );
  }
}

function handleRemove(args: string[]): void {
  const agentId = args[0];
  if (!agentId || agentId.startsWith("--")) {
    console.error("Error: <agent-id> is required.");
    console.log("Usage: openspawn worktree remove <agent-id> --repo <org/repo>");
    process.exit(1);
  }

  const repoStr = parseFlag(args, "--repo");
  if (!repoStr) {
    console.error("Error: --repo <org/repo> is required.");
    process.exit(1);
  }

  const parsed = validateRepoString(repoStr);
  if (!parsed) {
    console.error(`Error: Invalid repo format '${repoStr}'. Expected 'org/repo'.`);
    process.exit(1);
  }

  try {
    removeWorktree(agentId, parsed.org, parsed.repo);
    console.log(`✅ Removed worktree for agent '${agentId}' (${repoStr})`);
  } catch (e) {
    console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

function handleSync(args: string[]): void {
  const agentId = parseFlag(args, "--agent");

  console.log(agentId ? `Syncing worktrees for agent '${agentId}'...` : "Syncing all worktrees...");

  const result = syncWorktrees({ agentId });

  if (result.synced.length > 0) {
    console.log(`\n✅ Synced ${result.synced.length} worktree(s):`);
    for (const s of result.synced) {
      console.log(`   ${s}`);
    }
  }

  if (result.errors.length > 0) {
    console.log(`\n❌ ${result.errors.length} error(s):`);
    for (const e of result.errors) {
      console.log(`   ${e}`);
    }
  }

  if (result.synced.length === 0 && result.errors.length === 0) {
    console.log("No worktrees to sync.");
  }
}
