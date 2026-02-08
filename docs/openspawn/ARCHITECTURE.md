---
layout: default
title: Architecture - OpenSpawn
---

# OpenSpawn — Architecture Document

**Version:** 1.0  
**Date:** February 6, 2026  
**Status:** Pre-implementation

---

## System Overview

OpenSpawn is a monorepo containing four deployable services that share a PostgreSQL database. Agents interact primarily through an MCP server; humans interact through a React dashboard backed by GraphQL. All services are containerized and deployed via Coolify on a Hetzner CX32 VPS behind Tailscale.

```mermaid
flowchart TB
    subgraph Tailscale["🔒 Tailscale Mesh"]
        subgraph Agents["AI Agents"]
            OpenClaw["OpenClaw Agents"]
            External["External Agents"]
        end
        
        subgraph Core["Core Services"]
            MCP["🔌 MCP Server<br/>:3102"]
            API["⚡ NestJS API<br/>:3100"]
            GQL["GraphQL Resolvers"]
        end
        
        subgraph Data["Data Layer"]
            DB[("🗄️ PostgreSQL 16")]
        end
        
        subgraph UI["User Interface"]
            Dashboard["🖥️ React Dashboard"]
        end
        
        subgraph Observability["Observability"]
            LiteLLM["LiteLLM Proxy"]
            Langfuse["Langfuse"]
        end
    end
    
    OpenClaw -->|MCP| MCP
    External -->|REST| API
    MCP --> API
    API --> DB
    API --> GQL
    GQL -->|"WebSocket Sub"| Dashboard
    LiteLLM <-->|traces| Langfuse
```

## Service Boundaries

### 1. NestJS API (`api`) — Port 3100

The core backend. Owns all business logic, database access, and authorization.

**Responsibilities:**

- REST endpoints for agent operations (tasks, credits, messages, agents)
- GraphQL resolvers + subscriptions for dashboard
- HMAC signature validation middleware
- Idempotency key enforcement
- Event emission on all state changes
- Authorization (level-based + role-based)
- WebSocket gateway for real-time subscriptions

**Key NestJS Modules:**

- `AgentsModule` — agent registration, CRUD, capability management
- `TasksModule` — task lifecycle, dependencies, approval gates
- `CreditsModule` — credit transactions, balance queries, rate tables
- `MessagesModule` — channel management, message CRUD
- `EventsModule` — append-only event log, event queries
- `AuthModule` — HMAC validation, identity resolution
- `IdempotencyModule` — request deduplication

**Does NOT:**

- Directly interact with LLMs (that's LiteLLM's job)
- Serve static files (dashboard is separate container)
- Handle agent scheduling or orchestration

### 2. MCP Server (`mcp`) — Port 3102

The primary interface for AI agents. A TypeScript MCP server built with the `@modelcontextprotocol/sdk` that translates MCP tool calls into API requests.

**Responsibilities:**

- Expose MCP tools that agents discover and invoke
- Handle HMAC signing on behalf of the calling agent
- Translate MCP tool results into structured responses
- Provide tool descriptions optimized for LLM consumption

**MCP Tools Exposed:**

```
task_list        — Query tasks with filters (status, assignee, priority, tags)
task_create      — Create a new task with title, description, priority, tags
task_get         — Get task details including dependencies and history
task_transition  — Move task to new status (enforces workflow + approval gates)
task_assign      — Assign/reassign task to an agent
task_comment     — Add a comment to a task

credits_balance  — Check credit balance for self or org
credits_spend    — Deduct credits with reason and idempotency key
credits_history  — Query credit transaction history

message_send     — Send message to channel or agent
message_read     — Read messages from channel with pagination
message_channels — List available channels

agent_whoami     — Return current agent identity and permissions
agent_list       — List agents in the organization
```

**Does NOT:**

- Own business logic (delegates to API)
- Access database directly
- Handle authentication (passes agent credentials to API)

### 3. Dashboard (`dashboard`) — Port 3101

React SPA served by Nginx. Communicates exclusively with the API via GraphQL.

**Responsibilities:**

- Task board (Kanban view with drag-and-drop)
- Credit ledger and P&L visualization
- Agent activity feed (real-time via GraphQL subscriptions)
- Approval gate UI (approve/reject task transitions)
- Agent management (view/edit agents, capabilities)

**Tech Stack:**

- React 18+ with TypeScript
- GraphQL client (urql or Apollo)
- Tailwind CSS
- Vite build tooling
- Served by Nginx in production container

**Does NOT:**

- Call REST endpoints (GraphQL only)
- Authenticate agents (separate auth domain)
- Handle any business logic

### 4. LiteLLM Proxy (`litellm`) — Port 4000

Third-party LLM proxy that routes all model calls. Not custom code — configured via YAML.

**Responsibilities:**

- Route LLM calls to appropriate providers (Anthropic, OpenAI, etc.)
- Enforce per-agent spend limits
- Report cost data to Langfuse for tracing
- Model fallback chains

**Configuration:**

