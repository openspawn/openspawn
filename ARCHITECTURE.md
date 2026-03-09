# Architecture

OpenSpawn is an Nx monorepo — multi-agent coordination platform with React dashboards, FastAPI backend, and a sandbox server.

## Monorepo Structure

```
apps/
  demo/            React dashboard (bikinibottom.ai)
  team/            Internal team dashboard
  website/         openspawn.ai marketing site
  platform/        openspawn.ai landing page server
  api/             FastAPI backend (REST + OpenAPI) — Python, managed by uv
  docs/            Astro Starlight documentation (docs.openspawn.ai)
  mcp/             MCP server for AI tool integration
  sandbox-cli/     CLI entry point for sandbox

libs/
  dashboard-data/  Shared hooks, auth, utilities
  dashboard-ui/    Shared React UI components (shadcn/ui)
  design-tokens/   Design system tokens (colors, spacing, typography)
  database/        TypeORM entities, migrations, data source
  demo-data/       Simulation engine, scenarios, fixtures
  shared-types/    Shared TypeScript types and enums
  test-utils/      Shared test utilities

tools/
  sandbox/         Coordination sandbox server (SSE + MCP + A2A)

packages/
  openspawn/       npm CLI package (npx openspawn init)
  coordinator/     Coordination server package
  cli/             Go CLI (GoReleaser)
```

## Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| API Framework | FastAPI (Python)                        |
| API Protocol  | REST + OpenAPI                          |
| Database      | PostgreSQL 16 + SQLAlchemy async        |
| Frontend      | React 19 + Vite                         |
| Styling       | TailwindCSS v4                          |
| Animations    | framer-motion                           |
| Graph Viz     | @xyflow/react (ReactFlow)               |
| Build System  | Nx                                      |
| Linting       | oxlint + oxfmt                          |
| Testing       | Vitest + Playwright                     |
| Language      | TypeScript (strict, bundler resolution) |

## Deployment Topology

All traffic routes through Cloudflare (DNS + CDN) to a single VPS running Caddy for HTTPS termination.

| Domain            | Container  | Port | Serves                                  |
| ----------------- | ---------- | ---- | --------------------------------------- |
| bikinibottom.ai   | `app`      | 3333 | Live demo (sandbox + dashboard)         |
| openspawn.ai      | `platform` | 3334 | Website + landing page                  |
| openspawn.ai/api/ | `api`      | 8000 | FastAPI backend (REST + OpenAPI)        |
| docs.openspawn.ai | —          | —    | Astro/Starlight docs (GitHub Pages)     |

The `app` container runs `tools/sandbox/src/index.ts`, which serves both the REST/SSE API and three pre-built static apps (`demo`, `team`, `website`) from disk.

### CI/CD Workflows

| Workflow              | Trigger      | What it does                                       |
| --------------------- | ------------ | -------------------------------------------------- |
| `ci.yml`              | All PRs      | Build, test, lint, Python API checks               |
| `deploy.yml`          | Push to main | Docker build + deploy to VPS (bikinibottom.ai + API) |
| `deploy-platform.yml` | Push to main | Docker build + deploy platform (openspawn.ai)        |
| `deploy-docs.yml`     | Push to main | Build + deploy Starlight docs (docs.openspawn.ai)    |

### Docker Build (Dockerfile)

The main Dockerfile builds three apps in a multi-stage build:

1. `pnpm nx run demo:build` -> `dashboard-dist`
2. `pnpm nx run team:build` -> `team-dist`
3. `pnpm nx run website:build` -> `website-dist`

The runtime stage runs `tools/sandbox/src/index.ts` which serves the API and all static apps.

The API Dockerfile (`apps/api/Dockerfile`) builds the FastAPI backend as a separate container using uv for dependency management.

## Key Patterns

### Demo Mode

The dashboard runs entirely client-side in demo mode using a simulation engine (`libs/demo-data/`). No backend needed — the engine generates realistic agent/task data.

### Agent Hierarchy

Agents have levels (L1-L10) determining their authority. Higher-level agents can assign tasks to lower-level ones. The orchestrator pattern (L9-L10) manages overall coordination.

## API Endpoints

All integration endpoints use the `/integrations/` prefix:

- `POST /integrations/github/webhook` — GitHub webhooks
- `GET/POST /integrations/github/connections` — GitHub connection management
- `POST /integrations/linear/webhook` — Linear webhooks
- `GET/POST /integrations/linear/connections` — Linear connection management

## Database

FastAPI models live in `apps/api/app/models/`. Alembic migrations in `apps/api/alembic/`. TypeORM entities (legacy) in `libs/database/src/entities/`.

Key entities: `Agent`, `Task`, `Message`, `CreditTransaction`, `Memory`, `Organization`.
