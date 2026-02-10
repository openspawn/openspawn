# Case Study: The $3,000 Weekend

> *"I had no visibility. No alerts. No budget caps. Just a bill."*

## The Scenario

**Alex** runs an AI-first startup with 4 agents handling market research. The setup was simple: agents query data sources, analyze trends, and generate reports.

One Friday night, the market research agent hit an edge case in its analysis loop. Instead of completing, it kept re-requesting the same dataset, burning through API calls.

Monday morning brought a $3,000 invoice from their LLM provider.

**The problem wasn't the bug** — bugs happen. The problem was:
- No per-agent spending limits
- No real-time visibility into costs
- No alerts when spending spiked
- No way to attribute costs to specific agents

## How BikiniBottom Solves This

### 1. Per-Agent Budget Limits

Every agent has a `budgetPeriodLimit` — a hard cap on spending per billing period:

```
Agent: market-researcher
├── Current Balance: 1,250 credits
├── Period Limit: 5,000 credits
├── Period Spent: 3,750 credits (75%)
└── Status: ACTIVE
```

When an agent hits their limit, they can't spend more until the period resets or a manager intervenes.

### 2. Real-Time Credit Tracking

The **Credits Dashboard** shows exactly what each agent is spending, in real-time:

- Transaction-by-transaction ledger
- Running balance per agent
- Spending velocity (how fast are credits being consumed?)
- Cost attribution by task

### 3. Event History for Forensics

Every credit transaction is logged with full context:

```
[2026-02-08 03:47:12] credits.spent
Agent: market-researcher
Amount: 45 credits
Reason: Model usage (gpt-4-turbo)
Task: TASK-0042 - Competitor Analysis
```

When something goes wrong, you can trace exactly what happened.

### 4. Hierarchical Budget Control

Higher-level agents (L7+) can set budgets for their subordinates:

```
Agent Dennis (L10) — Org budget: 100,000 credits
├── Tech Talent (L9) — Budget: 40,000 credits
│   ├── Code Reviewer (L6) — Budget: 8,000 credits
│   └── Test Writer (L5) — Budget: 5,000 credits
└── Marketing Talent (L9) — Budget: 30,000 credits
    └── Market Researcher (L5) — Budget: 5,000 credits ← Would have stopped at $500
```

## The Outcome

With BikiniBottom, Alex's scenario would have played out differently:

1. **Friday 8 PM**: Agent hits 80% of budget limit
2. **Friday 9 PM**: Agent hits 100%, spending stops automatically
3. **Monday morning**: Total cost: $500 (the budget limit), not $3,000

The bug still happened — but the blast radius was contained.

---

## Try It Yourself

```bash
# See agent budgets
openspawn agents list

# Check credit history
openspawn credits history --agent market-researcher

# Set a budget limit
openspawn agents update market-researcher --budget-limit 5000
```

**Live Demo**: [openspawn.github.io/openspawn/#/credits](https://openspawn.github.io/openspawn/#/credits)
