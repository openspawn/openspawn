---
source: https://openspawn.ai/docs/architecture/worktree-isolation
generated: 2026-03-14
---
# Worktree Isolation Spec

**Status:** Draft
**Author:** Dennis
**Date:** 2026-02-26

## Problem

When multiple agents work on the same repo concurrently, they create branches from a shared worktree. If the main branch moves forward (PRs merged), agents' branches become stale and their diffs delete recently-added files. The reviewer must cherry-pick instead of merge, wasting time and risking errors.

## Solution: Per-Agent Git Worktrees

Each agent gets an isolated `git worktree` created at the current `origin/master`. No shared working directory. No stale base.

### How It Works

```
repo/                          # Main checkout (Dennis)
repo-worktrees/
  ├── web-eng/                 # Sub-agent 1's isolated worktree
  ├── docs-writer/             # Sub-agent 2's isolated worktree
  └── designer/                # Sub-agent 3's isolated worktree
```

### Agent Spawning Integration

When `openspawn start` spawns a Claude Code subprocess for an agent, it can provision a per-agent worktree automatically:

1. `git fetch origin`
2. `git worktree add ../repo-worktrees/<agent-id> -b <agent-id>/task-name origin/master`
3. Sets the subprocess working directory to the worktree
4. Sets `OPENSPAWN_REPO` env var pointing to the worktree

When the agent subprocess exits, the worktree is cleaned up:

1. `git worktree remove ../repo-worktrees/<agent-id>`
2. Workspace archived as before

### Coordinator Integration

The `agent_register` MCP tool gains an optional `worktree_path` field:

```sql
ALTER TABLE agents ADD COLUMN worktree_path TEXT;
```

When an agent calls `task_claim`, the coordinator can verify the worktree exists and is at the expected commit.

### Branch Naming Convention

`<agent-id>/<task-slug>` — e.g., `web-eng/serve-llms-txt`

Already in use by CEO's sub-agents. Formalize it.

### Lifecycle

```
spawn → create worktree at origin/master
      → agent subprocess works on branch in isolated worktree
      → agent pushes branch
      → reviewer cherry-picks or merges
      → subprocess exits → remove worktree
```

### Edge Cases

- **Multiple tasks per agent:** Agent creates new branches within their worktree. Each branch starts from `origin/master` (they run `git fetch && git checkout -b <branch> origin/master`).
- **Long-lived agents:** Periodically `git fetch origin` to stay current. The worktree itself doesn't need to be on master — only new branches do.
- **Worktree limit:** Git supports hundreds of worktrees. Not a concern.

### Migration Path

1. **Now:** CEO's AGENTS.md updated with `git fetch` rule (quick fix)
2. **Next:** Agent spawner auto-creates worktrees per subprocess
3. **Later:** Coordinator auto-creates worktrees on `task_claim`

### Benefits

- Zero merge conflicts between concurrent agents
- Every branch starts from latest master
- No shared filesystem state
- Natural cleanup on subprocess exit
- Works with existing git hosting (no special server)

## Implementation Estimate

- Spawner changes: ~100 lines Python (worktree provisioning in subprocess lifecycle)
- Coordinator: ~20 lines (worktree_path column + validation)
- Total: 1 PR, ~2 hours
