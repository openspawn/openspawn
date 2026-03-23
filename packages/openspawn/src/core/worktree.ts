// ── Git Worktree Management ──────────────────────────────────────────────────
// Core logic for creating, listing, removing, and syncing git worktrees
// for multi-agent repos. Designed to be testable with injectable exec.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import type { WorktreeInfo } from "./types.js";

// ── Constants ────────────────────────────────────────────────────────────────

const OPENSPAWN_DIR = join(homedir(), ".openspawn");
const AGENTS_DIR = join(OPENSPAWN_DIR, "agents");

const PROTECTED_BRANCHES = ["main", "master", "develop", "release"];

// ── Path helpers ─────────────────────────────────────────────────────────────

/**
 * Get the standard worktree path for an agent's repo checkout.
 * Convention: ~/.openspawn/agents/<agent-id>/repos/<org>/<repo>
 */
export function getWorktreePath(agentId: string, org: string, repo: string): string {
  return join(AGENTS_DIR, agentId, "repos", org, repo);
}

/**
 * Get the default branch name for an agent's worktree.
 * Convention: <agent-id>-workspace
 */
export function getDefaultBranch(agentId: string): string {
  return `${agentId}-workspace`;
}

/**
 * Validate an agent ID (alphanumeric, hyphens, underscores).
 */
export function validateAgentId(agentId: string): boolean {
  return /^[a-z0-9][a-z0-9_-]*$/i.test(agentId);
}

/**
 * Validate a repo string in org/repo format.
 */
export function validateRepoString(repoStr: string): { org: string; repo: string } | null {
  const parts = repoStr.split("/");
  if (parts.length !== 2) return null;
  const [org, repo] = parts;
  if (!org || !repo) return null;
  if (!/^[a-z0-9_.-]+$/i.test(org) || !/^[a-z0-9_.-]+$/i.test(repo)) return null;
  return { org, repo };
}

/**
 * Check if a branch name is protected.
 */
export function isProtectedBranch(branch: string): boolean {
  return PROTECTED_BRANCHES.includes(branch.toLowerCase());
}

// ── Git command helpers ──────────────────────────────────────────────────────

export type ExecFn = (cmd: string, opts?: { cwd?: string }) => string;

const defaultExec: ExecFn = (cmd, opts) => {
  return execSync(cmd, { encoding: "utf-8", cwd: opts?.cwd, stdio: "pipe" }).trim();
};

/**
 * Find the root of a git repo given an org/repo, trying common locations.
 */
export function findRepoRoot(org: string, repo: string, exec: ExecFn = defaultExec): string | null {
  // Try common locations
  const candidates = [
    join(homedir(), "github", org, repo),
    join(homedir(), "repos", org, repo),
    join(homedir(), "projects", org, repo),
    join(homedir(), org, repo),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, ".git"))) {
      return candidate;
    }
  }

  // Try `gh repo view` to get the clone path
  try {
    const result = exec(`gh repo view ${org}/${repo} --json url -q .url`);
    if (result) {
      // Check if it's cloned locally
      for (const candidate of candidates) {
        if (existsSync(candidate)) return candidate;
      }
    }
  } catch {
    // gh not available or repo not found
  }

  return null;
}

// ── Pre-push hook ────────────────────────────────────────────────────────────

/**
 * Generate the content for a pre-push hook that prevents dangerous operations.
 */
export function generatePrePushHook(agentId: string): string {
  const dollar = "$";
  return [
    "#!/bin/sh",
    `# OpenSpawn safety hook for agent: ${agentId}`,
    "# Prevents force-push, pushes to protected branches, and git init",
    "",
    'PROTECTED_BRANCHES="main master develop release"',
    "",
    "# Read push details from stdin",
    "while read local_ref local_sha remote_ref remote_sha; do",
    `  remote_branch="${dollar}(echo "${dollar}remote_ref" | sed 's|refs/heads/||')"`,
    "",
    "  # Block pushes to protected branches",
    `  for protected in ${dollar}PROTECTED_BRANCHES; do`,
    `    if [ "${dollar}remote_branch" = "${dollar}protected" ]; then`,
    `      echo "❌ BLOCKED: Agent '${agentId}' cannot push directly to '${dollar}protected'."`,
    `      echo "   Create a PR instead: gh pr create --base ${dollar}protected"`,
    "      exit 1",
    "    fi",
    "  done",
    "done",
    "",
    "exit 0",
    "",
  ].join("\n");
}

