# 🏗️ Architecture

BikiniBottom is an Nx monorepo with a clear separation between API, dashboard, and shared libraries.

## Monorepo Structure

```
apps/
  api/            → NestJS backend (GraphQL + REST)
  dashboard/      → React 19 frontend (Vite + TailwindCSS v4)
  mcp/            → MCP server for AI tool integration
  cli/            → Command-line interface

libs/
  database/       → TypeORM entities, migrations, data source
  demo-data/      → Simulation engine, scenarios, fixtures
  shared-types/   → Shared TypeScript types and enums
  sdk/            → TypeScript SDK (@openspawn/sdk)

sdks/
  python/         → Python SDK (openspawn-py)

skills/
  openclaw/       → OpenClaw AgentSkill

docs/             → Feature docs, strategy, roadmap
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Framework | NestJS 11 |
| API Protocol | GraphQL (code-first) + REST |
| Database | PostgreSQL 16 + TypeORM |
| Frontend | React 19 + Vite |
| Styling | TailwindCSS v4 |
| Animations | framer-motion |
| Graph Viz | @xyflow/react (ReactFlow) |
| Build System | Nx |
| Linting | oxlint + oxfmt |
| Testing | Vitest |
| Language | TypeScript (strict, bundler resolution) |

## Key Patterns

### GraphQL (Code-First)
The API uses NestJS's code-first GraphQL approach. Types are defined as decorated classes in `apps/api/src/graphql/types/`, and resolvers in `apps/api/src/graphql/resolvers/`. Schema is auto-generated.

### Event-Driven Architecture
Internal events use NestJS's `@OnEvent` decorators for decoupled communication:
- Task lifecycle events trigger webhook notifications
- Integration sync (GitHub, Linear) listens for entity changes
- Telemetry records spans on task/agent events

### Integration Provider Interface
All external integrations (GitHub, Linear, future ones) implement `IntegrationProvider`:
```typescript
interface IntegrationProvider {
  processInboundWebhook(payload: any): Promise<void>;
  syncOutbound(event: string, data: any): Promise<void>;
}
```

### Demo Mode
The dashboard runs entirely client-side in demo mode using a simulation engine (`libs/demo-data/`). No backend needed — the engine generates realistic agent/task data and the mock fetcher intercepts GraphQL requests.

### Agent Hierarchy
Agents have levels (L1-L10) determining their authority. Higher-level agents can assign tasks to lower-level ones. The orchestrator pattern (L9-L10) manages overall coordination.

## API Endpoints

All integration endpoints use the `/integrations/` prefix:
- `POST /integrations/github/webhook` — GitHub webhooks
- `GET/POST /integrations/github/connections` — GitHub connection management
- `POST /integrations/linear/webhook` — Linear webhooks
- `GET/POST /integrations/linear/connections` — Linear connection management

## Database

Entities live in `libs/database/src/entities/`. Migrations are in `libs/database/src/migrations/`. The data source is configured in `libs/database/src/data-source.ts`.

Key entities: `Agent`, `Task`, `Message`, `CreditTransaction`, `Webhook`, `GitHubConnection`, `LinearConnection`, `IntegrationLink`.
