---
title: Getting Started
---

# Getting Started with OpenSpawn

**What you'll have in ~10 minutes:** a local org of AI agents — coordinated by a single markdown file, visible in a real-time dashboard, with tasks flowing through a hierarchy you define.

## What is OpenSpawn?

OpenSpawn is a **coordination layer for AI agents**. It is not an agent framework — you keep using whatever you already use (LangGraph, Claude Code, CrewAI, raw API calls). OpenSpawn adds the layer most multi-agent systems are missing: _structure_.

```
ORG.md  →  OpenSpawn parses it  →  agents spawn  →  tasks flow through hierarchy  →  dashboard shows everything
```

**The key idea:** One file — `ORG.md` — defines your entire agent organization. Roles, hierarchy, culture, budget policies, and operating procedures all live in one readable, version-controlled markdown file. The document IS the system.

> **Q: How is this different from CrewAI / LangGraph / AutoGen?**
>
> Those are agent frameworks — they build agents. OpenSpawn is a coordination layer — it organizes agents you already have. Use them together.

> **Q: Do I need to rewrite my agents?**
>
> No. OpenSpawn coordinates existing agents via standard protocols (MCP, A2A).

---

## Prerequisites

**Required:**

- Node.js 18+ (`node --version` to check)

**Optional:**

- Docker — for production deployment with Postgres and Redis

---

## Install

```bash
# Run directly (no install needed)
npx openspawn init

# Or install globally
npm install -g openspawn
openspawn init
```

---

## Initialize your org

The `npx openspawn init` wizard walks you through 8 steps to scaffold a complete agent organization.

### Step 1 — Template

Choose from 11 templates:

**General-purpose:**

| Template         | Use case                               |
| ---------------- | -------------------------------------- |
| `assistant-team` | Chief of staff + specialists (default) |
| `content-agency` | Content production pipeline            |
| `dev-shop`       | Software development team              |
| `research-lab`   | Research & analysis team               |

**Industry-specific:**

| Template                | Industry   | Use case                              |
| ----------------------- | ---------- | ------------------------------------- |
| `saas-onboarding`       | SaaS       | Customer onboarding pipeline          |
| `incident-response`     | DevOps     | Production incident management        |
| `contract-review`       | Legal      | Contract review and risk analysis     |
| `compliance-monitoring` | Fintech    | Transaction monitoring and reporting  |
| `game-live-ops`         | Gaming     | Live operations and player engagement |
| `catalog-management`    | E-commerce | Product catalog and pricing           |
| `clinical-trials`       | Healthcare | Clinical trial data processing        |

### Step 2 — Org name

Name your organization. Default: "My Agent Team".

### Step 3 — Mission, vision & values

Define your org's alignment values. The wizard offers 8 values — 5 enabled by default — each injected into agent system prompts (~50 tokens each) to shape decision-making without rigid rules.

| Value                  | Default | Agent Behavior                                     |
| ---------------------- | ------- | -------------------------------------------------- |
| Ownership              | Yes     | Single-threaded task ownership; ships or escalates |
| Transparency           | Yes     | Escalate instead of silently failing               |
| Measurement            | Yes     | Report outcomes with evidence                      |
| Subsidiarity           | Yes     | Solve at lowest competent level                    |
| Continuous Improvement | Yes     | Auto post-mortems, process updates                 |
| Speed                  | No      | Bias toward action, ship small                     |
| Rigor                  | No      | Depth over speed, verify first                     |
| Frugality              | No      | Cheap models for mechanical tasks                  |

Each value draws from established organizational research — Edmondson's work on psychological safety, Drucker's management by objectives, Katzenbach & Smith's team accountability model. Each directive is deliberately short (~50 tokens) so it fits in a system prompt without consuming your context window.

See the [Values Framework guide](/guides/values-framework/) for the full rationale behind each value and how they interact.

### Step 4 — Culture preset

Choose how agents communicate and escalate. Default: `agency`.

| Preset         | Escalation | Progress reports | Hierarchy depth |
| -------------- | ---------- | ---------------- | --------------- |
| `agency`       | Immediate  | Every tick       | 3–4 levels      |
| `startup`      | Immediate  | Frequent         | 2–3 levels      |
| `professional` | Batched    | On milestone     | 3–5 levels      |
| `ops`          | Immediate  | Every tick       | Strict chain    |
| `enterprise`   | Batched    | On phase change  | 5–8 levels      |
| `research`     | Delayed    | On request       | 2–3 levels      |
| `compliance`   | Immediate  | Every action     | 4–6 levels      |

### Step 5 — LLM provider & model

Select the default model for your agents. Default: Anthropic with `claude-sonnet-4-20250514`. Agents at L7+ automatically get upgraded to `claude-opus-4-20250514` for complex reasoning tasks.

### Step 6 — Budget

Set weekly credit limits. Default: 500 credits/week with an 80% alert threshold and pause-and-escalate on overage.

