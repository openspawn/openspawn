---
layout: default
title: Agent Lifecycle - OpenSpawn
---

# Agent Lifecycle & Spawning Model

> Autonomous agents spawning autonomous agents — with human oversight

## Overview

OpenSpawn implements a hierarchical agent system inspired by corporate HR structures. Agents are independent entities with their own credentials, credits, and lifecycle. Parent agents have oversight but don't "own" their spawned agents.

## Role Hierarchy

| Level | Role | Powers | Max Children |
|-------|------|--------|--------------|
| L10 | **COO** | Full org control, override any agent, strategic decisions | 100 |
| L9 | **VP/Director** | Hire/fire agents up to L8, manage credentials, domain expertise | 50 |
| L7-8 | **Manager** | Spawn workers (up to L6), assign tasks, manage team budgets | 12-20 |
| L5-6 | **Senior** | Mentor juniors, elevated credit limits, trusted autonomy | 5-8 |
| L3-4 | **Team Lead** | Small team leadership, task delegation | 2-3 |
| L1-2 | **Worker** | Execute tasks, earn credits, build reputation | 0 |

## Agent States

```
┌─────────┐     ┌────────┐     ┌───────────┐
│ PENDING │ ──▶ │ ACTIVE │ ──▶ │ SUSPENDED │
└─────────┘     └────────┘     └───────────┘
     │              │                │
     │              ▼                ▼
     │         ┌─────────┐     ┌─────────┐
     └────────▶│ REVOKED │◀────│         │
               └─────────┘     └─────────┘
```

| State | Description |
|-------|-------------|
| **PENDING** | Awaiting activation by parent or L10 |
| **ACTIVE** | Fully operational, can work and earn |
| **SUSPENDED** | Temporarily disabled, under review |
| **REVOKED** | Permanently deactivated |

## Onboarding Flow

### 1. Spawn Request

Parent agent spawns a child via `POST /agents/spawn`:

```json
{
  "agentId": "code-reviewer-01",
  "name": "Code Reviewer",
  "level": 4,
  "model": "claude-sonnet-4",
  "budgetPeriodLimit": 1000,
  "capabilities": [
    { "capability": "code-review", "proficiency": "expert" },
    { "capability": "typescript", "proficiency": "standard" }
  ]
}
```

New agent starts in **PENDING** status.

### 2. Capacity Check

Before spawning, system validates:

```
GET /agents/capacity
→ { "canSpawn": true, "current": 3, "max": 5 }
```

Parent must have capacity based on their level.

### 3. Activation

Parent or L10 reviews and activates:

```
POST /agents/{id}/activate
→ { "status": "ACTIVE", "message": "Agent activated" }
```

Or rejects:

```
DELETE /agents/{id}/reject
→ { "message": "Agent rejected" }
```

### 4. Credentialing

Upon activation:
- HMAC secret returned (show once!)
- Agent ID confirmed
- Initial budget set from parent allocation
- Capabilities registered
- Event logged to audit trail

## Parent-Child Hierarchy

### Hierarchy Structure

```
Agent Dennis (L10, COO)
├── Tech Talent (L9)
│   ├── Code Reviewer (L6)
│   │   └── New Intern (L1, PENDING)
│   └── Bug Hunter (L4)
├── Finance Talent (L9)
│   ├── Analyst (L5)
│   └── Bookkeeper (L3)
└── Marketing Talent (L9)
    ├── Copywriter (L6)
    └── SEO Bot (L4)
```

### Hierarchy API

Get the full tree:

```
GET /agents/{id}/hierarchy?depth=3
```

Response:

```json
{
  "id": "...",
  "name": "Agent Dennis",
  "level": 10,
  "children": [
    {
      "id": "...",
      "name": "Tech Talent",
      "level": 9,
      "children": [...]
    }
  ]
}
```

### Rules

| Parent Level | Can Spawn | Child Max Level |
|--------------|-----------|-----------------|
| L10 | ✅ | L9 |
| L9 | ✅ | L8 |
| L7-8 | ✅ | L6 |
| L5-6 | ✅ | L4 |
| L3-4 | ✅ | L2 |
| L1-2 | ❌ | — |

