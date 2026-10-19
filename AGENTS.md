# AGENTS.md — AI Agent Quick Reference

Quick reference for AI agents working on OpenSpawn. Start here.

## What Is This?

Multi-agent coordination platform. Agents get tasks, earn credits, communicate. Humans monitor via dashboard.

**Stack**: FastAPI (Python) + React Dashboard + PostgreSQL (prod) / SQLite (local) + MCP (served by API)
**Package Manager**: pnpm (frontend) + uv (Python API)
**Build System**: Nx

---

## Commands

```bash
pnpm install                                              # Install
cd apps/api && uv run uvicorn app.main:app --reload       # Dev (FastAPI)
pnpm run dev:sandbox                                      # Dev (Sandbox + Dashboard)
npx openspawn init                                        # CLI — scaffold project
npx openspawn preview                                     # CLI — preview org in local sandbox
npx openspawn start                                       # CLI — start coordinator
pnpm exec nx run-many -t build                            # Build
pnpm exec nx test dashboard                                # Unit tests
pnpm exec nx e2e demo-e2e                                  # E2E tests
pnpm exec nx run-many -t lint                             # Lint
pnpm exec oxfmt --write .                                 # Format
cd apps/api && uv run alembic upgrade head                # Database migrations
```

---

## Key URLs

- **Demo**: https://bikinibottom.ai
- **API**: https://openspawn.ai/api/ | docs: https://openspawn.ai/api/docs
- **Website**: https://openspawn.ai
- **Docs**: https://openspawn.ai/docs/ (docs.openspawn.ai redirects here)
- **Dev dashboard**: http://localhost:4200 | demo mode: http://localhost:4200/?demo=true
- **Dev sandbox**: http://localhost:3333
- **Dev API**: http://localhost:8000 | docs: http://localhost:8000/docs

---

## Architecture (1-minute version)

1. **Sandbox server** (`tools/sandbox/`) hosts the REST/SSE API and serves pre-built dashboards
2. **Dashboard** (`apps/dashboard/`) serves both openspawn.ai and bikinibottom.ai (via `VITE_DASHBOARD_THEME` + `VITE_SANDBOX_MODE` env vars)
3. **API** (`apps/api/`) manages tasks, credits, messages, MCP tools, and agent spawning (FastAPI + SQLAlchemy)
4. **Preview mode** — `openspawn preview` launches the sandbox simulation + dashboard at `localhost:3333` (deterministic, zero LLM calls)
5. **Agent spawning** — `openspawn start` launches the Python coordinator which spawns Claude Code CLI subprocesses with a configurable concurrency cap
6. **Two-tier model** — Tier 1 (local): SQLite + asyncio scheduler, no Docker needed. Tier 2 (deployed): PostgreSQL + arq/Redis + Docker
7. **Demo mode** simulates everything client-side (no backend needed) via `libs/demo-data/`
8. **Docker** builds dashboard + team + website, serves all via sandbox server on VPS (Tier 2 only)

Full details: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Conventions

- **PRs**: All changes go through pull requests — never push directly to `main`. Squash merge, delete branch after.
- **AI-assisted PRs**: Mark as AI-assisted in the PR title or description and note the testing level (untested / lightly tested / fully tested)
- **Tests in PRs**: New utility functions need unit tests; new pages need a "renders without error" E2E test; bug fixes should include a regression test
- **CLI version**: Bump `packages/openspawn/package.json` (`YYYY.M.D`) in any PR that changes CLI behavior
- **Commits**: Scoped conventional commits (`feat(scope):`, `fix(scope):`)
- **Imports**: No barrel files, explicit paths
- **Formatting (TS)**: oxfmt (Rust-based)
- **Formatting (Python)**: `ruff format` — always run before committing Python changes
- **Linting (TS)**: oxlint (type-aware) — fix all warnings, not just errors. Zero warnings policy.
- **Linting (Python)**: `ruff check` — must pass with 0 errors. Auto-fix import sorting with `ruff check --fix`.
- **Components**: shadcn/ui patterns, Tailwind
- **TypeScript**: No `any`, no `as` casts, no non-null assertions (`!`), prefer string enums. If a type doesn't fit, fix the type — don't cast around it. Use type guards, generics, or narrow via conditionals instead.
- **Documentation**: Every PR must update relevant internal docs (`ARCHITECTURE.md`, `AGENTS.md`, `SCHEMA.md`) and public-facing docs (`apps/website/content/docs/`) to reflect changes

---

## Do Not

- **Use `npm` or `yarn`** — this project uses pnpm only
- **Use `any`, `as` casts, or `!` non-null assertions** — find the correct type, use type guards, or narrow via conditionals. TypeScript exists to catch type errors; casting hides them.
- **Create barrel files** — use explicit import paths
- **Commit generated files without running codegen** — run `pnpm run codegen` first
- **Push directly to `main`** — all changes require a PR

---

## After Making Changes

Always run before finishing and before opening a PR:

```bash
pnpm exec oxfmt --write .                                              # Format (TS)
cd apps/api && uv run ruff format . && uv run ruff check --fix .       # Format + lint (Python)
cd apps/api && uv run pyright app/                                     # Type check (Python — must pass with 0 errors)
pnpm exec nx run-many -t lint                                          # Lint (TS — must pass with 0 errors AND 0 warnings)
pnpm exec nx run-many -t build                                         # Build
pnpm exec nx run-many -t test --exclude=openspawn                      # Test (TS)
cd apps/api && uv run pytest tests/ -v                                 # Test (Python)
```

---

## Deeper Docs

| Topic                                   | Document                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Architecture & deployment               | [ARCHITECTURE.md](ARCHITECTURE.md)                                                                                 |
| Deploy, testing, profiling, CLI publish | [CONTRIBUTING.md](CONTRIBUTING.md)                                                                                 |
| Product requirements                    | [docs/openspawn/PRD.md](docs/openspawn/PRD.md)                                                                     |
| API reference (100+ endpoints)          | [docs/openspawn/API.md](docs/openspawn/API.md)                                                                     |
| Database schema                         | [docs/openspawn/SCHEMA.md](docs/openspawn/SCHEMA.md)                                                               |
| Event mesh spike findings               | [docs/openspawn/spikes/2026-03-14-event-mesh-findings.md](docs/openspawn/spikes/2026-03-14-event-mesh-findings.md) |
