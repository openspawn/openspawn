---
source: https://openspawn.ai/docs/faq
generated: 2026-03-14
---

# OpenSpawn FAQ

**What you'll learn:** Answers to the most common questions about OpenSpawn — what it is, how to use it, how it applies to real industry scenarios, and how agents interact with it.

> **TL;DR for agents:** OpenSpawn is a coordination layer. You define an org in `ORG.md`, run `openspawn start`, and agents communicate via MCP tools at `POST /mcp`. If you're blocked, escalate up the chain. If you're done, `task_complete`.

---

## Top 10 Quick Answers

These are the questions people ask most often. Longer answers are in the sections below.

| #   | Question                                       | Short answer                                                                                                             |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **What is OpenSpawn?**                         | An open-source coordination layer for AI agent orgs — defined in one markdown file (`ORG.md`).                           |
| 2   | **Do I need to rewrite my agents?**            | No. OpenSpawn connects to existing agents via MCP, A2A, or REST.                                                         |
| 3   | **Do I need API keys to try it?**              | No. `npx openspawn init my-org && openspawn preview` runs a deterministic simulation with zero API keys.                 |
| 4   | **What do I need installed?**                  | Node 18+, Python 3.12+, and [uv](https://docs.astral.sh/uv/). Docker optional (production only).                         |
| 5   | **My ORG.md agents aren't showing up — why?**  | Check heading depths (H3 for departments, H4 for roles) and use bold-key metadata: `- **Level:** 6`. Check startup logs. |
| 6   | **I get `Invalid credentials` from the API.**  | Clock skew or wrong signature message format. See [Auth Errors](./guides/troubleshooting#5-api-auth-errors).             |
| 7   | **Why is my task stuck and won't transition?** | `DONE` and `CANCELLED` are terminal — create a new task. `IN_PROGRESS → DONE` is invalid; go through `REVIEW` first.     |
| 8   | **How do I fix port conflicts?**               | `lsof -i :3456` (MCP) or `lsof -i :3333` (sandbox), kill the process, or start with `--port`.                            |
| 9   | **The dashboard goes blank / SSE drops.**      | Proxy timeout. Set `proxy_read_timeout 86400s` (nginx) or `flush_interval -1` (Caddy).                                   |
| 10  | **How do I debug a broken setup?**             | Check startup logs → check port → inspect `data/openspawn.db` → see [Troubleshooting Guide](./guides/troubleshooting).   |

---

## General

### Q1: What is OpenSpawn?

OpenSpawn is an **open-source coordination layer for AI agent organizations**. You define your entire agent org — roles, hierarchy, culture, policies — in a single markdown file (`ORG.md`). OpenSpawn parses it, assigns agents, routes tasks through the hierarchy, and provides a real-time dashboard.

It is **infrastructure, not a framework**: it works with any agent stack (OpenClaw, LangGraph, CrewAI, AutoGen, raw API calls).

### Q2: How is OpenSpawn different from CrewAI or LangGraph?

```
CrewAI / LangGraph = agent frameworks (how you BUILD agents)
OpenSpawn = coordination layer (how you ORGANIZE agents)
```

- **CrewAI/LangGraph** define how agents execute tasks
- **OpenSpawn** defines who does what, who they report to, what they can spend, and who approves decisions

They're designed to work together, not replace each other.

### Q3: Do I need to rewrite my agents to use OpenSpawn?

**No.** OpenSpawn connects to your existing agents via standard protocols:

- **MCP** (Model Context Protocol) — for tool calls
- **A2A** (Agent-to-Agent) — for inter-org communication
- **REST** — for direct API calls

Your agents keep running as-is. OpenSpawn adds the coordination layer on top.

### Q4: Do I need API keys to try it?

**No.** Demo/simulation mode works out of the box:

```bash
npx openspawn init my-org --template=saas-onboarding --non-interactive
cd my-org
openspawn preview
# Opens http://localhost:3333/app automatically
```

You'll see the full coordination flow with deterministic simulation, no API keys needed.

### Q5: Is OpenSpawn free?

**Yes.** MIT open source. Self-hosted. No usage fees.

Optional: paid hosted tier (in development) for teams that don't want to self-host.

---

## Setup & Installation

### Q6: What are the prerequisites?

- **Required:**
  - Node.js 18+ (`node --version`)
  - Python 3.12+ (`python3 --version`)
  - [uv](https://docs.astral.sh/uv/) (`uv --version`) — Python package manager
- **Optional:**
  - Docker — for production deployment with PostgreSQL (not needed locally)

### Q7: How do I get a running org?

```bash
openspawn init my-org --template=saas-onboarding --yes
cd my-org
openspawn preview     # simulation — see it run instantly, no API keys
openspawn start       # real coordinator — spawns Claude Code agents
```

- `init` — scaffolds `ORG.md`, agent workspaces, and config
- `preview` — launches sandbox simulation + dashboard at `http://localhost:3333/app` (deterministic, zero cost)
- `start` — boots the Python API (FastAPI + SQLite), seeds agents, spawns Claude Code subprocesses, starts the asyncio scheduler

### Q8: Which template should I use?

```
What's your domain?
├── Customer success / SaaS    → saas-onboarding
├── Infrastructure / DevOps    → incident-response
├── Legal                      → contract-review
├── Finance / Compliance       → compliance-monitoring
├── Gaming / live service      → game-live-ops
├── E-commerce / retail        → catalog-management
└── Healthcare / life sciences → clinical-trials
```

All templates are starting points — edit the generated `ORG.md` freely.

### Q9: What is `openclaw-patch.json` and what do I do with it?

`openclaw-patch.json` is a ready-to-apply patch for your OpenClaw gateway's `agents.list`. It contains entries with:

- `id` — agent identifier (lowercase hyphenated name)
- `model` — `opus` for L7+ agents, `sonnet` for L6 and below
- `workspace` — agent workspace path
- `tools.profile: "full"` — full tool access
- `subagents.allowAgents` — for manager agents (L7+ with direct reports)
- `default: true` — on the highest-level agent

**To apply:** copy the entries from `openclaw-patch.json` into your OpenClaw `agents.list` config, then restart the gateway.

### Q10: How do I validate my ORG.md?

ORG.md is validated automatically when `openspawn start` boots the API. The seeder parses your org definition, checks hierarchy consistency, and reports errors in the startup logs before spawning agents.

**Common errors and fixes:**

| Error                            | Fix                                               |
| -------------------------------- | ------------------------------------------------- |
| `Missing Structure section`      | Add `## Structure` with at least one agent        |
| `Agent reports to unknown agent` | Check `Reports to` matches an agent name exactly  |
| `No top-level agent`             | One agent must have `Reports to: Human Principal` |
| `Circular reporting chain`       | No agent can report to itself or create a loop    |

---

## ORG.md

### Q11: What's the minimum viable ORG.md?

```markdown
# My Org

## Structure

### Boss — Leader

- **Level:** 10
- **Reports to:** Human Principal
```

That's it. One heading, one agent, one level, one reporting line.

### Q12: What do agent levels mean?

| Level | Role type  | Permissions                              |
| ----- | ---------- | ---------------------------------------- |
| L1-L5 | Workers    | Execute tasks                            |
| L6    | Seniors    | Review and approve work                  |
| L7-L9 | Leads      | Create tasks, spawn agents, manage teams |
| L10   | Executives | Top of hierarchy                         |

### Q13: What are the five ORG.md sections?

| Section        | Purpose                                                | Required? |
| -------------- | ------------------------------------------------------ | --------- |
| `## Identity`  | Name, mission, values — ambient context for all agents | No        |
| `## Culture`   | Communication norms, escalation speed, preset          | No        |
| `## Structure` | Agent roles and hierarchy                              | **Yes**   |
| `## Policies`  | Budget limits, caps, permissions                       | No        |
| `## Playbooks` | Step-by-step procedures for common scenarios           | No        |

### Q14: What are culture presets?

Presets are shorthand for configuring communication norms. Use one line:

```markdown
## Culture

preset: agency
```

| Preset         | Escalation       | Progress        | Best for                   |
| -------------- | ---------------- | --------------- | -------------------------- |
| `startup`      | Immediate        | Frequent        | Small fast teams           |
| `enterprise`   | Batched (hourly) | On phase change | Large orgs with process    |
| `agency`       | Immediate        | Every tick      | Client work with deadlines |
| `research`     | Delayed          | On request      | Exploration, long tasks    |
| `military`     | Immediate        | Every tick      | Zero-ambiguity operations  |
| `remote-async` | Delayed          | On request      | Distributed async teams    |

---

## Database & Infrastructure

### Q14.5: SQLite or PostgreSQL?

**SQLite** is the default for local development — zero config, no Docker. `openspawn start` creates `data/openspawn.db` automatically.

**PostgreSQL** is recommended for production. Run `npx openspawn init --deploy` to generate a `docker-compose.yml`, then set `DATABASE_URL` to switch.

| Concern      | SQLite (local)       | PostgreSQL (production) |
| ------------ | -------------------- | ----------------------- |
| Setup        | Zero config          | Docker or managed DB    |
| Concurrency  | Single-writer        | Full MVCC               |
| Persistence  | `data/openspawn.db`  | Volume-backed           |
| Memory/pgvec | Works                | Better performance      |
| Migration    | Automatic via seeder | Alembic migrations      |

### Q14.6: Do I still need Redis?

**No.** The asyncio scheduler replaces Redis for background jobs (SLA monitoring, escalation, status sync). Redis is no longer required in any mode.

### Q14.7: Do I need Docker for local development?

**No.** `openspawn start` boots a Python API with SQLite — no containers needed. Docker is only required for production PostgreSQL deployments.

---

## MCP & Agent Interaction

### Q15: How do agents interact with OpenSpawn?

Via **MCP tools** at `POST /mcp`. Authentication is HMAC — set `AGENT_ID` and `AGENT_SECRET` env vars.

Core workflow:

```
agent_list           → see who's in the org
task_create          → assign work to another agent
task_claim           → atomically claim an open task
task_complete        → mark work done with results
escalation_create    → flag a blocker to your manager
message_send         → send TASK/RESULT/ESCALATION/DECISION
credits_balance      → check your budget
org_status           → full org overview
```

Full tool reference: [`docs/mcp-reference.md`](./mcp-reference.md)

### Q16: Can two agents claim the same task?

**No.** `task_claim` is **atomic** — only one agent wins the claim, the other gets an error. This prevents duplicate work by design.

```
tool: task_claim { task_id: "abc123", agent_id: "data-migration-specialist" }
```

### Q17: What happens when an agent is blocked?

1. Agent sends `escalation_create` to its direct manager (never skips the chain)
2. Manager has 2 cycles to respond: unblock, reassign, or escalate further
3. If unresolved after 2 levels, alert goes to the Human Principal

---

## Communication Protocol

### Q18: How do agents communicate efficiently?

The [Agent Communication Protocol](./communication-protocol.md) defines 4 message types — **no ACKs, no courtesy messages**:

| Type         | Direction     | When                     |
| ------------ | ------------- | ------------------------ |
| `TASK`       | Lead → Worker | Work assignment          |
| `RESULT`     | Worker → Lead | Deliverable notification |
| `ESCALATION` | Worker → Lead | Blocker requiring help   |
| `DECISION`   | Lead → Worker | Resolves an escalation   |

**Core rule:** Silence = success. If an agent is working, it stays silent. Only message when blocked, assigning, delivering, or resolving.

### Q19: What files do agents use to share state?

Instead of sending messages, agents write to shared workspace files:

| File            | Owner      | Purpose                                   |
| --------------- | ---------- | ----------------------------------------- |
| `PLAN.md`       | Lead agent | Current sprint plan with task assignments |
| `RESULT.md`     | Workers    | Completed deliverables                    |
| `HANDOFF.md`    | Any agent  | Work ready for next stage                 |
| `REVIEW.md`     | Reviewers  | Feedback and approvals                    |
| `ESCALATION.md` | Any agent  | Complex issues needing &gt;3 turns        |

---

## Industry Scenarios

### Q20: Can I use OpenSpawn for compliance monitoring?

**Yes.** The `compliance-monitoring` template is purpose-built for fintech compliance teams. It models:

- Transaction ingestion and normalization (Transaction Analyst)
- AML/BSA rule application and OFAC screening (Rule Engine Agent)
- SAR/CTR filing and regulatory reporting (Report Generator)
- Compliance Lead oversight with human approval gates for all filings

The template includes a zero-tolerance OFAC escalation playbook and a full SAR filing workflow, with audit trails required for regulatory inspection.

```bash
openspawn init my-compliance-org --template=compliance-monitoring
```

### Q21: How would I set up a contract review pipeline?

Use the `contract-review` template. The pipeline flows:

1. **Clause Extractor** reads the contract and categorizes all key clauses (liability, indemnification, IP, etc.)
2. **Risk Analyst** compares each clause against your negotiation playbook and flags deviations
3. **Summary Writer** produces an attorney-ready package with risk register and recommended redlines
4. **Senior Reviewer** approves before delivery to business stakeholders

```bash
openspawn init my-legal-org --template=contract-review
```

Update the Policies section with your company's specific playbook reference and risk thresholds.

### Q22: Can I use OpenSpawn for customer onboarding?

**Yes.** The `saas-onboarding` template models a 48-hour enterprise onboarding track. Each new customer becomes a task in the onboarding org. The Onboarding Lead coordinates Data Migration, Integration Engineering, and Customer Success in parallel — with handoff protocols at each stage.

The template is designed so each customer's onboarding is repeatable, documented, and trackable from kickoff to go-live.

### Q23: How would I handle a production incident with OpenSpawn?

Use the `incident-response` template. When an alert fires:

1. Incident Commander activates and assigns Diagnostics and Comms agents simultaneously
2. Diagnostics Agent pulls metrics, traces, and logs to identify root cause
3. Remediation Agent executes fix with explicit Commander go-ahead
4. Comms Agent keeps stakeholders informed throughout

The template uses the `military` culture preset — mandatory acks, every-5-minute progress updates, and immediate escalation. No silent failures.

### Q24: Can I use OpenSpawn for a gaming live ops team?

**Yes.** The `game-live-ops` template covers:

- 24/7 economy metric monitoring with guardrails (max 15% parameter change without approval)
- Automated content generation on the weekly calendar
- Player sentiment monitoring across app stores and social
- Economy exploit response playbook with escalation thresholds

```bash
openspawn init my-game-org --template=game-live-ops
```

### Q25: How does OpenSpawn handle regulatory compliance requirements like audit trails?

For regulated industries (fintech, healthcare, legal), the ORG.md Policies section can specify:

- Audit trail requirements (every agent action logged with source reference and agent ID)
- Human approval gates for specific action types
- Data handling restrictions (what agents can read vs. write)
- Mandatory quality checkpoints before phase transitions

The `clinical-trials` template is the most comprehensive example — it models 21 CFR Part 11 audit trail requirements and CDISC data standards compliance into the agent workflow.

---

## Troubleshooting

### Q26: Where do I go when something's broken?

1. Check `openspawn start` logs — ORG.md validation runs automatically on boot
2. Read the [full Troubleshooting Guide](./guides/troubleshooting) — covers all error messages with exact fixes
3. Check port conflicts: `lsof -i :8787` (API/dashboard)
4. Review auth: verify `AGENT_ID` / `AGENT_SECRET`, timestamp skew (±5 min window), and nonce uniqueness
5. Check task state: `DONE` and `CANCELLED` are terminal — can't be re-opened
6. GitHub issues: https://github.com/openspawn/openspawn/issues

**Common error → fix table:**

| Error                                               | Fix                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `ORG.md not found at ...`                           | Run from the right directory or pass `--dir`                                  |
| `Unnamed Org` in dashboard                          | Add `# My Org Name` as the first H1 in ORG.md                                 |
| `Invalid transition: {from} → {to}`                 | Check the [task state machine](./guides/troubleshooting#7-task-state-machine) |
| `Request timestamp outside valid window`            | Sync system clock: `ntpdate -u pool.ntp.org`                                  |
| `Nonce already used`                                | Generate a fresh UUID nonce per request                                       |
| `Invalid credentials` (HMAC)                        | Verify signature message format: `METHOD+PATH+TIMESTAMP+NONCE+BODY`           |
| `API key missing required scope`                    | Regenerate key with correct scopes in dashboard                               |
| `Cannot delegate to agent of equal or higher level` | Delegation only flows downward in the hierarchy                               |
| `EADDRINUSE :::3456`                                | Kill existing process on that port or use `--port` flag                       |

---

## Next steps

- **Start building:** [`docs/agent-quickstart.md`](./agent-quickstart.md)
- **Full setup walkthrough:** [`docs/getting-started.md`](./getting-started.md)
- **All MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md)
- **Fix a specific error:** [`docs/troubleshooting.md`](./troubleshooting.md)
- **Live demo:** https://openspawn.dev/app/
