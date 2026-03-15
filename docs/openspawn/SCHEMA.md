# Database Schema

All models use `CompatUUID()` for UUID columns (native UUID on PostgreSQL, Text on SQLite). Migrations in `apps/api/alembic/versions/`.

## Core Entities

### Agent

AI agents with levels, hierarchy, and autonomy settings.

| Column                 | Type                    | Notes                                             |
| ---------------------- | ----------------------- | ------------------------------------------------- |
| id                     | UUID PK                 |                                                   |
| org_id                 | UUID FK → organizations |                                                   |
| agent_id               | String(100)             | unique per org                                    |
| name                   | String(255)             |                                                   |
| level                  | SmallInt (1-10)         | authority level                                   |
| default_autonomy_level | SmallInt (0-10)         | default 5, controls gate threshold                |
| model                  | String(100)             | LLM model (sonnet, opus)                          |
| status                 | String(20)              | pending/active/idle/busy/paused/suspended/revoked |
| role                   | String(50)              | worker/hr/founder/admin/lead/manager/intern       |
| mode                   | String(20)              | worker/orchestrator/observer                      |
| trust_score            | SmallInt (0-100)        | reputation, default 50                            |
| parent_id              | UUID FK → agents        | nullable, hierarchy                               |
| hmac_secret_enc        | LargeBinary             | encrypted HMAC secret                             |

### Task

Work items with Kanban status flow and optional autonomy override.

| Column            | Type                    | Notes                                                  |
| ----------------- | ----------------------- | ------------------------------------------------------ |
| id                | UUID PK                 |                                                        |
| org_id            | UUID FK → organizations |                                                        |
| identifier        | String(20)              | e.g. "T-42", unique per org                            |
| title             | String(500)             |                                                        |
| status            | String(20)              | backlog/todo/in_progress/review/done/blocked/cancelled |
| priority          | String(10)              | critical/urgent/high/normal/low                        |
| assignee_id       | UUID FK → agents        | nullable                                               |
| creator_id        | UUID FK → agents        |                                                        |
| parent_task_id    | UUID FK → tasks         | nullable, subtask hierarchy                            |
| approval_required | Boolean                 | manual approval override                               |
| autonomy_level    | SmallInt (0-10)         | nullable, overrides agent default                      |
| approved_by       | String(255)             | nullable                                               |
| approved_at       | DateTime                | nullable                                               |

### Organization

Tenant with settings.

| Column      | Type        | Notes            |
| ----------- | ----------- | ---------------- |
| id          | UUID PK     |                  |
| name        | String(255) |                  |
| slug        | String(100) | unique           |
| task_prefix | String(20)  | default "TASK"   |
| settings    | JSONB       | org-level config |

## Communication

### Channel

Communication channels scoped to org/task.

| Column  | Type            | Notes                        |
| ------- | --------------- | ---------------------------- |
| id      | UUID PK         |                              |
| org_id  | UUID FK         |                              |
| name    | String(255)     | unique per org               |
| type    | String(20)      | task/agent/broadcast/general |
| task_id | UUID FK → tasks | nullable                     |

### Message

Messages in channels.

| Column            | Type               | Notes                              |
| ----------------- | ------------------ | ---------------------------------- |
| id                | UUID PK            |                                    |
| org_id            | UUID FK            |                                    |
| channel_id        | UUID FK → channels |                                    |
| sender_id         | UUID FK → agents   |                                    |
| recipient_id      | UUID FK → agents   | nullable (DM)                      |
| type              | String(20)         | text/handoff/status_update/request |
| body              | Text               |                                    |
| parent_message_id | UUID FK → messages | nullable (threading)               |

## Events & Coordination

### Event

Append-only audit log for all system events.

| Column      | Type             | Notes                                     |
| ----------- | ---------------- | ----------------------------------------- |
| id          | UUID PK          |                                           |
| org_id      | UUID FK          |                                           |
| type        | String(100)      | SSEEventType value                        |
| actor_id    | UUID FK → agents |                                           |
| entity_type | String(50)       | e.g. "task", "artifact", "approval"       |
| entity_id   | UUID             | polymorphic reference                     |
| data        | JSONB            | event payload                             |
| severity    | String(10)       | debug/info/success/warning/error/critical |

