# Architecture

OpenSpawn is an Nx monorepo — multi-agent coordination platform with React dashboards, FastAPI backend, and a sandbox server.

## Monorepo Structure

```
apps/
  dashboard/       React dashboard (openspawn.ai + bikinibottom.ai via env vars)
  team/            Internal team dashboard
  website/         openspawn.ai marketing site
  platform/        openspawn.ai landing page server
  api/             FastAPI backend (REST + OpenAPI + MCP) — Python, managed by uv
  (docs consolidated into website app — content in website/content/docs/)
  sandbox-cli/     CLI entry point for sandbox

libs/
  dashboard-data/  Shared hooks, auth, utilities
  dashboard-ui/    Shared React UI components (shadcn/ui)
  design-tokens/   Design system tokens (colors, spacing, typography)
  demo-data/       Simulation engine, scenarios, fixtures
  shared-types/    Shared TypeScript types and enums
  test-utils/      Shared test utilities

tools/
  sandbox/         Coordination sandbox server (SSE + MCP + A2A)

packages/
  openspawn/       npm CLI package — scaffolding (init) + coordinator launcher (start)
  coordinator/     Coordination server package
```

## Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| API Framework  | FastAPI (Python)                                         |
| API Protocol   | REST + OpenAPI + MCP                                     |
| Database       | PostgreSQL 16 + SQLAlchemy async (prod) / SQLite (local) |
| Background     | arq + Redis (prod) / asyncio scheduler (local)           |
| Agent Spawning | Claude Code CLI subprocesses with concurrency cap        |
| Frontend       | React 19 + Vite                                          |
| Styling        | TailwindCSS v4                                           |
| Animations     | framer-motion                                            |
| Graph Viz      | @xyflow/react (ReactFlow)                                |
| Build System   | Nx                                                       |
| Linting        | oxlint + oxfmt                                           |
| Testing        | Vitest + Playwright                                      |
| Language       | TypeScript (strict, bundler resolution)                  |

## Deployment Topology

All traffic routes through Cloudflare (DNS + CDN) to a single VPS running Caddy for HTTPS termination.

| Domain            | Serves                           |
| ----------------- | -------------------------------- |
| bikinibottom.ai   | Live demo (sandbox + dashboard)  |
| openspawn.ai      | Website + landing page           |
| openspawn.ai/api/ | FastAPI backend (REST + OpenAPI) |
| docs.openspawn.ai | Redirects to openspawn.ai/docs/  |

The `app` container runs `tools/sandbox/src/index.ts`, which serves both the REST/SSE API and three pre-built static apps (`demo`, `team`, `website`) from disk.

### CI/CD Workflows

| Workflow              | Trigger      | What it does                                         |
| --------------------- | ------------ | ---------------------------------------------------- |
| `ci.yml`              | All PRs      | Build, test, lint, Python API checks                 |
| `deploy.yml`          | Push to main | Docker build + deploy to VPS (bikinibottom.ai + API) |
| `deploy-platform.yml` | Push to main | Docker build + deploy platform (openspawn.ai)        |
| (docs deploy removed) | —            | Docs now served by website app at /docs/             |

### Docker Build (Dockerfile)

The main Dockerfile builds three apps in a multi-stage build:

1. `pnpm nx run dashboard:build` -> `dashboard-dist`
2. `pnpm nx run team:build` -> `team-dist`
3. `pnpm nx run website:build` -> `website-dist`

The runtime stage runs `tools/sandbox/src/index.ts` which serves the API and all static apps.

The API Dockerfile (`apps/api/Dockerfile`) builds the FastAPI backend as a separate container using uv for dependency management.

## Key Patterns

### Dashboard Modes

A single dashboard app (`apps/dashboard/`) serves all deployment contexts via env vars:

| Env Var                | Values                                | Effect                                         |
| ---------------------- | ------------------------------------- | ---------------------------------------------- |
| `VITE_DASHBOARD_THEME` | `openspawn` (default), `bikinibottom` | Brand, colors, wave animations, BB hero page   |
| `VITE_DEMO_MODE`       | `true` / unset                        | Skips auth, uses client-side simulation engine |

**bikinibottom.ai** uses both: `VITE_DASHBOARD_THEME=bikinibottom` + `VITE_DEMO_MODE=true`.
**openspawn.ai dashboard** uses neither (defaults to OpenSpawn theme + real auth).
Demo mode can also be toggled at runtime via `?demo=true` URL param.

In demo mode, the dashboard runs entirely client-side using a simulation engine (`libs/demo-data/`). No backend needed — the engine generates realistic agent/task data.

### Agent Hierarchy

Agents have levels (L1-L10) determining their authority. Higher-level agents can assign tasks to lower-level ones. The orchestrator pattern (L9-L10) manages overall coordination.

### Agent Spawning

`openspawn start` launches the Python coordinator which spawns Claude Code CLI subprocesses. Key config fields:

- `spawning.maxConcurrentAgents` — concurrency cap for active agent processes
- `spawning.idleTimeoutSeconds` — auto-terminate idle agents
- `runtime.mode` — `local` or `deployed`
- `runtime.database` — `sqlite` or `postgresql`

### Two-Tier Deployment Model

| Concern    | Tier 1 (Local)        | Tier 2 (Deployed)      |
| ---------- | --------------------- | ---------------------- |
| Database   | SQLite                | PostgreSQL 16          |
| Background | asyncio scheduler     | arq + Redis            |
| Docker     | Not required          | Required               |
| Entry      | `npx openspawn start` | Docker Compose + Caddy |

Local mode needs only Python (uv) and Node — no Docker, no Redis, no PostgreSQL.

## Authentication

Auth enforcement is configurable via `AUTH_MODE` env var (or `openspawn.config.json`):

| Mode    | Default for       | Dashboard | API endpoints                       |
| ------- | ----------------- | --------- | ----------------------------------- |
| `none`  | `openspawn start` | Open      | All requests pass (synthetic owner) |
| `local` | opt-in            | Password  | Bearer token from login             |
| `full`  | `--deployed`      | JWT login | JWT + HMAC agent auth + API keys    |

In all modes, HMAC agent auth and `osp_` API keys still work when credentials are provided. The mode only controls what happens when _no_ credentials are sent.

Auth is enforced by two FastAPI dependencies:

- `require_auth()` — used by all resource routers (agents, tasks, memory, etc.)
- `get_auth_context()` — used by `/auth/*` endpoints (login flow)

Both respect `AUTH_MODE`.

## API Endpoints

All integration endpoints use the `/integrations/` prefix:

- `POST /integrations/github/webhook` — GitHub webhooks
- `GET/POST /integrations/github/connections` — GitHub connection management
- `POST /integrations/linear/webhook` — Linear webhooks
- `GET/POST /integrations/linear/connections` — Linear connection management

## Database

FastAPI models live in `apps/api/app/models/`. Alembic migrations in `apps/api/alembic/`.

Key entities: `Agent`, `Task`, `Message`, `CreditTransaction`, `Memory`, `Organization`.
