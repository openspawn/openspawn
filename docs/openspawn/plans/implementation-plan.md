# BikiniBottom — Implementation Plan

**Product**: Self-hosted platform for multi-agent coordination, communication, and economy management
**Repo**: `github.com/openspawn/openspawn`
**npm scope**: `@openspawn/*`
**Stack**: Nx + pnpm + NestJS + TypeORM + PostgreSQL 16 + MCP (Streamable HTTP) + React + Vite + Tailwind + urql + Apollo GraphQL (code-first) + Biome + Vitest + Docker

---

## Reference Docs

This is a concise implementation guide. For full context, see:

- **PRD**: `../PRD.md` — product vision, user stories, success metrics
- **Architecture**: `../ARCHITECTURE.md` — service boundaries, data flows, scaling
- **API**: `../API.md` — complete REST + GraphQL + MCP tool specs
- **Schema**: `../SCHEMA.md` — all 14 tables, indexes, constraints, conventions

---

## PR 1: Scaffold + Database (`feature/scaffold`)

### Step 1 — Nx Workspace Init

```
npx create-nx-workspace@latest openspawn --preset=ts --packageManager=pnpm --nxCloud=skip
```

**Create apps:**

- `apps/api/` — NestJS (`nx g @nx/nest:app api`)
- `apps/mcp/` — Manual Express + MCP SDK
- `apps/dashboard/` — React (`nx g @nx/react:app dashboard --bundler=vite`)

**Create libs:**

- `libs/shared-types/` — Enums, DTOs, interfaces, crypto utils
- `libs/database/` — TypeORM entities, migrations, DataSource config

**Root configs:**

- `biome.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `docker-compose.yml`, `docker-compose.dev.yml`

### Step 2 — String Enums (`libs/shared-types/src/enums/`)

| File                     | Values                                                       |
| ------------------------ | ------------------------------------------------------------ |
| `agent-role.enum.ts`     | WORKER, HR, FOUNDER, ADMIN                                   |
| `agent-status.enum.ts`   | ACTIVE, SUSPENDED, REVOKED                                   |
| `task-status.enum.ts`    | BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED, CANCELLED |
| `task-priority.enum.ts`  | URGENT, HIGH, NORMAL, LOW                                    |
| `credit-type.enum.ts`    | CREDIT, DEBIT                                                |
| `message-type.enum.ts`   | TEXT, HANDOFF, STATUS_UPDATE, REQUEST                        |
| `channel-type.enum.ts`   | TASK, AGENT, BROADCAST, GENERAL                              |
| `event-severity.enum.ts` | INFO, WARNING, ERROR                                         |
| `amount-mode.enum.ts`    | FIXED, DYNAMIC                                               |
| `proficiency.enum.ts`    | BASIC, STANDARD, EXPERT                                      |

### Step 3 — TypeORM Entities (`libs/database/src/entities/`)

14 entity files mapping 1:1 to SCHEMA.md tables:
`organization`, `agent`, `agent-capability`, `task`, `task-dependency`, `task-tag`, `task-comment`, `credit-transaction`, `credit-rate-config`, `channel`, `message`, `event`, `idempotency-key`, `nonce`

Key details:

- All UUIDs via `@PrimaryGeneratedColumn('uuid')` except `nonce` (varchar PK)
- All tables have `org_id` FK except `organizations`
- `agent.hmac_secret_enc` → `bytea` (Buffer)
- `agent.current_balance` → integer, atomically updated with ledger
- `credit_transaction` + `event` — append-only (no UpdateDateColumn/DeleteDateColumn)
- `@Check` constraints: agent level (1-10), management_fee_pct (0-50), credit_transaction amount (>0)
- Task identifier auto-increment: `next_task_number` integer column on `organizations` (avoids MAX() scan)

### Step 4 — DataSource + Migration

- `libs/database/src/data-source.ts` — factory reading `DATABASE_URL` env
- `libs/database/src/data-source.cli.ts` — CLI entrypoint for typeorm commands
- Generate initial migration creating all 14 tables in single transaction

### Step 5 — Seed Command

`apps/api/src/commands/seed.command.ts` — standalone NestJS CLI command (`npx openspawn seed`)

1. Create org (name + slug configurable via args, default task prefix "TASK")
2. Generate HMAC secret → encrypt with AES-256-GCM (`ENCRYPTION_KEY` env)
3. Create Talent Agent: `agent_id: "talent"`, `role: hr` (enum value), `level: 10`, `model: opus`, `management_fee_pct: 20`
4. Seed 9 default `credit_rate_configs` (from SCHEMA.md)
5. Create `#general` channel
6. Emit `agent.registered` event
7. Print plaintext secret to stdout ONCE

### Step 6 — Docker Compose + Env

- `docker-compose.yml` — postgres, api, mcp, dashboard, litellm, langfuse (from ARCHITECTURE.md)
- `docker-compose.dev.yml` — bind mounts, hot reload, debug ports
- `.env.example` — all vars documented
- `config/litellm.yaml`, `config/init-langfuse-db.sql`
- Dockerfiles: `apps/api/Dockerfile`, `apps/mcp/Dockerfile`, `apps/dashboard/Dockerfile` + `nginx.conf`