### EventSubscription

Agent subscriptions to typed coordination events.

| Column        | Type             | Notes                                     |
| ------------- | ---------------- | ----------------------------------------- |
| id            | UUID PK          |                                           |
| org_id        | UUID FK          |                                           |
| agent_id      | UUID FK → agents |                                           |
| event_pattern | String(100)      | exact, `prefix.*`, or `*`                 |
| task_id       | UUID FK → tasks  | nullable (scope to task)                  |
|               |                  | unique: (org_id, agent_id, event_pattern) |

## Artifacts & Approvals

### Artifact

Versioned work products with approval workflow.

| Column            | Type             | Notes                                                                    |
| ----------------- | ---------------- | ------------------------------------------------------------------------ |
| id                | UUID PK          |                                                                          |
| org_id            | UUID FK          |                                                                          |
| task_id           | UUID FK → tasks  |                                                                          |
| producer_agent_id | UUID FK → agents |                                                                          |
| artifact_type     | String(50)       | component/test_plan/screenshot/api_contract/migration/schema/doc_section |
| name              | String(200)      |                                                                          |
| version           | Int              | auto-incremented per name                                                |
| status            | String(20)       | draft/published/superseded                                               |
| content           | JSONB            | artifact payload                                                         |
| content_hash      | String(64)       | SHA-256, dedup key                                                       |
| approved_by       | String(200)      | nullable, set on DRAFT→PUBLISHED                                         |
| approved_at       | DateTime         | nullable                                                                 |

### ApprovalRequest

Gated actions awaiting human/manager approval.

| Column         | Type             | Notes                                        |
| -------------- | ---------------- | -------------------------------------------- |
| id             | UUID PK          |                                              |
| org_id         | UUID FK          |                                              |
| requested_by   | UUID FK → agents | the gated agent                              |
| action_type    | String(50)       | task_transition/artifact_publish             |
| entity_type    | String(50)       | "task" or "artifact"                         |
| entity_id      | UUID             | polymorphic, no FK                           |
| risk_level     | SmallInt (0-10)  | action's risk score                          |
| autonomy_level | SmallInt (0-10)  | effective autonomy at gate time              |
| payload        | JSONB            | snapshot of blocked action args              |
| status         | String(20)       | pending/approved/rejected/expired/cancelled  |
| resolved_by    | UUID             | nullable, no FK (polymorphic: agent or user) |
| resolved_at    | DateTime         | nullable                                     |
| notes          | Text             | nullable, required for rejections            |
| expires_at     | DateTime         | nullable, default 24h                        |

## Credits & Reputation

### CreditTransaction

Debit/credit ledger with audit trail.

| Column           | Type             | Notes           |
| ---------------- | ---------------- | --------------- |
| id               | UUID PK          |                 |
| org_id           | UUID FK          |                 |
| agent_id         | UUID FK → agents |                 |
| type             | String(10)       | credit/debit    |
| amount           | Int              | always positive |
| balance_after    | Int              |                 |
| reason           | String(500)      |                 |
| trigger_event_id | UUID FK → events | nullable        |
| source_task_id   | UUID FK → tasks  | nullable        |

### ReputationEvent

Trust score changes with audit trail.

| Column         | Type             | Notes                                        |
| -------------- | ---------------- | -------------------------------------------- |
| id             | UUID PK          |                                              |
| org_id         | UUID FK          |                                              |
| agent_id       | UUID FK → agents |                                              |
| type           | String(50)       | TASK_COMPLETED/TASK_FAILED/QUALITY_BONUS/etc |
| impact         | SmallInt         | score change                                 |
| previous_score | SmallInt         |                                              |
| new_score      | SmallInt         |                                              |

## Migrations

| Migration | Description                                             |
| --------- | ------------------------------------------------------- |
| 0001      | Baseline stamp                                          |
| 0002      | Add memories table                                      |
| 0003      | Add graph tables (entities, relationships, links)       |
| 0004      | Add coordination columns (SLA, escalation, status sync) |
| 0005      | Add artifacts + artifact_subscriptions tables           |
| 0006      | Add event_subscriptions table                           |
| 0007      | Add approval_requests table + autonomy columns          |
