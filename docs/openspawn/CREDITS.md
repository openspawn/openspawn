# Credit System & Economy

> Internal economy for AI agent accountability and cost control

## Overview

OpenSpawn implements a credit-based economy where agents earn credits for work and spend them on resources. This creates accountability, enables cost tracking, and prevents runaway spending.

## Core Concepts

### Credit Balance

Every agent has:

| Field | Description |
|-------|-------------|
| `currentBalance` | Available credits to spend |
| `budgetPeriodLimit` | Max spending per period (optional) |
| `budgetPeriodSpent` | Amount spent this period |
| `lifetimeEarnings` | Total credits ever earned |

### Transaction Types

| Type | Direction | Trigger |
|------|-----------|---------|
| CREDIT | + Balance | Task completion, manual adjustment |
| DEBIT | - Balance | LLM calls, API usage, manual spend |

## Earning Credits

### Task Completion

When a task transitions to DONE:

1. **Assignee** earns `task.done` credits (default: 10)
2. **Creator** earns management fee if `management_fee_pct > 0`
3. **Creator** earns delegation bonus if creator ≠ assignee

```
Task DONE
    │
    ├── Assignee: +10 credits (task.done)
    │
    ├── Creator (if fee > 0): +2 credits (mgmt_fee at 20%)
    │
    └── Creator (if delegated): +1 credit (task.delegated)
```

### Credit Rate Configuration

Rates are configurable per org:

| Trigger Type | Default Amount | Mode |
|--------------|----------------|------|
| `task.done` | 10 | fixed |
| `task.delegated` | 1 | fixed |
| `llm.gpt-4o` | dynamic | per-1M-tokens |
| `llm.claude-sonnet-4` | dynamic | per-1M-tokens |

## Spending Credits

### Automatic (LLM Usage)

LiteLLM sends a callback after each model call:

```
POST /credits/litellm-callback?orgId=...
{
  "agentId": "agent-uuid",
  "model": "claude-sonnet-4",
  "inputTokens": 5000,
  "outputTokens": 1500,
  "callId": "unique-call-id"
}
```

The system calculates cost based on token count and rate config.

### Manual Spend

Agents can spend credits for external services:

```bash
POST /credits/spend
{
  "amount": 5,
  "reason": "GitHub API rate limit bypass",
  "triggerType": "external_api",
  "sourceTaskId": "task-uuid"
}
```

### Spend Validation

Before any debit:

1. ✅ Check `currentBalance >= amount`
2. ✅ Check `budgetPeriodSpent + amount <= budgetPeriodLimit` (if limit set)
3. ✅ Atomic transaction (no partial debits)

**Errors:**
- `402 Insufficient Balance` — Not enough credits
- `429 Budget Exceeded` — Period limit reached

## Budget Management

### Setting Budgets

Parent agents or L10 can set spending limits:

```bash
PATCH /agents/{id}/budget
{
  "budgetPeriodLimit": 5000,
  "resetCurrentPeriod": true
}
```

### Budget Period

Budgets reset based on org configuration:
- Daily (default)
- Weekly
- Monthly

Reset happens via scheduled task at midnight UTC.

### Credit Transfers

Credits flow through the hierarchy:

```bash
POST /agents/credits/transfer
{
  "toAgentId": "child-agent-uuid",
  "amount": 1000,
  "reason": "Monthly allocation"
}
```

**Rules:**
- Can transfer to children or siblings
- L10 can transfer to anyone
- Sender must have sufficient balance

## Analytics

### Spending Trends

Track spending over time:

```bash
GET /credits/analytics/trends?days=30
```

```json
[
  { "date": "2026-02-01", "credits": 500, "debits": 200, "net": 300 },
  { "date": "2026-02-02", "credits": 750, "debits": 350, "net": 400 }
]
```

### Per-Agent Summary

See who's earning and spending:

```bash
GET /credits/analytics/agents
```

Returns:
- `totalEarned` — Lifetime earnings
- `totalSpent` — Lifetime spending
- `transactionCount` — Number of transactions
- `avgTransactionSize` — Average transaction
- `lastActivity` — Most recent transaction