---

## PR 2: Auth + Events (`feature/auth-core`)

### Step 7 — Crypto Utils (`libs/shared-types/src/crypto/`)

- `generateSigningSecret()` — crypto.randomBytes(32).hex
- `computeSignature(secret, message)` — HMAC-SHA256
- `encryptSecret(plaintext, key)` / `decryptSecret(encrypted, key)` — AES-256-GCM

### Step 8 — Auth Module (`apps/api/src/auth/`)

Files: `auth.module.ts`, `auth.guard.ts`, `auth.service.ts`, `decorators/current-agent.decorator.ts`, `decorators/roles.decorator.ts`, `decorators/public.decorator.ts`

Guard flow (global via APP_GUARD):

1. Extract `X-Agent-Id`, `X-Timestamp`, `X-Nonce`, `X-Signature`
2. Reject if timestamp outside ±300s
3. Lookup agent by agent_id, reject if not active
4. Decrypt secret, recompute HMAC, constant-time compare
5. Insert nonce (ON CONFLICT → reject replay)
6. Attach `AuthenticatedAgent` to request

### Step 9 — Org-Scoping Middleware

`apps/api/src/common/middleware/org-scope.middleware.ts` — attaches `orgId` from authenticated agent to request. All services accept `orgId` param.

### Step 10 — Idempotency Interceptor

`apps/api/src/common/interceptors/idempotency.interceptor.ts` — global NestJS interceptor on mutations. Checks `X-Idempotency-Key`, returns cached response or caches new response (24h TTL).

### Step 11 — Cleanup Cron

`apps/api/src/common/tasks/cleanup.task.ts` — `@nestjs/schedule` cron every 10min. Deletes expired nonces + idempotency keys.

### Step 12 — Events Module (`apps/api/src/events/`)

Files: `events.module.ts`, `events.service.ts`, `events.controller.ts`, DTOs

- `emit(orgId, type, actorId, entityType, entityId, data, severity?, reasoning?)` — inserts event + publishes to `EventEmitter2`
- `GET /events` — read-only paginated query (type/actor/entity/date filters)
- Built early because every subsequent module calls `eventsService.emit()`

### Step 13 — Global Error Filter

`apps/api/src/common/filters/http-exception.filter.ts` — all errors return `{ error: string, code: string, details?: object }`. HMAC failures return 401 with no detail.

---

## PR 3: Agents + Tasks (`feature/agents-tasks`)

### Step 14 — Agents Module (`apps/api/src/agents/`)

Files: `agents.module.ts`, `agents.service.ts`, `agents.controller.ts`, DTOs

Endpoints:

- `POST /agents/register` — `@Roles(AgentRole.HR)` only (Talent Agent exclusive)
- `GET /agents`, `GET /agents/:id` — any active agent
- `PATCH /agents/:id` — Talent Agent only
- `POST /agents/:id/revoke` — Talent Agent only
- `GET /agents/:id/credits/balance`

Key: `register()` generates secret, encrypts, stores, emits event, returns secret ONCE.

### Step 15 — Tasks Module (`apps/api/src/tasks/`)

Files: `tasks.module.ts`, `tasks.service.ts`, `tasks.controller.ts`, `task-transition.service.ts`, `task-identifier.service.ts`, DTOs

**Transition map** (enforced in `task-transition.service.ts`):

```
backlog    → todo, cancelled
todo       → in_progress, blocked, cancelled
in_progress → review, blocked, cancelled
review     → done (may require approval), in_progress, cancelled
blocked    → todo, in_progress, cancelled
done       → (terminal)
cancelled  → (terminal)
```

**Identifier service**: reads `organizations.next_task_number`, increments atomically, formats as `{prefix}-{number}`.

**Transition validation**:

1. Check transition map → 422
2. Check blocking dependencies all `done` → 409
3. Check approval gate if `review → done` and `approval_required` → 403
4. Update status, set `completed_at` if done
5. Emit `task.transitioned`
6. Trigger credit earning if → done

**Circular dependency detection**: BFS on `task_dependencies` before inserting new edge.

