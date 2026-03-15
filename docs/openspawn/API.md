# API Reference

FastAPI REST API at `apps/api/`. 117 endpoints across 12 domain groups. OpenAPI docs at `/docs`.

Base URL: `https://openspawn.ai/api/` (prod) | `http://localhost:8000` (dev)

## Authentication

All endpoints use `require_auth()`. Auth mode controlled by `AUTH_MODE` env var:

- `none` — all requests pass (synthetic owner context)
- `local` — bearer token from `/auth/login`
- `full` — JWT + HMAC agent auth + `osp_` API keys

## Endpoint Groups

### Auth (`/auth/*`) — 5 endpoints

`POST /login`, `POST /logout`, `POST /refresh`, `GET /me`, `GET /google`

### Agents (`/agents/*`) — 29 endpoints

CRUD, hierarchy, capabilities, reputation, budget, spawning, credits transfer.

Key: `POST /register`, `POST /spawn`, `GET /{id}/hierarchy`, `GET /leaderboard/trust`

### Tasks (`/tasks/*`) — 16 endpoints

CRUD, transitions, assignments, comments, dependencies, escalations, consensus.

Key: `POST /{id}/transition`, `POST /{id}/approve`, `POST /{id}/escalate`, `POST /consensus`

### Credits (`/credits/*`) — 8 endpoints

Balance, spending, history, analytics, rate configs.

### Messages (`/messages/*`, `/channels/*`, `/dm/*`) — 9 endpoints

Channels, send/read messages, DMs, threading.

### Artifacts (`/artifacts/*`) — 10 endpoints

Publish, subscribe, versioning, status transitions.

Key: `POST /` (publish), `POST /batch`, `PUT /{id}/status` (DRAFT→PUBLISHED for approval flow)

### Events (`/events/*`) — 4 endpoints

Event log queries, SSE stream, token issuance.

Key: `GET /stream` (SSE), `POST /token` (short-lived JWT for SSE auth)

### Integrations (`/integrations/*`) — 14 endpoints

GitHub and Linear webhook receivers + connection management.

### Memory (`/memory/*`) — 16 endpoints

Episodic/semantic memory storage, hybrid search, knowledge graph, contradictions.

### Coordination (`/coordination/*`) — 4 endpoints

| Method | Path                      | Purpose                                                                             |
| ------ | ------------------------- | ----------------------------------------------------------------------------------- |
| POST   | `/coordination/emit`      | Emit typed coordination event (component.created, test.written, etc.)               |
| POST   | `/coordination/subscribe` | Subscribe to events by pattern (exact, `prefix.*`, `*`)                             |
| POST   | `/coordination/replay`    | Replay past events for a task (catch-up after joining mid-stream)                   |
| GET    | `/coordination/project`   | Get derived state via projection (component_registry, test_coverage, artifact_view) |

**Emit body:** `{ event_type, payload, task_id, entity_name? }`
**Subscribe body:** `{ event_pattern, task_id? }`
**Replay body:** `{ task_id, since?, event_types[]?, limit: 500 }`
**Project query:** `?task_id=...&projection_type=component_registry|test_coverage|artifact_view`

### Approvals (`/approvals/*`) — 5 endpoints

| Method | Path                      | Purpose                                                           |
| ------ | ------------------------- | ----------------------------------------------------------------- |
| GET    | `/approvals`              | List approvals (filter by `?status=`, `?action_type=`, paginated) |
| GET    | `/approvals/pending`      | List pending approvals only                                       |
| GET    | `/approvals/{id}`         | Get single approval request                                       |
| POST   | `/approvals/{id}/approve` | Approve gated action (body: `{notes?}`)                           |
| POST   | `/approvals/{id}/reject`  | Reject gated action (body: `{notes}`, reason required)            |

**How gating works:**

1. Agent attempts action (task transition, artifact publish)
2. Gate checks: `risk_level > effective_autonomy`
3. If gated: task transitions return 403 with `{approval_id, risk_level, autonomy_level}`; artifact publish writes DRAFT status
4. Human/manager approves via `POST /approvals/{id}/approve`
5. For tasks: human performs the transition directly. For artifacts: `PUT /artifacts/{id}/status` transitions DRAFT→PUBLISHED

### Health (`/health*`) — 2 endpoints

`GET /health`, `GET /health/db`

## MCP Tools

45 tools organized by domain. All call REST endpoints via `ApiClient`.

| Domain       | Tools                                                                                                       | Count |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ----- |
| Tasks        | task_list, task_create, task_get, task_transition, task_assign, task_comment                                | 6     |
| Credits      | credits_balance, credits_spend, credits_history                                                             | 3     |
| Messages     | message_channels, message_send, message_read                                                                | 3     |
| Agents       | agent_list, agent_whoami                                                                                    | 2     |
| Trust        | trust_get_reputation, trust_get_history, trust_leaderboard, trust_bonus, trust_penalty                      | 5     |
| Escalation   | escalation_create, escalation_list, escalation_resolve, consensus_request, consensus_vote, consensus_status | 6     |
| Memory       | memory_store, memory_search, memory_list, memory_feedback                                                   | 4     |
| Graph        | memory_graph_entities, memory_graph_related, memory_graph_who_knows, memory_graph_gaps                      | 4     |
| Artifacts    | artifact_publish, artifact_get, artifact_list, artifact_subscribe, artifact_history                         | 5     |
| Coordination | coordination_emit, coordination_subscribe, coordination_replay, coordination_project                        | 4     |
| Approvals    | approval_request, approval_respond, approval_list                                                           | 3     |