- Agents point their LLM calls at `http://litellm:4000`
- Langfuse tracing enabled via environment variables
- Virtual keys map to agent identities for spend tracking

### 5. Langfuse (`langfuse`) — Port 3200

Third-party LLM observability platform. Not custom code — deployed as a container.

**Responsibilities:**

- Trace every LLM call (prompt, completion, latency, tokens, cost)
- Provide dashboards for agent behavior analysis
- Capture agent reasoning context
- Enable agent performance evaluation

## Data Flow

### Agent Executes a Task Transition

```
1. Agent invokes MCP tool: task_transition(task_id, "review")
2. MCP server constructs REST request with HMAC signature
3. API AuthMiddleware validates HMAC signature → resolves agent identity
4. API IdempotencyMiddleware checks for duplicate request
5. TasksService validates:
   a. Task exists and belongs to agent's org
   b. Current status → "review" is a valid transition
   c. Agent has permission (level check)
   d. No approval gate blocks this transition
   e. All blocking dependencies are resolved
6. TasksService updates task status in DB (transaction)
7. EventsService creates event: { type: "task.transitioned", actor: agent_id, ... }
8. CreditsService awards credits if transition triggers earning rule:
   a. If transition is to "done": award task.done credits to assignee
   b. If task.created_by has management_fee_pct > 0: award mgmt_fee credits to creator
   c. Both use SELECT ... FOR UPDATE on agents row for atomic balance update
9. GraphQL subscription pushes update to connected dashboards
10. MCP server returns success to agent
```

### Credit Spend with Idempotency (Dynamic Pricing)

```
1. Agent makes LLM call through LiteLLM → LiteLLM logs actual cost
2. LiteLLM spend callback → OpenSpawn API: { agent_key, model, cost_usd, idempotency_key }
3. IdempotencyMiddleware checks idempotency_keys table:
   a. Key exists → return cached response (no duplicate charge)
   b. Key not found → proceed
4. CreditsService:
   a. Look up rate config for model (e.g., "model.opus", amount_mode: "dynamic")
   b. Compute debit: ceil(cost_usd * usd_to_credits_rate)
   c. SELECT current_balance FROM agents WHERE id = $agent_id FOR UPDATE
   d. Verify current_balance >= computed_debit
   e. Verify budget_period_spent + computed_debit <= budget_period_limit (if set)
   f. INSERT credit_transaction with litellm_cost_usd + computed amount
   g. UPDATE agents SET current_balance = current_balance - computed_debit
5. EventsService creates event: { type: "credit.spent", metadata: { model, cost_usd } }
6. IdempotencyMiddleware stores response with key (TTL: 24h)
```

## Authentication Model

### HMAC-Signed Requests (Phase 1)

Every agent request includes:

```
X-Agent-Id: builder
X-Timestamp: 2026-02-06T01:30:00Z
X-Nonce: a1b2c3d4
X-Signature: HMAC-SHA256(secret, "builder|2026-02-06T01:30:00Z|a1b2c3d4|POST|/tasks|{body}")
```

Server validates:

1. Timestamp within ±5 min (prevents replay)
2. Nonce not seen within window (prevents replay of intercepted request)
3. Signature matches recomputed HMAC (proves possession of secret)
4. Agent ID resolved → load permissions

**Trust Hierarchy:**

- Human operator bootstraps Talent Agent manually (single trust anchor)
- Talent Agent is sole entity that can register/revoke agents
- Signing secrets never leave the agent's machine
- Secrets stored in OpenClaw's isolated `agentDir` (sandbox enforced)

### Dashboard Auth (Phase 2 — Authentik)

- Human users authenticate via OAuth2/OIDC against Authentik
- Token scoped to organization
- Role-based access: admin, viewer
- Phase 1: dashboard behind Tailscale (implicit trust)

## Multi-Tenancy

Every entity includes an `org_id` foreign key. All queries are scoped by organization via NestJS middleware that injects org context from the authenticated agent's identity.

For Phase 1 (personal deployment), a single org exists. The schema supports multi-tenancy from day one to avoid a painful migration later.

## Technology Decisions

See `DECISIONS.md` for full rationale. Key choices:

| Decision            | Choice                  | Primary Reason                                                               |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| Backend framework   | NestJS                  | Module system, TypeORM integration, GraphQL support                          |
| ORM                 | TypeORM                 | AI training data density, first-party NestJS integration, active maintenance |
| Database            | PostgreSQL 16           | ACID for financial data, mature, Coolify native                              |
| Agent interface     | MCP server              | Framework-agnostic, emerging standard, rich tool descriptions                |
| Dashboard transport | GraphQL (code-first)    | Subscriptions, flexible queries, self-documenting                            |
| Agent transport     | REST                    | Lower overhead for agent CLI/MCP, simpler for AI to generate                 |
| LLM proxy           | LiteLLM                 | Verified spend, model routing, Langfuse integration                          |
| Observability       | Langfuse                | Agent reasoning capture, LiteLLM native support                              |
| Package management  | Monorepo (Nx)           | Shared types, coordinated deploys, single repo for AI agents                 |
| Linting             | Biome                   | 92x faster than ESLint/Prettier, single tool                                 |
| Deployment          | Coolify on Hetzner CX32 | Self-hosted, Docker-native, 8GB RAM headroom, 3.5x cheaper than DO           |
| Network             | Tailscale               | Zero-config VPN, mTLS, access from phone                                     |

