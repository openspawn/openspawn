# API Rewrite Plan — Lane 1

## Context

OpenSpawn is migrating from NestJS (TypeScript) to FastAPI (Python). Full design: `docs/rfcs/0001-memory-system/README.md`. Epic: #519.

## Goal

Port all existing NestJS API endpoints to FastAPI with identical behavior. Same Postgres schema, same REST routes, same response shapes.

## Issue Order (sequential, each PR builds on prior)

### 1. #525 — FastAPI scaffold + tooling

Create Python project in `apps/api-py/` (keep `apps/api/` NestJS until fully replaced).

- `uv` as package manager, `pyproject.toml`
- FastAPI app entry with CORS, middleware
- `pydantic-settings` config (BaseSettings + .env)
- `ruff` config, `pyright` config
- `pytest` + `pytest-asyncio` setup
- `structlog` logging
- `asyncpg` connection pool
- `GET /health` endpoint
- Verify: `uv run pytest`, `ruff check`, `pyright`, dev server starts

### 2. #526 — SQLAlchemy models

Port all 25+ TypeORM entities from `libs/database/src/entities/` to SQLAlchemy 2.0 async models in `apps/api-py/models/`.

Key entities: Agent, AgentCapability, Task, TaskDependency, TaskTag, TaskComment, CreditTransaction, CreditRateConfig, Channel, Message, Event, Organization, User, ApiKey, RefreshToken, Nonce, IdempotencyKey, ConsensusRequest, ConsensusVote, Escalation, ReputationEvent, Webhook, InboundWebhookKey, GitHubConnection, LinearConnection, IntegrationLink.

**Critical:** Same table names, column names (snake_case), indexes, constraints, FKs. Use `mapped_column()` with type annotations. Recreate all enums from `libs/shared-types/src/enums/` as Python string enums.

Reference files:
- `libs/database/src/entities/*.entity.ts` (all entity definitions)
- `libs/shared-types/src/enums/*.enum.ts` (all enum definitions)

### 3. #527 — Alembic setup

- `alembic init` with async support
- Connect to existing Postgres, stamp current schema as baseline
- `alembic check` should show no drift
- No destructive migrations — existing prod data must be safe

### 4. #528 — Auth middleware

Port from `apps/api/src/auth/`.

- HMAC signature verification for agent requests
- API key auth for dashboard/external clients
- FastAPI `Depends()` for injection
- Org-scoping middleware (extract org_id from auth context)
- `authlib`, `passlib`, `bcrypt`, `cryptography`
- `limits` library for rate limiting foundation

### 5. #529 — Core CRUD endpoints

Port from `apps/api/src/agents/`, `tasks/`, `credits/`, `messages/`, `events/`, `users/`.

- Same URL paths as NestJS
- Pydantic request/response models matching current JSON shapes
- Credit engine business logic must be exact (management fees, budget periods)
- Agent hierarchy rules preserved (L1-L10 authority)

Key reference files:
- `apps/api/src/*//*.controller.ts` (routes)
- `apps/api/src/*//*.service.ts` (business logic)

### 6. #530 — GitHub + Linear integrations

Port from `apps/api/src/github/`, `apps/api/src/linear/`, `apps/api/src/inbound-webhooks/`.

- Webhook handlers with signature verification
- Connection CRUD
- IntegrationProvider pattern preserved

### 7. #531 — MCP server (fastmcp)

Port from `apps/mcp/`.

- `fastmcp` standalone v3.1.0
- Port existing tools
- Stub memory tools (memory_store, memory_search, memory_list, memory_feedback)
- OTel instrumentation

## Libraries

```
# Core
fastapi, uvicorn, pydantic, pydantic-settings, python-dotenv, httpx, python-multipart

# Database
sqlalchemy[asyncio], alembic, asyncpg

# Auth
authlib, passlib, bcrypt, cryptography

# Observability
structlog, opentelemetry-sdk, opentelemetry-api, opentelemetry-exporter-otlp, logfire

# LLM (for MCP)
anthropic, openai, instructor, litellm

# MCP
fastmcp

# Resilience
tenacity, limits

# Testing
pytest, pytest-asyncio, pytest-cov, respx, factory-boy, hypothesis

# Utilities
pendulum, rich, typer

# Type checking / linting
ruff, pyright
```

## Conventions

- Scoped conventional commits: `feat(api): ...`, `fix(api): ...`
- One PR per issue
- Run `ruff format .` and `ruff check .` before finishing
- No `Any` types, no `# type: ignore` — find the correct type
- Python string enums (not Literal unions)
