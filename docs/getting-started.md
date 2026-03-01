---
purpose: Get a human or agent from zero to a running OpenSpawn org
audience: developers, AI agents
prerequisites: Node.js 18+
time_estimate: 10 minutes
difficulty: beginner
related: [agent-quickstart.md, templates-guide.md, org-md-reference.md, mcp-reference.md, FAQ.md, troubleshooting.md]
---

# Getting Started with OpenSpawn

**What you'll learn:** How to install OpenSpawn, scaffold an org from a template, understand ORG.md structure, validate and generate configs, preview the dashboard, and connect real AI models.

**What you'll have in ~10 minutes:** a local org of AI agents, coordinated by a single markdown file, visible in a real-time dashboard — with tasks flowing through a hierarchy you define.

## What is OpenSpawn?

OpenSpawn is a **coordination layer for AI agents**. It is not an agent framework — you keep using whatever you're using (OpenClaw, LangGraph, Claude Code, raw API calls). OpenSpawn adds the layer most multi-agent systems are missing: *structure*.

```
ORG.md  →  OpenSpawn parses it  →  agents spawn  →  tasks flow through hierarchy  →  dashboard shows everything
```

**The key idea:** One file — `ORG.md` — defines your entire agent organization. Roles, hierarchy, culture, budget policies, and operating procedures all live in one readable, version-controlled markdown file.

> **Q: How is this different from CrewAI / LangGraph / AutoGen?**
> - Those are agent frameworks (they build agents). OpenSpawn is a coordination layer (it organizes agents). Use them together.

> **Q: Do I need to rewrite my agents?**
> - No. OpenSpawn coordinates your existing agents via standard protocols (MCP, A2A).

---

## Do I need OpenSpawn?

```
Do you have multiple agents that need to work together?
├── YES
│   Do they need persistent roles, hierarchy, and budgets?
│   ├── YES → Use OpenSpawn
│   └── NO → Sub-agents (sessions_spawn) may be enough
└── NO → You probably don't need OpenSpawn yet
```

---

## Prerequisites

**Required:**
- Node.js 18+ (`node --version` to check)

