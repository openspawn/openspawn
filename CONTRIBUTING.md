# Contributing to OpenSpawn

This document defines the Software Development Lifecycle (SDLC) for all contributors — human and agent alike. Every member of the org MUST follow these rules. No exceptions.

## Golden Rules

1. **`main` is the single source of truth.** All work branches from `main`, all PRs target `main`.
2. **Never `git init`.** Never create orphan branches. Never start a fresh repo when one already exists.
3. **Never force-push to `main`.** Branch protection enforces this, but the rule exists even without it.
4. **Every change goes through a PR.** No direct pushes to `main`. Even typo fixes.
5. **Communication > velocity.** If you're unsure, ask. If something looks wrong, flag it.

## Branching Strategy

```
main (protected, deployable)
 └── feature/my-feature    ← branch off main
 └── fix/my-bugfix         ← branch off main
 └── docs/my-doc-change    ← branch off main
```

### Before Starting Any Work

```bash
git fetch origin
git checkout -b <type>/<description> origin/main
```

**Branch naming:** `<type>/<description>` where type is one of:
- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `chore/` — maintenance, deps, CI
- `test/` — test additions/fixes

### For Sub-Agents (CEO org workers)

Sub-agents MUST:
- Branch off `origin/main` (fetch first!)
- Use naming: `<role>/<feature>` (e.g., `designer/landing-polish`, `web-eng/getting-started`)
- Create a PR with a clear title and description
- Keep PRs focused — one feature per PR, not 66 commits accumulated on a branch

Sub-agents MUST NOT:
- Run `git init`
- Create new repositories or orphan branches
- Push directly to `main` or `master`
- Accumulate large batches of work without PRing

## Pull Requests

### Requirements
- Clear title following conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- Description of what changed and why
- Must build successfully (TypeScript compiles, no runtime crashes)
- Should be reviewed before merge when possible

### Size Guidelines
- **Ideal:** < 500 lines changed
- **Acceptable:** < 1000 lines
- **Needs justification:** > 1000 lines (break it up if possible)

## Deployment

### Pipeline
1. PR merged to `main`
2. `docker build --platform linux/amd64 -t bikinibottom:deploy .`
3. `docker save | ssh root@VPS "docker load"`
4. `docker compose down && docker compose up -d`
5. Cloudflare cache purge (both zones)
6. **Smoke test with Playwright** — verify all routes load without JS errors

### Post-Deploy Verification
Every deploy MUST include:
- HTTP 200 on all primary routes
- No client-side JavaScript errors (Playwright `pageerror` listener)
- Visual spot-check on at least the landing page

## Testing

- Run `npx tsc --noEmit` before committing to catch type errors
- Run existing test suites: `pnpm test`
- New features should include tests when practical
- Playwright e2e tests for critical user paths

## Dependency Rules

- Check React version compatibility before adding UI libraries
- `@tremor/react` v3 is **incompatible** with React 19 (crashes via `@headlessui/__store`)
- When in doubt, check the library's peer dependencies against our stack

## Communication Protocol

### When to Escalate
- Blocked for > 30 minutes
- Merge conflicts you can't resolve
- Breaking changes to shared code
- Anything that touches deployment infrastructure

### Where to Communicate
- **#alerts** — urgent issues, blockers, deploy problems
- **#handoffs** — work ready for review/deploy
- **#strategy** — planning, architecture decisions
- **#general** — day-to-day coordination

### Transparency Requirements
- If you create a branch, it should be visible in the PR within 24 hours
- If you encounter a problem, document it immediately (don't silently work around it)
- If you change the deployment, notify #alerts

## Incident Response

When something breaks in production:
1. **Acknowledge** in #alerts immediately
2. **Diagnose** — check container logs, run Playwright smoke test
3. **Fix or revert** — if fix is quick (< 15 min), fix forward. Otherwise revert.
4. **Post-mortem** — document what happened, why, and how to prevent it

## Repository Hygiene

- Delete merged branches (both local and remote)
- Don't leave orphaned branches — clean up after yourself
- Keep `main` deployable at all times
- If the build is broken on main, fixing it is the #1 priority

---

*This document is mandatory for all org members. Violations should be flagged in #alerts immediately.*
