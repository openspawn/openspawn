# Agentic-First Auth Design

**Date:** 2026-03-10
**Status:** Phase 1 approved, Phases 2-3 deferred

## Decision: Casdoor over Authentik

Dropped Authentik in favor of [Casdoor](https://casdoor.org/) for unified identity.
Casdoor is lighter, Go-based, and has better API-driven identity management for programmatic agent registration.

## Design Decisions

### Unified Identity (Casdoor)

Both humans and agents are first-class Casdoor identities. Tokens carry **delegation provenance** — every token traces back to the original human owner through the full spawn chain.

Example ancestry for a deeply-spawned agent:

```
agent_3 → spawned_by: agent_2 → spawned_by: agent_1 → spawned_by: alice → org: openspawn
```

### Casdoor Org Mapping

**Org + App split (Option C):**

- Casdoor Organization = OpenSpawn Org
- Separate Casdoor Applications for humans vs agents within each org
- Rationale: agents need shorter TTLs, different refresh policies, task-scoped claims; humans need OAuth, 2FA, longer sessions

### Agent Identity Lifecycle

**API-driven registration:**

- Our API calls Casdoor's API to create agent identities when `POST /agents/register` is called
- Agents never interact with Casdoor directly — they just receive credentials
- Parent agents or humans trigger registration; Casdoor issues scoped tokens with `spawned_by` claims

### Token Scoping: Intersection Model

Agent permissions = intersection of **agent-level ceiling** and **task-required scopes**.

- Agent level (L1-L10) defines the max permission set
- Each task declares `required_scopes` at creation
- Token gets the intersection — an L3 agent can't claim a task requiring L7+ permissions
- Mismatches caught at claim time, not runtime

### Token Lifecycle

```
spawn → task-scoped (active) → idle → task-scoped (active) → ... → revoked
```

**Active state:** Token TTL matches task SLA deadline (capped at 24h max).
**Idle state:** Token downgrades to minimal permission set (can only claim tasks). Short fixed TTL (15 min) with refresh. If no new task claimed within window, token expires → re-auth required.
**Task completion:** Immediate downgrade to idle, not revocation.

### JWT Claims (Agent Token)

```json
{
  "sub": "agent_456",
  "org": "openspawn",
  "app": "agents",
  "task_id": "task_789",
  "scopes": ["read:channels", "write:messages", "transition:task"],
  "spawned_by": "agent_123",
  "owner": "user_alice",
  "level": 3,
  "state": "active",
  "exp": 1741612800
}
```

### Migration: Big Bang

No parallel/deprecation period needed — existing HMAC/API key auth has no external consumers yet. Replace entirely with Casdoor JWT auth.

## Phased Rollout

### Phase 1 (now) — Ship basic auth

Wire up the auth router endpoints the dashboard already expects. Models, UI, and dependency injection exist — only the router is missing. API key auth covers agents. Unblocks the hosted product.

**No Casdoor deployment needed.**

### Phase 2 (when users exist) — Add OAuth

Google OAuth for human login. Still no Casdoor — just a FastAPI OAuth flow.

### Phase 3 (when orgs need delegation/audit) — Deploy Casdoor

Full Casdoor deployment at `id.openspawn.ai:9000`. Unified identity, task-scoped tokens, delegation chains, provenance tracking. This is when the design above gets implemented.

## Current State (as of 2026-03-10)

| Layer                 | Status                                                          |
| --------------------- | --------------------------------------------------------------- |
| Agent HMAC auth       | Done — `X-Agent-ID` + `X-Signature` headers                     |
| API key auth          | Done — `osp_` prefixed bearer tokens                            |
| Agent registration    | Done — `POST /agents/register`, returns secret once             |
| User DB models        | Done — User, RefreshToken, ApiKey, Nonce                        |
| Dashboard login UI    | Done — login page, auth context, OAuth callback                 |
| Auth router endpoints | **Not built** — the only missing piece for Phase 1              |
| Casdoor               | Not deployed — Caddy route to `:9000` exists, nothing behind it |

## Unresolved Questions

- Casdoor storage backend — share Postgres or separate DB?
- Agent secret rotation policy once on Casdoor?
- Rate limiting on token refresh for idle agents?
- How does task `required_scopes` get defined — manual or inferred from task type?
