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

## Auth Modes — Configurable Enforcement

Not every deployment needs a login screen. Auth enforcement is configurable via `openspawn.config.json`:

```json
{
  "auth": {
    "mode": "none" | "local" | "full"
  }
}
```

### `none` (default for `openspawn start`)

- Dashboard is open, no login screen
- API accepts all requests — middleware injects a synthetic "owner" identity
- Agent HMAC/API key auth still works but is not required
- Perfect for: solo dev on laptop, local experimentation, demos
- This is the CLI wizard default — zero friction out of the box

### `local` (opt-in, single-user protection)

- Single-user password set during `openspawn init` or on first boot
- Simple session cookie for dashboard, bearer token for API
- Token generated at setup, stored in `openspawn.config.json` (or `.openspawn/secrets.json`)
- No external identity provider needed
- Perfect for: solo user on VPS, shared home network, basic protection

### `full` (default for `openspawn start --deployed`)

- Casdoor/OIDC with agent JWT tokens, delegation chains, task-scoped claims
- Dashboard has real login flow (OAuth or username/password)
- Agent tokens are scoped per task with the intersection model described above
- Perfect for: teams, production, multi-agent orgs with trust boundaries

### Implementation

Auth middleware checks `config.auth.mode` and enforces accordingly:

```python
async def auth_dependency(request: Request) -> AuthContext:
    mode = get_config().auth.mode
    if mode == "none":
        return AuthContext.owner()  # synthetic owner, full access
    elif mode == "local":
        return verify_local_token(request)  # bearer or session cookie
    else:
        return verify_jwt(request)  # full Casdoor JWT validation
```

The auth router endpoints exist in all modes — they just return different responses:
- `none`: login/register endpoints return 200 with a static owner token
- `local`: login validates password, returns session token
- `full`: login redirects to OAuth or validates credentials against Casdoor

### CLI Integration

The wizard includes auth mode selection:

```
$ npx openspawn init
...
? Authentication mode
  ● None — open dashboard, no login (default)
  ○ Local password — simple protection
  ○ Full auth — teams and production
```

The `--deployed` flag defaults to `full` instead of `none`.

## Phased Rollout

### Phase 1 (now) — Ship auth with configurable modes

Wire up the auth router endpoints with three-mode support. Default to `none` for local, `full` for deployed. Models, UI, and dependency injection exist — only the router + middleware are missing. API key auth covers agents. Unblocks the hosted product without forcing auth on solo users.

**No Casdoor deployment needed for `none` or `local` modes.**

### Phase 2 (when users exist) — Add OAuth

Google OAuth for human login in `full` mode. Still no Casdoor — just a FastAPI OAuth flow.

### Phase 3 (when orgs need delegation/audit) — Deploy Casdoor

Full Casdoor deployment at `id.openspawn.ai:9000`. Unified identity, task-scoped tokens, delegation chains, provenance tracking. This is when the full design above gets implemented.

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
