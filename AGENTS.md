# AGENTS.md — AI Agent Quick Reference

Quick reference for AI agents working on OpenSpawn. Start here.

## What Is This?

Multi-agent coordination platform. Agents get tasks, earn credits, communicate. Humans monitor via dashboard.

**Stack**: FastAPI (Python) + React Dashboard + PostgreSQL + MCP Server
**Package Manager**: pnpm (frontend) + uv (Python API)
**Build System**: Nx

---

## Domains & Deployment

| Domain                | What                                   | Container        | Port |
| --------------------- | -------------------------------------- | ---------------- | ---- |
| **bikinibottom.ai**   | Live demo (sandbox + dashboard + team) | `app`            | 3333 |
| **openspawn.ai**      | Website + landing page                 | `platform`       | 3334 |
| **docs.openspawn.ai** | Astro/Starlight docs                   | Not yet deployed | —    |

Both containers run on a single VPS. Caddy handles HTTPS. Deploy via `deploy.yml` and `deploy-platform.yml` workflows.

---

## Project Structure

```
apps/
  demo/            -> React dashboard (bikinibottom.ai)
  team/            -> Internal team dashboard
  website/         -> openspawn.ai marketing site
  platform/        -> openspawn.ai landing page
  api/             -> FastAPI backend (REST + OpenAPI) — Python, uv
  api-nestjs/      -> NestJS backend (legacy, being replaced)
  docs/            -> Astro Starlight documentation
  mcp/             -> MCP server for agent tools
  sandbox-cli/     -> CLI entry point for sandbox
  dashboard/       -> DEPRECATED — replaced by demo

libs/
  dashboard-data/  -> Shared hooks, auth, GraphQL, utilities
  dashboard-ui/    -> Shared React UI components
  design-tokens/   -> Design system (colors, spacing, typography)
  database/        -> TypeORM entities
  demo-data/       -> Simulation engine, scenarios, fixtures
  shared-types/    -> Shared TypeScript types and enums
  test-utils/      -> Shared test utilities

tools/
  sandbox/         -> Coordination sandbox server (SSE + MCP + A2A)

packages/
  openspawn/       -> npm CLI package (npx openspawn init)
  coordinator/     -> Coordination server package
  cli/             -> Go CLI (GoReleaser)
```

---

## Commands

```bash
# Install
pnpm install

# Dev (FastAPI)
cd apps/api && uv run uvicorn app.main:app --reload

# Dev (Legacy NestJS API + Demo dashboard)
pnpm exec nx run-many -t serve -p api-nestjs,demo

# Dev (Sandbox + Dashboard together)
pnpm run dev:sandbox

# Build
pnpm exec nx run-many -t build

# Test
pnpm exec nx test demo          # Unit tests
pnpm exec nx e2e demo           # E2E tests

# Lint & Format
pnpm exec nx run-many -t lint
pnpm exec oxfmt --write .

# GraphQL codegen
pnpm run codegen

# Database
pnpm exec nx run api:sync-schema
pnpm exec nx run api:seed
```

---

## Key URLs (dev)

- Demo dashboard: http://localhost:4200
- Demo mode: http://localhost:4200/?demo=true
- Sandbox: http://localhost:3333
- API (FastAPI): http://localhost:8000
- API docs: http://localhost:8000/docs
- API (NestJS legacy): http://localhost:3000

---

## Architecture (1-minute version)

1. **Sandbox server** (`tools/sandbox/`) hosts the REST/SSE API and serves pre-built dashboards
2. **Demo app** (`apps/demo/`) is the React dashboard for bikinibottom.ai
3. **API** (`apps/api/`) manages tasks, credits, messages (FastAPI + SQLAlchemy)
4. **Demo mode** simulates everything client-side (no backend needed) via `libs/demo-data/`
5. **Docker** builds demo + team + website, serves all via sandbox server on VPS

Full details: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Database Entities

| Entity              | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `Agent`             | AI agents with levels (L1-L10), parent hierarchy, balance |
| `AgentCapability`   | Skills per agent with proficiency level                   |
| `Task`              | Work items with Kanban status flow                        |
| `TaskDependency`    | Blocking relationships between tasks                      |
| `CreditTransaction` | Debits/credits with audit trail                           |
| `Channel`           | Communication channels (task, DM, broadcast)              |
| `Message`           | Messages in channels                                      |
| `Event`             | Append-only system audit log                              |

---

## Conventions

- **Commits**: Scoped conventional commits (`feat(scope):`, `fix(scope):`)
- **Imports**: No barrel files, explicit paths
- **Formatting**: oxfmt (Rust-based)
- **Linting**: oxlint (type-aware)
- **Components**: shadcn/ui patterns, Tailwind
- **TypeScript**: No `any`, no `as` casts, prefer string enums
- **Documentation**: Every PR must update relevant internal docs (`ARCHITECTURE.md`, `AGENTS.md`, `SCHEMA.md`) and public-facing docs (`apps/docs/`) to reflect changes

---

## Do Not

- **Edit `apps/dashboard/`** — deprecated, use `apps/demo/` instead
- **Edit `apps/api-nestjs/`** — legacy, being replaced by `apps/api/` (FastAPI)
- **Use `npm` or `yarn`** — this project uses pnpm only
- **Use `any` or `as` casts** — find the correct type
- **Create barrel files** — use explicit import paths
- **Commit generated files without running codegen** — run `pnpm run codegen` first

---

## After Making Changes

Always run before finishing:

```bash
pnpm exec oxfmt --write .          # Format
pnpm exec nx run-many -t lint      # Lint
```

---

## Common Tasks

### Add a new dashboard page

1. Create `apps/demo/src/pages/my-page.tsx`
2. Export from `apps/demo/src/pages/index.ts`
3. Add route in `apps/demo/src/app/app.tsx`
4. Add nav link in `apps/demo/src/components/layout.tsx`

### Add a GraphQL query

1. Add query to `apps/demo/src/graphql/operations.ts`
2. Run `pnpm run codegen`
3. Import hook from `libs/dashboard-data/src/graphql/generated/hooks`

### Add demo data

1. Add fixtures to `libs/demo-data/src/fixtures/`
2. Export from `libs/demo-data/src/fixtures/index.ts`
3. Update scenarios in `libs/demo-data/src/scenarios/`

---

## Deeper Docs

| Topic                         | Document                                             |
| ----------------------------- | ---------------------------------------------------- |
| Architecture & deployment     | [ARCHITECTURE.md](ARCHITECTURE.md)                   |
| Testing, PRs, dev guide       | [CONTRIBUTING.md](CONTRIBUTING.md)                   |
| Product requirements          | [docs/openspawn/PRD.md](docs/openspawn/PRD.md)       |
| API reference (50+ endpoints) | [docs/openspawn/API.md](docs/openspawn/API.md)       |
| Database schema               | [docs/openspawn/SCHEMA.md](docs/openspawn/SCHEMA.md) |