### Step 7 — Escalation

Choose escalation behavior when agents are blocked or over budget. Default: immediate escalation to the reporting manager.

### Step 8 — Infrastructure

Configure the coordinator port. Default: `8787`. Optionally enable Docker for production deployment.

### Quick start

Skip the wizard entirely with defaults:

```bash
# Accept all defaults
npx openspawn init -y

# Pick a template, skip the rest
npx openspawn init -t saas-onboarding -y
```

### Scaffold output

After the wizard completes, you'll have:

```
my-agent-team/
├── ORG.md                    # Your org definition (the important one)
├── openspawn.config.json     # All wizard answers persisted
├── openclaw-agents.json      # Generated agent configs with model assignments
├── .gitignore                # node_modules, .env, data/, *.db
└── workspaces/
    └── <agent-name>/
        ├── SOUL.md           # Org alignment + identity + role
        ├── AGENTS.md         # Workspace instructions
        └── memory/           # Empty, for agent continuity
```

### Dry run

Preview what the wizard would create without writing anything:

```bash
npx openspawn init --dry-run
```

This prints the agent hierarchy and a sample task routing to stdout.

---

## Start the coordinator

```bash
npx openspawn start
```

This starts the coordination server on port 8787 (configurable with `--port`). The server hosts both:

- **Dashboard** — real-time view of agents, tasks, and events at `http://localhost:8787`
- **MCP server** — tool interface for agents to call into the coordinator

For use with Claude Desktop or other MCP clients:

```bash
npx openspawn start --stdio
```

This runs the MCP server over stdio instead of HTTP, suitable for direct integration.

> **Q: Port 8787 is in use?**
>
> ```bash
> npx openspawn start --port 9000
> ```
>
> Or set it in `openspawn.config.json`:
>
> ```json
> { "port": 9000 }
> ```

---

## Go to production

For persistent deployments with Postgres and Redis:

```bash
npx openspawn init --deploy
```

This generates a `docker-compose.yml` alongside your org scaffold:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
```

Start the infra, then run the coordinator:

```bash
docker compose up -d
npx openspawn start
```

The coordinator connects to Postgres for persistent task history and Redis for pub/sub. Without Docker, `openspawn start` uses in-process SQLite — fine for development.

---

## CLI reference

### `openspawn init`

Scaffold a new agent organization.

| Flag                     | Description                               |
| ------------------------ | ----------------------------------------- |
| `-t, --template <name>`  | Use a specific template                   |
| `-y, --yes`              | Accept all defaults                       |
| `--non-interactive`      | No prompts, use defaults (same as `-y`)   |
| `--dry-run`              | Preview output without writing files      |
| `--deploy`               | Include docker-compose.yml for production |
| `-p, --port <number>`    | Set coordinator port (default: 8787)      |
| `-d, --directory <path>` | Output directory (default: org name)      |

### `openspawn start`

Start the coordination server.

| Flag              | Description                 |
| ----------------- | --------------------------- |
| `--port <number>` | Server port (default: 8787) |
| `--stdio`         | Run MCP server over stdio   |

### Other commands

| Command                             | Description                           |
| ----------------------------------- | ------------------------------------- |
| `openspawn status`                  | Show agent hierarchy and task summary |
| `openspawn org`                     | Display parsed ORG.md structure       |
| `openspawn hire <role>`             | Add an agent to the org               |
| `openspawn fire <agent>`            | Remove an agent from the org          |
| `openspawn task <description>`      | Create a new task                     |
| `openspawn delegate <task> <agent>` | Assign a task to an agent             |
| `openspawn escalate <task>`         | Escalate a task up the chain          |
| `openspawn report <task>`           | Get a task status report              |
| `openspawn budget`                  | Show credit balances and usage        |

---

## Customize your org

### Edit ORG.md directly

ORG.md is the source of truth. Add agents, change hierarchy, write playbooks — then restart the coordinator and changes take effect.

### Adjust config

Edit `openspawn.config.json` to change models, ports, or budget policies without touching ORG.md.

### Re-run the wizard

```bash
npx openspawn init
```

Running init in an existing directory will prompt you to merge or overwrite. Use this to add new templates or update values.

For the full rationale behind alignment values and how they shape agent behavior, see the [Values Framework guide](/guides/values-framework/).

---

## Next steps

- [Templates Guide](/guides/templates/) — all 11 templates with detailed walkthroughs
- [Values Framework](/guides/values-framework/) — deep dive on alignment values and how they interact
- [ORG.md Spec](/reference/org-md-spec/) — every field, section, and example
- [Agent Quickstart](/guides/agent-quickstart/) — agent-first version of this guide
- [Communication Protocol](/reference/communication-protocol/) — efficient agent communication patterns
- [FAQ](/faq/) — common questions
- [Troubleshooting](/guides/troubleshooting/) — error recovery
- [Live demo](https://bikinibottom.ai) — see a running org at bikinibottom.ai
