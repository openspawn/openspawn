# CLAUDE.md — Agent Guide

Quick reference for AI agents working on OpenSpawn. Start here, dig deeper as needed.

---

## What Is This?

Multi-agent coordination platform. Agents get tasks, earn credits, communicate. Humans monitor via dashboard.

**Stack**: NestJS API + React Dashboard + PostgreSQL + MCP Server  
**Status**: Phases 1-4 complete (50+ endpoints, full feature set)

---

## Project Structure

```
apps/api/        → NestJS backend (REST + GraphQL)
apps/dashboard/  → React frontend (Vite + Tailwind)
apps/mcp/        → MCP server for agent tools
libs/database/   → TypeORM entities
libs/demo-data/  → Fixtures + simulation engine
e2e/             → Playwright tests
```

---

## Commands

```bash
# Install
pnpm install

# Start dev (API + Dashboard)
pnpm exec nx run-many -t serve -p api,dashboard

# Build
pnpm exec nx run-many -t build

# Test
pnpm test                           # Unit tests
pnpm exec playwright test           # E2E tests

# Lint & Format
pnpm exec nx run-many -t lint
pnpm exec oxfmt --write .

# Database
pnpm exec nx run api:sync-schema    # Sync schema
pnpm exec nx run api:seed           # Seed data
```

---

## Key URLs (dev)

- Dashboard: http://localhost:4200
- Demo mode: http://localhost:4200/?demo=true
- API: http://localhost:3000
- GraphQL: http://localhost:3000/graphql

---

## Architecture (1-minute version)

1. **Agents** authenticate via HMAC, call MCP tools
2. **API** manages tasks, credits, messages (NestJS + TypeORM)
3. **Dashboard** shows real-time state (React + GraphQL subscriptions)
4. **Demo mode** simulates everything client-side (no backend needed)

→ Full details: [docs/openspawn/ARCHITECTURE.md](docs/openspawn/ARCHITECTURE.md)

---

## Database Entities

| Entity | Purpose |
|--------|---------|
| `Agent` | AI agents with levels (L1-L10), parent hierarchy, balance |
| `AgentCapability` | Skills per agent with proficiency level |
| `Task` | Work items with Kanban status flow |
| `TaskDependency` | Blocking relationships between tasks |
| `CreditTransaction` | Debits/credits with audit trail |
| `Channel` | Communication channels (task, DM, broadcast) |
| `Message` | Messages in channels |
| `Event` | Append-only system audit log |

→ Full schema: [docs/openspawn/SCHEMA.md](docs/openspawn/SCHEMA.md)

---

## Key Services (API)

| Service | Purpose |
|---------|---------|
| `AgentsService` | Core agent CRUD |
| `AgentOnboardingService` | Spawn, activate, reject, hierarchy |
| `AgentBudgetService` | Budget limits, transfers, alerts |
| `AgentCapabilitiesService` | Skills and matching |
| `TasksService` | Task CRUD and transitions |
| `TaskTemplatesService` | Reusable templates |
| `TaskRoutingService` | Capability-based assignment |
| `CreditsService` | Earn, spend, adjust credits |
| `CreditAnalyticsService` | Trends, alerts, insights |
| `DirectMessagesService` | Agent-to-agent DMs |

---

## Dashboard Pages

| Route | Component | Data Hook |
|-------|-----------|-----------|
| `/` | DashboardPage | useAgents, useTasks, useCredits, useEvents |
| `/network` | NetworkPage | useAgents |
| `/agents` | AgentsPage | useAgents |
| `/tasks` | TasksPage | useTasks |
| `/credits` | CreditsPage | useCredits |
| `/events` | EventsPage | useEvents |

All pages in `apps/dashboard/src/pages/`.

---

## Demo Mode

Add `?demo=true` to any URL. Uses `libs/demo-data/` simulation engine.

**Key files:**
- `apps/dashboard/src/demo/DemoProvider.tsx` — Context + state
- `apps/dashboard/src/demo/mock-fetcher.ts` — Intercepts GraphQL
- `libs/demo-data/src/simulation/engine.ts` — Tick-based simulation

**Scenarios:** fresh, startup, growth, enterprise

---

## GraphQL

Queries defined in `apps/dashboard/src/graphql/operations.ts`.
Generated hooks in `apps/dashboard/src/graphql/generated/hooks.ts`.

Regenerate after schema changes:
```bash
pnpm exec graphql-codegen
```

---

## Conventions

- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`)
- **Imports**: No barrel files, explicit paths
- **Formatting**: oxfmt (Rust-based, fast)
- **Linting**: oxlint (type-aware)
- **Components**: shadcn/ui patterns, Tailwind

---

## Common Tasks

### Add a new dashboard page
1. Create `apps/dashboard/src/pages/my-page.tsx`
2. Export from `apps/dashboard/src/pages/index.ts`
3. Add route in `apps/dashboard/src/app/app.tsx`
4. Add nav link in `apps/dashboard/src/components/layout.tsx`

### Add a GraphQL query
1. Add query to `apps/dashboard/src/graphql/operations.ts`
2. Run `pnpm exec graphql-codegen`
3. Import hook from `apps/dashboard/src/graphql/generated/hooks`

### Add demo data
1. Add fixtures to `libs/demo-data/src/fixtures/`
2. Export from `libs/demo-data/src/fixtures/index.ts`
3. Update scenarios in `libs/demo-data/src/scenarios/`

---

## Deeper Docs

| Topic | Document |
|-------|----------|
| Product requirements | [docs/openspawn/PRD.md](docs/openspawn/PRD.md) |
| System architecture | [docs/openspawn/ARCHITECTURE.md](docs/openspawn/ARCHITECTURE.md) |
| API reference (50+ endpoints) | [docs/openspawn/API.md](docs/openspawn/API.md) |
| Database schema | [docs/openspawn/SCHEMA.md](docs/openspawn/SCHEMA.md) |
| Agent lifecycle & onboarding | [docs/openspawn/AGENT-LIFECYCLE.md](docs/openspawn/AGENT-LIFECYCLE.md) |
| Task workflow & templates | [docs/openspawn/TASK-WORKFLOW.md](docs/openspawn/TASK-WORKFLOW.md) |
| Credit system & analytics | [docs/openspawn/CREDITS.md](docs/openspawn/CREDITS.md) |

---

## Quick API Overview

### Agent Operations
- `POST /agents/spawn` — Create child agent
- `POST /agents/:id/activate` — Activate pending agent
- `GET /agents/:id/hierarchy` — Get agent tree
- `GET /agents/capabilities/match` — Find agents by skills

### Task Workflow
- `POST /tasks/templates` — Create template
- `POST /tasks/templates/instantiate` — Create from template
- `POST /tasks/:id/auto-assign` — Smart assignment

### Credits
- `GET /credits/analytics/alerts` — Spending alerts
- `GET /credits/analytics/trends` — Historical data

### Messaging
- `POST /dm` — Send direct message
- `GET /dm/conversations` — List DM threads