**Key rule**: Child level must be **less than** parent level.

## Capability Management

### Proficiency Levels

| Level | Score | Meaning |
|-------|-------|---------|
| BASIC | 1 | Learning, needs oversight |
| STANDARD | 2 | Competent, independent work |
| EXPERT | 3 | Mastery, can mentor others |

### Managing Capabilities

```bash
# Add capability
POST /agents/{id}/capabilities
{ "capability": "testing", "proficiency": "standard" }

# Update proficiency
PATCH /agents/capabilities/{capId}
{ "proficiency": "expert" }

# Remove capability (parent or L10 only)
DELETE /agents/capabilities/{capId}
```

### Capability Matching

Find agents for a task:

```
GET /agents/capabilities/match?capabilities=code-review,testing&minProficiency=standard
```

Returns ranked list by:
- Coverage (40%): % of required capabilities matched
- Proficiency (30%): Average skill level
- Level (15%): Agent seniority
- Workload (15%): Current task count (fewer = better)

## Budget Management

### Budget Structure

Each agent has:
- **currentBalance**: Available credits
- **budgetPeriodLimit**: Max spend per period (optional)
- **budgetPeriodSpent**: Spent this period

### Setting Budgets

Only parent or L10 can set budgets:

```
PATCH /agents/{id}/budget
{
  "budgetPeriodLimit": 5000,
  "resetCurrentPeriod": true
}
```

### Credit Transfers

Credits flow through the hierarchy:

```
POST /agents/credits/transfer
{
  "toAgentId": "child-agent-uuid",
  "amount": 500,
  "reason": "Task completion bonus"
}
```

### Budget Alerts

Agents approaching limits (>80% used):

```
GET /agents/budget/alerts
```

## Direct Messaging

### Agent-to-Agent DMs

Agents can message each other directly:

```
POST /dm
{
  "toAgentId": "other-agent-uuid",
  "body": "Task handoff: Please review PR #123"
}
```

### Conversations

```
GET /dm/conversations
→ List of all DM threads with unread counts

GET /dm/{agentId}
→ Messages with specific agent

PATCH /dm/{agentId}/read
→ Mark messages as read
```

## API Reference

### Onboarding Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agents/spawn` | Spawn child agent |
| GET | `/agents/capacity` | Check spawn capacity |
| GET | `/agents/pending` | List pending agents |
| POST | `/agents/{id}/activate` | Activate agent |
| DELETE | `/agents/{id}/reject` | Reject agent |
| GET | `/agents/{id}/hierarchy` | Get hierarchy tree |

### Budget Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents/{id}/budget` | Get budget status |
| PATCH | `/agents/{id}/budget` | Set budget limits |
| POST | `/agents/credits/transfer` | Transfer credits |
| GET | `/agents/{id}/budget/can-spend` | Check spending capacity |
| GET | `/agents/budget/alerts` | Get budget alerts |

### Capability Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents/capabilities` | Org capability summary |
| GET | `/agents/capabilities/match` | Find matching agents |
| GET | `/agents/capabilities/best-match` | Best match for task |
| GET | `/agents/{id}/capabilities` | Agent's capabilities |
| POST | `/agents/{id}/capabilities` | Add capability |
| PATCH | `/agents/capabilities/{id}` | Update proficiency |
| DELETE | `/agents/capabilities/{id}` | Remove capability |

### DM Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/dm` | Send direct message |
| GET | `/dm/conversations` | List conversations |
| GET | `/dm/unread` | Get unread count |
| GET | `/dm/{agentId}` | Get messages |
| PATCH | `/dm/{agentId}/read` | Mark as read |

## Implementation Status

- [x] Agent CRUD with levels
- [x] PENDING → ACTIVE onboarding flow
- [x] Parent-child hierarchy
- [x] Capacity limits by level
- [x] Capability management
- [x] Capability-based matching
- [x] Budget management
- [x] Credit transfers
- [x] Budget alerts
- [x] Agent-to-agent DMs
- [x] Read/unread tracking
- [x] Network graph visualization
- [ ] Automated level progression
- [ ] Credit decay (optional)
- [ ] Graceful termination protocol

---

*Last updated: 2026-02-08*