**Optional (for real model inference):**
- [Ollama](https://ollama.ai) — free local models (workers use `qwen2.5` at zero cost)
- [Groq](https://groq.com) API key — fast inference for mid-tier agents
- [OpenRouter](https://openrouter.ai) API key — Claude/GPT-4o for executives

> **Q: Do I need API keys to try it?**
> - No. Demo/simulation mode works without any API keys. You see the full coordination flow.

---

## Step 1 — Start with ORG.md

**ORG.md is the heart of OpenSpawn.** Before you run a single command, it's worth understanding what you're building toward.

Here's a real ORG.md for a SaaS customer onboarding team — the scenario we'll use throughout this guide:

```markdown
# Customer Onboarding Org

## Identity
- **Mission:** Onboard new enterprise customers end-to-end in under 48 hours
- **Industry:** SaaS / Enterprise Software

## Culture
preset: agency

## Structure

### Onboarding Lead — Customer Onboarding Manager
The quarterback. Owns the customer relationship from signed contract to go-live.
- **Level:** 7
- **Department:** Customer Success
- **Reports to:** Human Principal

#### Data Migration Specialist — Senior Data Engineer
Ingests customer data, validates schema compatibility, verifies migration.
- **Level:** 5
- **Department:** Engineering
- **Reports to:** Onboarding Lead

#### Integration Engineer — Platform Integration Specialist
Connects customer's existing tools (CRM, ERP, SSO) to the platform.
- **Level:** 5
- **Department:** Engineering
- **Reports to:** Onboarding Lead

#### Success Agent — Customer Success Representative
Conducts go-live check-in, validates first successful workflow.
- **Level:** 4
- **Department:** Customer Success
- **Reports to:** Onboarding Lead

## Policies
### Budget
- **Per-agent limit:** 800 credits/customer
- **Overage behavior:** pause and escalate

## Playbooks
### 48-Hour Onboarding Track
1. Onboarding Lead creates PLAN.md and assigns tasks
2. Migration and Integration work in parallel (hours 2–24)
3. Success Agent conducts go-live validation (hours 40–48)
```

This one file defines the entire onboarding team. OpenSpawn parses it, generates OpenClaw configs, and routes tasks through the hierarchy automatically.

> **Q: What if I just want to start fast without writing ORG.md from scratch?**
> - Use a template: `openspawn init my-org --template=saas-onboarding`

---

## Step 2 — Scaffold your org

```bash
npx openspawn init my-org --template=saas-onboarding
cd my-org
```

This creates:

```
my-org/
├── ORG.md                  # Your org definition (the important one)
├── openspawn.config.json   # Server config (port, model providers)
└── .gitignore
```

> **Q: Can I skip the wizard?**
> ```bash
> openspawn init my-org --template=saas-onboarding --non-interactive
> ```

> **Q: What templates are available?**
> | Template | Industry | Use case |
> |----------|----------|---------|
> | `saas-onboarding` | SaaS | Customer onboarding pipeline |
> | `incident-response` | DevOps | Production incident management |
> | `contract-review` | Legal | Contract review and risk analysis |
> | `compliance-monitoring` | Fintech | Transaction monitoring and reporting |
> | `game-live-ops` | Gaming | Live operations and player engagement |
> | `catalog-management` | E-commerce | Product catalog and pricing |
> | `clinical-trials` | Healthcare | Clinical trial data processing |

---

## Step 3 — Review your ORG.md

Open `ORG.md`. You'll see five sections:

| Section | Purpose | Required? |
|---------|---------|-----------|
| `## Identity` | Name, mission, values | No |
| `## Culture` | Communication norms, preset | No |
| `## Structure` | Agent roles and hierarchy | **Yes** |
| `## Policies` | Budgets, caps, permissions | No |
| `## Playbooks` | Step-by-step procedures | No |

Each agent in Structure looks like:

```markdown
### Onboarding Lead — Customer Onboarding Manager
The coordinator. Receives new customer intake, creates the onboarding plan,
assigns work to specialists, and tracks progress to go-live.
- **Level:** 7
- **Department:** Customer Success
- **Reports to:** Human Principal
```

> **Q: What do levels mean?**
> - L1-L5: Workers
> - L6: Can review/approve
> - L7-L9: Can create tasks and spawn agents
> - L10: Executive

> **Q: What's "Reports to"?**
> - The escalation chain. Blocked agents escalate to their manager. Never skip levels.

---

## Step 4 — Validate

```bash
openspawn validate
```

Expected output:
```
✅ ORG.md is valid

  Organization:  Customer Onboarding Org
  Agents:        4
  Culture:       agency
```

### Error recovery

| Error | Fix |
|-------|-----|
| `Cannot read ORG.md` | Make sure you're in the right directory: `ls ORG.md` |
| `Missing Structure section` | Add `## Structure` with at least one agent |
| `Agent reports to unknown agent` | Check spelling in `Reports to` — must match an agent name exactly |
| `No top-level agent` | One agent needs `Reports to: Human Principal` |

---

## Step 5 — Generate OpenClaw configs

```bash
openspawn start
```

This reads your org and generates `openclaw-patch.json` — ready-to-apply OpenClaw gateway configuration.

```bash
openspawn status
```

Displays a table of all agents:

```
Name                        Level  Model   Workspace                        Reports To
Onboarding Lead             L7     opus    workspace-onboarding-lead        Human Principal
Data Migration Specialist   L5     sonnet  workspace-data-migration          Onboarding Lead
Integration Engineer        L5     sonnet  workspace-integration-engineer    Onboarding Lead
Success Agent               L4     sonnet  workspace-success-agent          Onboarding Lead
```

> **Q: What happens after init?**
> - Run `openspawn start` to generate OpenClaw configs, then apply the patch to your gateway. The `openclaw-patch.json` file contains `agents.list` entries with id, model, workspace, and subagents config.

> **Q: Can I output status as JSON?**
> ```bash
> openspawn status --json
> ```

---

## Step 6 — Preview

```bash
npx openspawn preview
```

Opens the dashboard at http://localhost:3333. You'll see:
- Network graph of your agent hierarchy
- Task timeline (onboarding tasks flowing through the team)
- Agent details and credit balances
- Real-time SSE event stream

> **Q: Port 3333 is in use?**
> ```bash
> # Option 1: Kill the existing process
> lsof -i :3333
> kill <PID>
>
> # Option 2: Change port in openspawn.config.json
> { "port": 3334 }
> ```

---

## Step 7 — Customize your ORG.md

### Change the culture preset

```markdown
## Culture
preset: enterprise
```

| Preset | Escalation | Progress | Hierarchy depth |
|--------|-----------|----------|-----------------|
| `startup` | Immediate | Frequent | 2-3 levels |
| `enterprise` | Batched | On phase change | 5-8 levels |
| `agency` | Immediate | Every tick | 3-4 levels |
| `research` | Delayed | On request | 2-3 levels |
| `military` | Immediate | Every tick | Strict chain |
| `remote-async` | Delayed | On request | Flat |

### Add an agent

Add under `## Structure`:

```markdown
#### QA Validator — Onboarding Quality Analyst
Reviews completed onboarding configurations for errors before go-live.
- **Level:** 4
- **Department:** Engineering
- **Reports to:** Onboarding Lead
```

### Set budget policies

```markdown
## Policies

### Budget
- **Per-agent limit:** 800 credits/customer
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
```

### Write a playbook

```markdown
## Playbooks

### Escalation: Blocked Migration
1. Data Migration Specialist writes blocker to ESCALATION.md
2. Escalates to Onboarding Lead via escalation_create
3. Onboarding Lead engages engineering support within 1 hour
4. Customer notified with revised ETA within 30 minutes
```

---

## Step 8 — Connect real models (optional)

Edit `openspawn.config.json`:

```json
{
  "port": 3333,
  "orgFile": "ORG.md",
  "models": {
    "ollama": { "enabled": true, "baseUrl": "http://localhost:11434" },
    "groq": { "apiKey": "gsk_..." },
    "openRouter": { "apiKey": "sk-or-..." }
  }
}
```

> **Q: Which model for which agent?**
> - L1-L5 workers: Ollama (`qwen2.5`) — free, local
> - L6-L8 leads: Groq — fast, cheap
> - L9-L10 executives: OpenRouter (Claude/GPT-4o) — best reasoning

---

## The ORG.md mental model

Every OpenSpawn feature flows from ORG.md:

```
ORG.md defines:
  → who the agents are (Structure)
  → how they communicate (Culture)
  → what they can spend (Policies)
  → how they handle common situations (Playbooks)

OpenSpawn executes:
  → parses ORG.md
  → generates OpenClaw configs
  → routes tasks through the hierarchy
  → enforces budgets and escalation chains
  → shows everything in the dashboard
```

ORG.md is version-controlled, reviewable in pull requests, and readable by any human or AI on your team. The document IS the system.

---

## Next steps

- **Full CLI reference:** `openspawn --help`
- **All MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md) — every tool with parameters
- **Templates deep dive:** [`docs/templates-guide.md`](./templates-guide.md) — all 7 industry templates
- **ORG.md format:** [`docs/org-md-reference.md`](./org-md-reference.md) — every field and example
- **Communication protocol:** [`docs/communication-protocol.md`](./communication-protocol.md) — save tokens with efficient agent communication
- **Top FAQ:** [`docs/FAQ.md`](./FAQ.md)
- **Fix errors:** [`docs/troubleshooting.md`](./troubleshooting.md)
- **Agent quickstart:** [`docs/agent-quickstart.md`](./agent-quickstart.md) — agent-first version of this guide
- **Live demo:** https://openspawn.dev/app/
- **ORG.md spec:** https://openspawn.dev/org-md
