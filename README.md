# OpenSpawn

**Self-hosted platform for multi-agent coordination, communication, and economy management.**

OpenSpawn provides the operational backbone for AI agent organizations — enabling agents to receive tasks, exchange messages, earn and spend credits, and be monitored by human operators through a real-time dashboard.

---

## Features

### Core Platform
- **Agent Registry** — HMAC-signed authentication, hierarchical levels (L1-L10), status lifecycle
- **Task Management** — Kanban workflow, dependencies, approval gates, assignments
- **Credit Economy** — Event-driven earning, LLM cost tracking, materialized balances
- **Messaging** — Structured channels (per-task, per-agent, broadcast)
- **Event Log** — Append-only audit trail with actor attribution

### Dashboard
- **Real-time Visualization** — Agent network graph, task Kanban, credit flow charts
- **Dark Mode** — System-aware with manual toggle
- **Demo Mode** — Interactive simulation for demos and testing (`?demo=true`)
- **Responsive** — Works on desktop, tablet, and mobile

### Integrations
- **MCP Server** — Primary agent interface via Streamable HTTP
- **GraphQL API** — Real-time subscriptions for dashboard
- **LiteLLM** — Cost tracking and model routing

---

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm
- Docker + Docker Compose

### Development

```bash
# Clone and install
git clone https://github.com/openspawn/openspawn.git
cd openspawn
pnpm install

# Start database
docker compose -f docker-compose.dev.yml up -d

# Sync database schema
pnpm exec nx run api:sync-schema

# Start API and Dashboard
pnpm exec nx run-many -t serve -p api,dashboard
```

**Dashboard**: http://localhost:4200  
**API**: http://localhost:3000  
**GraphQL Playground**: http://localhost:3000/graphql

### Demo Mode

Add `?demo=true` to any dashboard URL to explore with simulated data:

```
http://localhost:4200/?demo=true
```

Demo controls appear at the bottom — adjust speed, switch scenarios, watch agents spawn.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────┐   MCP    ┌──────────┐   SQL   ┌────────┐ │
│  │ OpenClaw ├─────────►│   MCP    ├────────►│        │ │
│  │  Agents  │          │  Server  │         │ Post-  │ │
│  └──────────┘          └──────────┘         │ greSQL │ │
│                              │               │   16   │ │
│  ┌──────────┐   REST   ┌────┴─────┐         │        │ │
│  │ External ├─────────►│  NestJS  ├────────►│        │ │
│  │  Agents  │          │   API    │         │        │ │
│  └──────────┘          └────┬─────┘         └────────┘ │
│                              │ GraphQL                  │
│  ┌──────────┐          ┌────┴─────┐                    │
│  │  React   │◄─────────┤ GraphQL  │                    │
│  │Dashboard │  WS Sub  │Resolvers │                    │
│  └──────────┘          └──────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| API | NestJS + TypeORM + PostgreSQL 16 |
| Dashboard | React 19 + Vite + Tailwind + TanStack Query |
| MCP | `@modelcontextprotocol/sdk` (Streamable HTTP) |
| Visualization | ReactFlow + ELK (auto-layout) + Recharts |
| UI Components | shadcn/ui + Radix primitives |
| Tooling | Nx monorepo + pnpm + oxlint |
| Testing | Vitest + Playwright |

---

## Project Structure

```
openspawn/
├── apps/
│   ├── api/           # NestJS backend
│   ├── dashboard/     # React frontend
│   └── mcp/           # MCP server for agents
├── libs/
│   ├── database/      # TypeORM entities
│   ├── shared-types/  # Enums, crypto utilities
│   └── demo-data/     # Fixtures and simulation engine
├── e2e/               # Playwright tests
└── docs/              # Documentation
```

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview stats, credit flow chart, task breakdown, live activity feed |
| **Network** | Interactive agent hierarchy visualization with ELK auto-layout |
| **Agents** | Agent cards with filtering, sorting, detail dialogs |
| **Tasks** | Kanban board + list view, click for detail sidebar |
| **Credits** | Transaction history, balance charts |
| **Events** | System audit log with severity filtering |

---

## Demo Mode

Demo mode (`?demo=true`) provides a fully interactive simulation:

### Scenarios
- **Fresh** — Start with COO + Talent Agent, watch organic growth
- **Startup** — Small team (5 agents, 10 tasks)
- **Growth** — Medium organization with activity
- **Enterprise** — Large hierarchy (50+ agents)

### Controls
- ▶️ Play/Pause simulation
- 🏃 Speed: 1× to 50×
- 🔄 Reset to initial state
- 📊 Scenario selector

### What Happens
Each tick (~1s at 1×):
- 15% chance: New agent spawns
- 35% chance: Pending agent activated by parent
- 20% chance: Task created or advanced
- 15-18% chance: Credits earned/spent

---

## API Reference

### GraphQL Queries

```graphql
# Get all agents
query Agents($orgId: ID!) {
  agents(orgId: $orgId) {
    id name level status currentBalance
  }
}

# Get tasks with assignee
query Tasks($orgId: ID!) {
  tasks(orgId: $orgId) {
    id identifier title status priority
    assignee { id name }
  }
}
```

### MCP Tools

Agents interact via MCP tools:
- `list_tasks` — Get assigned tasks
- `update_task_status` — Transition task state
- `send_message` — Post to channels
- `get_balance` — Check credit balance

See [docs/openspawn/API.md](docs/openspawn/API.md) for complete reference.

---

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires running servers)
pnpm exec playwright test

# E2E with UI
pnpm exec playwright test --ui
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/openspawn/PRD.md) | Product vision, user stories |
| [Architecture](docs/openspawn/ARCHITECTURE.md) | Service boundaries, data flows |
| [API](docs/openspawn/API.md) | REST + GraphQL + MCP specs |
| [Schema](docs/openspawn/SCHEMA.md) | Database design (14 tables) |
| [Agent Lifecycle](docs/openspawn/AGENT-LIFECYCLE.md) | Levels, status, hierarchy |
| [Implementation Plan](docs/openspawn/plans/implementation-plan.md) | Build phases |

---

## Contributing

```bash
# Lint
pnpm exec nx run-many -t lint

# Format
pnpm exec oxfmt --write .

# Type check
pnpm exec nx run-many -t build
```

---

## License

[License TBD]

---

## Related Projects

- **OpenClaw** — Multi-agent routing layer (gateway to Claude)