Endpoints: `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `POST /tasks/:id/transition`, `POST /tasks/:id/approve`, `POST /tasks/:id/assign`, `POST /tasks/:id/dependencies`, `DELETE /tasks/:id/dependencies/:depId`, `POST /tasks/:id/comments`, `GET /tasks/:id/comments`

---

## PR 4: Credits + Messaging (`feature/credits-messaging`)

### Step 16 — Credits Module (`apps/api/src/credits/`)

Files: `credits.module.ts`, `credits.service.ts`, `credits.controller.ts`, `credit-earning.service.ts`, `budget-reset.task.ts`, DTOs

**Core atomic transaction** (`credits.service.ts`):

```
BEGIN → SELECT ... FOR UPDATE on agent row → check balance/budget → INSERT credit_transaction → UPDATE agent.current_balance → COMMIT
```

Strict enforcement: balance can never go negative.

**Credit earning** (`credit-earning.service.ts`):

- `@OnEvent('task.transitioned')`: if → done, award `task.done` credits to assignee
- Management fee: if task creator has `management_fee_pct > 0`, award `floor(amount * pct / 100)` to creator
- Delegation credits: if creator !== assignee, award `task.delegated` credits
- All reference `source_task_id` for audit

**LiteLLM callback**: `POST /credits/litellm-callback` — receives cost, computes dynamic debit via rate config, enforces idempotency.

**Budget reset cron**: daily midnight UTC, resets `budget_period_spent = 0` for agents whose period elapsed, emits `credit.budget_reset`.

Endpoints: `GET /credits/balance`, `POST /credits/spend`, `GET /credits/history`, `POST /credits/adjust` (admin), `POST /credits/litellm-callback` (internal)

### Step 17 — Messaging Module (`apps/api/src/messages/`)

Files: `messages.module.ts`, `messages.service.ts`, `channels.service.ts`, `messages.controller.ts`, DTOs

- Auto-create task channel on task creation
- Threaded conversations via `parent_message_id`
- Types: text, handoff, status_update, request

Endpoints: `POST /channels`, `GET /channels`, `POST /messages`, `GET /messages`

---

## PR 5: GraphQL + MCP (`feature/graphql-mcp`)

### Step 18 — GraphQL Layer (`apps/api/src/graphql/`)

- `graphql.module.ts` — Apollo Driver, code-first, `graphql-ws` subscriptions
- Object types in `types/` (separate from entities)
- Resolvers in `resolvers/` — delegate to services
- PubSub provider (in-memory Phase 1) — EventsService publishes on every emit
- Subscriptions: TASK_UPDATED, CREDIT_TRANSACTION_CREATED, EVENT_CREATED, MESSAGE_CREATED
- Dashboard auth Phase 1: Tailscale implicit (no-op guard)

### Step 19 — MCP Server (`apps/mcp/`)

- `main.ts` — Express + `StreamableHTTPServerTransport`
- `server.ts` — McpServer instance
- `tools/task-tools.ts` — task_list, task_create, task_get, task_transition, task_assign, task_comment
- `tools/credit-tools.ts` — credits_balance, credits_spend, credits_history
- `tools/message-tools.ts` — message_send, message_read, message_channels
- `tools/agent-tools.ts` — agent_whoami, agent_list
- `api-client.ts` — HTTP client wrapping NestJS API calls
- `hmac-signer.ts` — signs requests with agent credentials

Agent identity via env vars or per-session headers. Stateless per-request for Phase 1.

---

## PR 6: Dashboard (`feature/dashboard`)

### Step 20 — React Dashboard (`apps/dashboard/`)

- urql client with WS subscriptions
- Pages: tasks (Kanban), agents, credits (P&L + ledger), events (activity feed)
- Components: task-card, kanban-board, agent-card, credit-ledger-table, approval-dialog, layout (sidebar, header)
- Hooks: use-tasks, use-agents, use-credits, use-events
- GraphQL documents in `graphql/` (queries, mutations, subscriptions)
- No barrel files. Event handlers above render. Tailwind styling.

---

## Testing Strategy

| Layer       | Tool                    | Focus                                                                                   | Location                     |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| Unit        | Vitest                  | Services: transition map, credit math, HMAC validation, mgmt fee calc                   | `*.spec.ts` co-located       |
| Integration | Vitest + testcontainers | Credit atomicity (concurrent spends), idempotency replay, nonce replay, cycle detection | `apps/api/test/integration/` |
| E2E         | Vitest + Supertest      | Full task lifecycle, agent registration, auth rejection                                 | `apps/api/test/e2e/`         |
| MCP         | Vitest                  | Tool calls → API → DB round-trip                                                        | `apps/mcp/test/`             |

Test utilities: `libs/database/src/test-utils/` — org/agent factories, request signer helper.

---

## Verification

After each PR, verify:

1. `pnpm nx run-many --target=build --all` — all apps build
2. `pnpm nx run-many --target=lint --all` — Biome passes
3. `pnpm nx run-many --target=test --all` — tests pass
4. `docker compose up` — all services start and health check
5. PR 2+: seed command creates org + talent agent
6. PR 3+: HMAC-signed requests accepted, unsigned rejected
7. PR 4+: full task lifecycle via REST → credits awarded
8. PR 5+: MCP tools callable, GraphQL queries return data
9. PR 6: dashboard loads, Kanban renders, subscriptions update

---

## Decisions Made

- **Task ID sequence**: `next_task_number` column on `organizations` (not MAX() scan)
- **Dashboard auth Phase 1**: Tailscale implicit (no auth code)
- **LiteLLM callback auth**: shared secret via env var on internal endpoint
- **Nonces**: Postgres Phase 1, Redis optimization Phase 2
- **Rate configs**: immutable — append new with `active: true`, deactivate old with `active: false`
- **Budget period**: org-level default with per-agent override (fields already on agent)
- **MCP sessions**: stateless per-request Phase 1
- **Task comments**: editable (has updated_at)
- **Talent Agent agent_id**: `talent`
- **Test runner**: Vitest (faster, native ESM, Vite-aligned)