## Docker Compose — Phase 1

```yaml
services:
  api:
    build: ./apps/api
    ports: ["3100:3100"]
    environment:
      DATABASE_URL: postgres://openspawn:${DB_PASS}@postgres:5432/openspawn
      NODE_ENV: production
    depends_on: [postgres]

  mcp:
    build: ./apps/mcp
    ports: ["3102:3102"]
    environment:
      API_URL: http://api:3100
    depends_on: [api]

  dashboard:
    build: ./apps/dashboard
    ports: ["3101:80"]
    depends_on: [api]

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports: ["4000:4000"]
    volumes:
      - ./config/litellm.yaml:/app/config.yaml
    environment:
      LANGFUSE_PUBLIC_KEY: ${LANGFUSE_PUBLIC_KEY}
      LANGFUSE_SECRET_KEY: ${LANGFUSE_SECRET_KEY}
      LANGFUSE_HOST: http://langfuse:3200

  langfuse:
    image: langfuse/langfuse:2
    ports: ["3200:3000"]
    environment:
      DATABASE_URL: postgres://langfuse:${LANGFUSE_DB_PASS}@postgres:5432/langfuse
      NEXTAUTH_SECRET: ${LANGFUSE_AUTH_SECRET}
      NEXTAUTH_URL: http://langfuse:3200
    depends_on: [postgres]

  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: openspawn
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: openspawn
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./config/init-langfuse-db.sql:/docker-entrypoint-initdb.d/init-langfuse.sql

volumes:
  pgdata:
```

## Phase 2 Service Additions (Coolify One-Click)

| Service           | Purpose                                | Port |
| ----------------- | -------------------------------------- | ---- |
| N8N               | Webhook orchestration                  | 5678 |
| Authentik         | Dashboard auth (OAuth2/OIDC)           | 9000 |
| Databasus         | PostgreSQL backups                     | 8080 |
| Grafana           | Operational monitoring                 | 3300 |
| Prometheus        | Metrics collection                     | 9090 |
| Sequin (evaluate) | Postgres CDC for event-driven patterns | 7376 |

## Error Handling Strategy

- All API errors return structured JSON: `{ error: string, code: string, details?: object }`
- HTTP status codes follow REST conventions (400, 401, 403, 404, 409, 422, 500)
- Idempotency failures return 409 Conflict with original response
- HMAC validation failures return 401 with no detail (prevent oracle attacks)
- Task transition violations return 422 with specific reason
- Credit insufficient balance returns 402 Payment Required
- All errors are logged as events with `error` severity

## Scaling Considerations

Phase 1 runs on a single CX32 (4 vCPU, 8GB RAM, 80GB NVMe, €6.80/mo). The architecture supports horizontal scaling:

- API is stateless — can run multiple instances behind a load balancer
- PostgreSQL connection pooling via PgBouncer if needed
- MCP server is stateless — one per agent host or shared
- Dashboard is static files — CDN-ready
- Event log is append-only — partitionable by org/date
- Credit transactions use row-level locks on `agents.current_balance` — no distributed coordination needed
- Credit ledger archivable after 90 days (materialized balance is authoritative)

Estimated Phase 1 resource usage:

- API: ~200MB RAM
- MCP: ~100MB RAM
- Dashboard (Nginx): ~50MB RAM
- LiteLLM: ~300MB RAM
- Langfuse: ~500MB RAM
- PostgreSQL: ~500MB RAM
- **Total: ~1.7GB** (CX32's 8GB provides comfortable headroom for spikes)

**Why CX32 over CX22:** The CX22 (4GB) fits the baseline estimate but leaves no room for PostgreSQL query caching, Langfuse trace ingestion spikes, or future service additions. At €6.80/mo vs €3.79/mo, the CX32 doubles RAM and CPU for $3.26 more — still 3-4x cheaper than equivalent DigitalOcean pricing.

**Why Hetzner over DigitalOcean:** Despite DO having a Toronto datacenter closer to Nova Scotia, Hetzner's Ashburn DC is similar distance (~1400km vs ~1500km). Behind Tailscale, DC location barely matters for latency. Hetzner's CX32 at €6.80/mo vs DO's comparable 4GB droplet at ~$24/mo is a 3.5x price difference. Hetzner also includes 20TB transfer vs DO's shared pool.

### Founding Agent Resource Profile

The founding agent runs Opus (the most capable and expensive model). Its operational cost profile differs from worker agents:

- **Higher per-call cost:** Opus is ~10x Sonnet per token
- **Lower call volume:** Strategic decisions, not implementation — fewer but more consequential calls
- **Earning model:** Management fees (20% of delegated task completions) + delegation credits + review credits
- **Break-even target:** Founder should earn enough from management fees to cover its Opus operational costs
