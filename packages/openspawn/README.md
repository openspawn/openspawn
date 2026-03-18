# OpenSpawn

**Persistent governed organizations for AI agents.**

OpenSpawn adds organizational structure to your AI agents — hierarchy, budgets, coordination, and governance defined in a single markdown file. Works with any agent framework.

[![npm](https://img.shields.io/npm/v/openspawn)](https://www.npmjs.com/package/openspawn)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/openspawn/openspawn/blob/main/LICENSE)

## Quick Start

```bash
npx openspawn init my-org
cd my-org
npx openspawn preview
```

This scaffolds an agent organization and launches a local simulation with dashboard at [localhost:3333/app](http://localhost:3333/app). No API keys needed — the preview runs deterministic simulation at zero cost.

## What You Get

`openspawn init` creates:

- **ORG.md** — your agent org chart in markdown (hierarchy, culture, policies)
- **openspawn.json** — configuration (LLM provider, models, budget, port)
- **workspaces/** — per-agent directories with SOUL.md identity files
- **.openspawn/tasks.json** — task store

## Define Your Org

Edit `ORG.md` to define your team:

```markdown
# My Agent Org

## Culture

- **Preset:** professional
- **Escalation:** fast
- **Ack Required:** yes

## Policies

- **Per-Agent Limit:** $50
- **Alert Threshold:** 80%

## Structure

### CEO — Chief Executive

- **Level:** 10
- **Domain:** operations

### Engineering

#### Lead — Engineering Lead

- **Level:** 7
- **Domain:** engineering
- **Reports To:** CEO

#### Builder — Developer

- **Level:** 4
- **Domain:** engineering
- **Reports To:** Lead
- **Count:** 2
```

## CLI Commands

```
openspawn init [name]          Scaffold ORG.md + openspawn.json
  -t, --template <name>       Template (assistant-team, dev-shop, etc.)
  -y, --yes                   Skip wizard, use defaults
  --deploy                    Generate Docker infrastructure

openspawn preview              Preview org in local sandbox
  --port <n>                  Dashboard port (default: 3333)
  --no-open                   Don't auto-open browser
  --mode <mode>               deterministic | hybrid | llm
  --verbose                   Show agent decisions in terminal

openspawn start                Start real coordinator (FastAPI + SQLite)
```

## Templates

```bash
openspawn init my-org -t assistant-team    # Chief of staff + specialists
openspawn init my-org -t dev-shop          # Engineering team
openspawn init my-org -t content-agency    # Content production pipeline
openspawn init my-org -t research-lab      # Research & analysis
openspawn init my-org -t saas-onboarding   # Customer onboarding
openspawn init my-org -t incident-response # Incident management
```

Run `openspawn init` (no flags) for the interactive wizard.

## ORG.md Reference

- **`# Org Name`** — Top-level heading is the org name
- **`## Culture`** — Preset, escalation speed, ack requirements
- **`## Policies`** — Per-agent budgets, alert thresholds
- **`## Structure`** — Agent hierarchy (required)
  - **`### Name — Role`** — Top-level agent or department
  - **`#### Name — Role`** — Agent under a department
- **`- **Level:** N`** — Authority level (1-10, higher = more authority)
- **`- **Domain:** name`** — Functional area
- **`- **Reports To:** parent-name`** — Override structural hierarchy
- **`- **Count:** N`** — Spawn N copies of an agent (e.g. worker pool)
- **`- **Model:** model-name`** — LLM model override for this agent

## What OpenSpawn Adds

|                    | With OpenSpawn              | Without              |
| ------------------ | --------------------------- | -------------------- |
| **Hierarchy**      | 10-level (L1-L10)           | Flat (lead/teammate) |
| **Budget control** | Per-agent limits + tracking | None                 |
| **Escalation**     | Typed chain of command      | Ad-hoc               |
| **Governance**     | Policies, approval gates    | None                 |
| **Framework**      | Any agent, any framework    | Single platform      |

## Works With

- **Claude Code** — via MCP
- **Cursor** — via MCP
- **Any MCP client** — Streamable HTTP or stdio
- **Any agent with shell access** — via CLI

## License

MIT — [OpenSpawn](https://github.com/openspawn/openspawn)
