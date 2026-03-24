# Git Worktree Management for Multi-Agent Repos

## Why Worktrees Matter

When multiple AI agents work on the same repository without isolation, things go wrong:

- **Merge conflicts** between agents editing the same files
- **Dirty working trees** blocking builds and tests
- **The PR #435 incident**: An agent ran `git init` in a shared checkout, creating an orphan `master` branch with 66 commits and no common ancestor with `main`

Git worktrees solve all of this. One `.git` directory, N working trees, each agent on its own branch. Concurrent builds, zero conflicts, disk-efficient.

## Quick Start

```bash
# Create a worktree for agent "dennis" on the openspawn/openspawn repo
openspawn worktree create dennis --repo openspawn/openspawn

# This creates:
#   Path:   ~/.openspawn/agents/dennis/repos/openspawn/openspawn
#   Branch: dennis-workspace (auto-created from origin/main)
#   Hooks:  pre-push + pre-commit safety hooks installed

# List all agent worktrees
openspawn worktree list

# Sync all worktrees (fetch + rebase onto main)
openspawn worktree sync

# Sync just one agent's worktrees
openspawn worktree sync --agent dennis

# Remove a worktree
openspawn worktree remove dennis --repo openspawn/openspawn
```

## Directory Convention

All agent worktrees follow a standard layout:

```
~/.openspawn/agents/
  <agent-id>/
    repos/
      <org>/
        <repo>/          ← git worktree (branch: <agent-id>-workspace)
```

### Example

```
~/.openspawn/agents/
  dennis/
    repos/
      openspawn/
        openspawn/       ← branch: dennis-workspace
  ceo/
    repos/
      openspawn/
        openspawn/       ← branch: ceo-workspace
  drinkify/
    repos/
      drinkify/
        drinkify/        ← separate repo clone (not a worktree)
```

## ORG.md Integration

Agents declare repo access in your `ORG.md` file:

```markdown
## Structure

### Dennis — coo

- **Level:** 10
- **Domain:** operations
- **Repos:** openspawn/openspawn (write, branch: dennis-workspace)

### CEO — executive

- **Level:** 10
- **Domain:** strategy
- **Repos:** openspawn/openspawn (write, branch: ceo-workspace)

### Engineering

#### Developer — worker

- **Level:** 4
- **Domain:** engineering
- **Repos:** openspawn/openspawn (read)
```

### Repo Access Levels

| Access | Permissions |
|--------|-------------|
| `read` | Can clone and read. No worktree created by default. |
| `write` | Gets a dedicated worktree with a workspace branch. |

### Custom Branches

By default, agents get `<agent-id>-workspace` as their branch. You can override:

```markdown
- **Repos:** openspawn/openspawn (write, branch: feat/custom-branch)
```

### Multiple Repos

```markdown
- **Repos:** openspawn/openspawn (write, branch: dennis-workspace), openspawn/docs (read)
```

## Safety Guardrails

Every worktree gets safety hooks installed automatically:

### Pre-push Hook

Prevents:
- **Direct pushes to `main`, `master`, `develop`, `release`** — agents must create PRs
- Suggests `gh pr create` as the correct workflow

### Pre-commit Hook

Warns about:
- **`git init` commands** in staged files — prevents the PR #435 incident

### Branch Protection

- Agents cannot create worktrees on protected branches (`main`, `master`, `develop`, `release`)
- Each agent gets their own namespace: `<agent-id>-workspace` or `<agent-id>/<feature>`

## How Worktrees Work

Git worktrees are a built-in feature of Git that allows multiple working trees from a single `.git` directory:

```bash
# Under the hood, openspawn runs:
git worktree add ~/.openspawn/agents/dennis/repos/openspawn/openspawn -b dennis-workspace origin/main
```

Key properties:
- **Shared object store** — all worktrees share the same `.git` objects (disk efficient)
- **Independent working trees** — each worktree can be on a different branch
- **Concurrent operations** — build/test in one worktree while editing another
- **Single fetch** — `git fetch` in any worktree updates all of them

## Syncing Worktrees

To keep worktrees up-to-date with `main`:

```bash
# Sync all agent worktrees
openspawn worktree sync

# Sync one agent
openspawn worktree sync --agent dennis
```

This runs `git fetch origin && git rebase origin/main` in each worktree. If a rebase fails (conflicts), it's automatically aborted and reported.

## CLI Reference

### `openspawn worktree create`

```
openspawn worktree create <agent-id> --repo <org/repo> [--branch <name>] [--base <branch>]
```

| Flag | Description | Default |
|------|-------------|---------|
| `--repo` | Repository in `org/repo` format | Required |
| `--branch` | Branch name for the worktree | `<agent-id>-workspace` |
| `--base` | Base branch to create from | `main` |

### `openspawn worktree list`

Lists all agent worktrees with agent ID, repo, branch, path, and status.

### `openspawn worktree remove`

```
openspawn worktree remove <agent-id> --repo <org/repo>
```

Removes the worktree and cleans up git references.

### `openspawn worktree sync`

```
openspawn worktree sync [--agent <id>]
```

Fetches and rebases all (or one agent's) worktrees onto `origin/main`.

## Troubleshooting

### "Cannot find local clone"

The source repo must be cloned locally first. Clone it:

```bash
git clone https://github.com/org/repo.git ~/github/org/repo
```

OpenSpawn looks for repos in these locations:
- `~/github/<org>/<repo>`
- `~/repos/<org>/<repo>`
- `~/projects/<org>/<repo>`
- `~/<org>/<repo>`

### "Worktree already exists"

Remove the existing worktree first:

```bash
openspawn worktree remove <agent-id> --repo <org/repo>
```

### "Branch already checked out"

Each branch can only be checked out in one worktree at a time. Use a different branch name:

```bash
openspawn worktree create agent-2 --repo org/repo --branch agent-2-feature-x
```

### Rebase conflicts during sync

If sync fails with conflicts, manually resolve in the worktree:

```bash
cd ~/.openspawn/agents/<agent-id>/repos/<org>/<repo>
git rebase --continue  # after resolving conflicts
# or
git rebase --abort     # to give up
```