/**
 * Generate the content for a pre-commit hook that prevents git init.
 */
export function generatePreCommitHook(agentId: string): string {
  return `#!/bin/sh
# OpenSpawn safety hook for agent: ${agentId}
# Prevents accidental git init in worktree subdirectories

# Check if any staged files contain git init commands
if git diff --cached --name-only | xargs grep -l "git init" 2>/dev/null; then
  echo "⚠️  WARNING: Staged files contain 'git init' commands."
  echo "   Agent '${agentId}' should not run git init in worktrees."
fi

exit 0
`;
}

/**
 * Install safety hooks in a worktree directory.
 */
export function installHooks(worktreePath: string, agentId: string): void {
  const hooksDir = join(worktreePath, ".git", "hooks");
  if (!existsSync(hooksDir)) {
    // In worktrees, .git is a file pointing to the main repo's .git dir
    // Hooks should be installed in the main repo's hooks dir or worktree-specific
    const gitFile = join(worktreePath, ".git");
    if (existsSync(gitFile)) {
      // For worktrees, create a hooks dir in the worktree
      mkdirSync(hooksDir, { recursive: true });
    } else {
      return; // Not a git repo/worktree
    }
  }

  const prePushPath = join(hooksDir, "pre-push");
  writeFileSync(prePushPath, generatePrePushHook(agentId), { mode: 0o755 });
  
  const preCommitPath = join(hooksDir, "pre-commit");
  writeFileSync(preCommitPath, generatePreCommitHook(agentId), { mode: 0o755 });
}

// ── Core operations ──────────────────────────────────────────────────────────

export interface CreateWorktreeOptions {
  agentId: string;
  org: string;
  repo: string;
  branch?: string;
  baseBranch?: string;
  exec?: ExecFn;
}

/**
 * Create a worktree for an agent.
 */
export function createWorktree(opts: CreateWorktreeOptions): WorktreeInfo {
  const exec = opts.exec ?? defaultExec;
  const { agentId, org, repo } = opts;
  const branch = opts.branch ?? getDefaultBranch(agentId);
  const baseBranch = opts.baseBranch ?? "main";

  if (!validateAgentId(agentId)) {
    throw new Error(`Invalid agent ID: '${agentId}'. Use alphanumeric characters, hyphens, or underscores.`);
  }

  if (isProtectedBranch(branch)) {
    throw new Error(`Cannot create worktree on protected branch '${branch}'. Use a feature branch.`);
  }

  const worktreePath = getWorktreePath(agentId, org, repo);
  
  if (existsSync(worktreePath)) {
    throw new Error(`Worktree already exists at ${worktreePath}`);
  }

  // Find the source repo
  const repoRoot = findRepoRoot(org, repo, exec);
  if (!repoRoot) {
    throw new Error(
      `Cannot find local clone of ${org}/${repo}. ` +
      `Clone it first: git clone https://github.com/${org}/${repo}.git ~/github/${org}/${repo}`
    );
  }

  // Ensure parent directory exists
  mkdirSync(join(worktreePath, ".."), { recursive: true });

  // Fetch latest
  try {
    exec(`git fetch origin`, { cwd: repoRoot });
  } catch {
    // Fetch might fail if offline, continue anyway
  }

  // Check if branch already exists
  let branchExists = false;
  try {
    exec(`git rev-parse --verify ${branch}`, { cwd: repoRoot });
    branchExists = true;
  } catch {
    // Branch doesn't exist yet
  }

  // Create the worktree
  if (branchExists) {
    exec(`git worktree add "${worktreePath}" ${branch}`, { cwd: repoRoot });
  } else {
    exec(`git worktree add -b ${branch} "${worktreePath}" origin/${baseBranch}`, { cwd: repoRoot });
  }

  // Install safety hooks
  installHooks(worktreePath, agentId);

  return {
    agentId,
    org,
    repo,
    branch,
    path: worktreePath,
    exists: true,
  };
}