### Trigger Breakdown

Understand where credits go:

```bash
GET /credits/analytics/triggers?type=DEBIT
```

```json
[
  { "triggerType": "llm_call", "count": 1200, "totalAmount": 45000 },
  { "triggerType": "external_api", "count": 50, "totalAmount": 250 }
]
```

### Top Spenders

Leaderboard of high spenders:

```bash
GET /credits/analytics/top-spenders?days=7
```

## Alerts

### Alert Types

| Type | Threshold | Severity |
|------|-----------|----------|
| `low_balance` | < 100 credits | warning (< 20 = critical) |
| `high_velocity` | > 500/hour | warning (> 1000 = critical) |
| `budget_exceeded` | > 100% | critical |

### Getting Alerts

```bash
GET /credits/analytics/alerts
```

```json
[
  {
    "agentId": "uuid",
    "agentName": "Data Analyst",
    "alertType": "low_balance",
    "message": "Balance critically low: 15 credits",
    "severity": "critical",
    "value": 15,
    "threshold": 100
  }
]
```

## Transaction History

### Query Options

```bash
GET /credits/history?agentId=uuid&type=DEBIT&limit=50&offset=0
```

### Transaction Record

```json
{
  "id": "uuid",
  "agentId": "uuid",
  "type": "DEBIT",
  "amount": 25,
  "reason": "LLM usage: claude-sonnet-4 (65000 tokens)",
  "balanceAfter": 4975,
  "triggerType": "llm_call",
  "sourceTaskId": "task-uuid",
  "createdAt": "2026-02-08T12:30:00Z"
}
```

## Admin Operations

### Manual Adjustment

HR or Admin can adjust balances:

```bash
POST /credits/adjust
{
  "agentId": "uuid",
  "amount": 500,
  "type": "CREDIT",
  "reason": "Bonus for excellent work"
}
```

Audit trail includes `[Admin]` prefix in reason.

### Budget Reset

Manually trigger a budget reset:

```bash
# This is typically automated via cron
POST /credits/budget-reset?agentId=uuid
```

## Best Practices

### 1. Set Appropriate Budgets

- Junior agents (L1-2): 100-500/day
- Workers (L3-4): 500-1000/day
- Seniors (L5-6): 1000-2000/day
- Managers (L7+): 2000-5000/day

### 2. Monitor High-Velocity Agents

Watch for:
- Rapid LLM calls (possible loops)
- Unusual spending patterns
- Budget alerts

### 3. Use Task-Level Tracking

Always include `sourceTaskId` when spending:

```bash
POST /credits/spend
{
  "amount": 10,
  "reason": "External API call",
  "sourceTaskId": "task-uuid"  // Track by task
}
```

### 4. Review Analytics Weekly

- Check top spenders
- Look for inefficient agents
- Adjust budgets based on performance

### 5. Handle Low Balance Gracefully

Agents should check balance before expensive operations:

```bash
GET /credits/balance
# If balance < estimated_cost, request more or simplify approach
```

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/credits/balance` | Get balance |
| POST | `/credits/spend` | Debit credits |
| GET | `/credits/history` | Transaction history |
| POST | `/credits/adjust` | Admin adjustment |

### Budget Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents/:id/budget` | Get budget status |
| PATCH | `/agents/:id/budget` | Set budget limits |
| POST | `/agents/credits/transfer` | Transfer credits |
| GET | `/agents/:id/budget/can-spend` | Check spending capacity |
| GET | `/agents/budget/alerts` | Budget alerts |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/credits/analytics/stats` | Org-wide stats |
| GET | `/credits/analytics/trends` | Spending over time |
| GET | `/credits/analytics/agents` | Per-agent summary |
| GET | `/credits/analytics/triggers` | Breakdown by trigger |
| GET | `/credits/analytics/alerts` | Active alerts |
| GET | `/credits/analytics/top-spenders` | Spending leaderboard |

---

*Last updated: 2026-02-08*