/**
 * List all worktrees across all agents.
 */
export function listWorktrees(exec: ExecFn = defaultExec): WorktreeInfo[] {
  const results: WorktreeInfo[] = [];

  if (!existsSync(AGENTS_DIR)) return results;

  const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");

  let agentDirs: string[];
  try {
    agentDirs = readdirSync(AGENTS_DIR);
  } catch {
    return results;
  }

  for (const agentId of agentDirs) {
    const reposBase = join(AGENTS_DIR, agentId, "repos");
    if (!existsSync(reposBase)) continue;

    let orgs: string[];
    try {
      orgs = readdirSync(reposBase);
    } catch {
      continue;
    }

    for (const org of orgs) {
      const orgDir = join(reposBase, org);
      if (!statSync(orgDir).isDirectory()) continue;

      let repos: string[];
      try {
        repos = readdirSync(orgDir);
      } catch {
        continue;
      }

      for (const repo of repos) {
        const wtPath = join(orgDir, repo);
        if (!statSync(wtPath).isDirectory()) continue;

        let branch = "unknown";
        try {
          branch = exec("git branch --show-current", { cwd: wtPath });
        } catch {
          // Not a valid git worktree
        }

        results.push({
          agentId,
          org,
          repo,
          branch,
          path: wtPath,
          exists: existsSync(join(wtPath, ".git")),
        });
      }
    }
  }

  return results;
}

/**
 * Remove a worktree for an agent.
 */
export function removeWorktree(
  agentId: string,
  org: string,
  repo: string,
  exec: ExecFn = defaultExec,
): void {
  const worktreePath = getWorktreePath(agentId, org, repo);

  if (!existsSync(worktreePath)) {
    throw new Error(`No worktree found at ${worktreePath}`);
  }

  // Find the main repo to run worktree remove
  const repoRoot = findRepoRoot(org, repo, exec);
  if (repoRoot) {
    try {
      exec(`git worktree remove "${worktreePath}" --force`, { cwd: repoRoot });
    } catch {
      // If git worktree remove fails, try manual cleanup
      const { rmSync } = require("node:fs") as typeof import("node:fs");
      rmSync(worktreePath, { recursive: true, force: true });
      try {
        exec("git worktree prune", { cwd: repoRoot });
      } catch {
        // Best effort
      }
    }
  } else {
    // No repo root found, just remove the directory
    const { rmSync } = require("node:fs") as typeof import("node:fs");
    rmSync(worktreePath, { recursive: true, force: true });
  }
}

export interface SyncWorktreeOptions {
  agentId?: string;
  exec?: ExecFn;
}

/**
 * Sync (fetch + rebase) all worktrees or a specific agent's worktrees.
 */
export function syncWorktrees(opts: SyncWorktreeOptions = {}): { synced: string[]; errors: string[] } {
  const exec = opts.exec ?? defaultExec;
  const worktrees = listWorktrees(exec);
  const filtered = opts.agentId
    ? worktrees.filter((wt) => wt.agentId === opts.agentId)
    : worktrees;

  const synced: string[] = [];
  const errors: string[] = [];

  for (const wt of filtered) {
    if (!wt.exists) {
      errors.push(`${wt.agentId}/${wt.org}/${wt.repo}: worktree missing`);
      continue;
    }

    try {
      exec("git fetch origin", { cwd: wt.path });
      exec("git rebase origin/main", { cwd: wt.path });
      synced.push(`${wt.agentId}/${wt.org}/${wt.repo}`);
    } catch (e) {
      // Abort any in-progress rebase
      try {
        exec("git rebase --abort", { cwd: wt.path });
      } catch {
        // ignore
      }
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${wt.agentId}/${wt.org}/${wt.repo}: ${msg}`);
    }
  }

  return { synced, errors };
}
