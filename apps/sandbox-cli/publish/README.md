# OpenSpawn

**Coordination layer for AI agent organizations.**

Define your entire agent org — roles, hierarchy, culture, policies, and playbooks — in a single markdown file. OpenSpawn parses it, spawns agents, routes tasks through the hierarchy, and gives you a real-time dashboard.

[![npm version](https://img.shields.io/npm/v/openspawn)](https://www.npmjs.com/package/openspawn)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Quick Start

```bash
npx openspawn init my-org
cd my-org
```

This creates an `ORG.md` file with a starter organization. Edit it to define your agents, then run the sandbox to see them coordinate.

### Templates

```bash
npx openspawn init my-org                        # startup (default)
npx openspawn init my-agency --template agency   # creative agency
npx openspawn init my-devops --template devops   # infrastructure team
```

## What is OpenSpawn?

OpenSpawn is **infrastructure, not a framework.** It doesn't replace CrewAI, LangGraph, AutoGen, or OpenClaw — it coordinates agents built with any of them.

Think of it as the **org chart and HR department** for your AI workforce.

### The Core Idea: ORG.md

Everything starts with a single markdown file:

```markdown
# My Company

## Identity

We build developer tools.

## Culture

preset: startup

## Structure

### COO

Operational lead. Delegates to department heads.

- **Level:** 9
- **Domain:** operations

#### Engineering Lead

Triages technical work.

- **Level:** 7
- **Domain:** engineering

##### Workers

Write code, run tests, build APIs.

- **Level:** 5
- **Pool:** 3

## Policies

- Budget approval required above 1000 credits
- Escalation required for cross-department dependencies

## Playbooks

### New Feature Request

1. Research Lead evaluates feasibility
2. Engineering Lead creates task breakdown
3. Workers implement and test
4. COO reviews and approves
```

## CLI Commands

```bash
openspawn init [name]           # Scaffold a new organization
openspawn agents list           # List all agents in the org
openspawn agents register       # Register a new agent
openspawn tasks list            # List all tasks
openspawn tasks create          # Create a new task
openspawn credits balance       # Check credit balances
openspawn messages send         # Send a message between agents
```

Use `--demo` flag with any command to try with mock data (no API required):

```bash
openspawn agents list --demo
openspawn tasks list --demo
```

## Key Features

### Organizational Structure

Define roles, hierarchy, and reporting chains in markdown. Agents know who they report to, who reports to them, and what decisions they can make.

### Task Coordination

Built-in task routing with atomic claiming, delegation up/down the hierarchy, and automatic escalation when agents are stuck or over budget.

### Protocol Native

- **MCP** (Model Context Protocol) — 30+ coordination tools via Streamable HTTP
- **A2A** (Agent-to-Agent) — Google's A2A v0.3 for cross-system agent communication

### Economic Layer

Budget management, trust scores, and performance tracking per agent. Agents earn trust by completing tasks successfully.

### Real-Time Dashboard

See your entire agent organization in real time — who's working on what, task throughput, escalations, and bottlenecks.

### Simulation Modes

- **Deterministic** — $0 cost, reproducible coordination patterns
- **Hybrid** — Real LLM decisions for L7+ agents
- **Record** — Capture a live run for replay
- **Replay** — Play back recorded scenarios (great for demos)

### Framework Agnostic

OpenSpawn coordinates. Your agents execute. Works with CrewAI, LangGraph, AutoGen, Semantic Kernel, OpenClaw, or raw API calls.

## Architecture

```
ORG.md  ──▶  Coordinator  ──▶  Dashboard
              (sandbox)        (real-time)
                  │
              Agents
           (any framework)
```

- **ORG.md** — Parsed into a typed agent hierarchy
- **Coordinator** — Routes tasks, handles escalation, manages budgets
- **Agents** — Execute work using any framework
- **Dashboard** — Real-time visualization of the entire organization

## Agent Levels

| Level | Role          | Capabilities                                    |
| ----- | ------------- | ----------------------------------------------- |
| L1-L3 | Intern/Junior | Execute assigned tasks, poll for work           |
| L4-L6 | Mid-level     | Claim tasks, basic delegation                   |
| L7-L8 | Senior/Lead   | Event-driven, spawn sub-agents, manage teams    |
| L9    | Director/VP   | Cross-department coordination, budget authority |
| L10   | CEO           | Full organizational authority                   |

## Live Demo

See OpenSpawn in action at [bikinibottom.ai](https://bikinibottom.ai) — 22 SpongeBob-themed agents coordinate to deliver 10,000 Krabby Patties.

## Links

- [Website](https://openspawn.ai)
- [Live Demo](https://bikinibottom.ai)
- [Documentation](https://openspawn.ai/docs/getting-started)
- [GitHub](https://github.com/openspawn/openspawn)
- [ORG.md Reference](https://openspawn.ai/docs/reference/org-md-reference)
- [MCP Integration](https://openspawn.ai/docs/protocols/mcp)

## Contributing

See [CONTRIBUTING.md](https://github.com/openspawn/openspawn/blob/main/CONTRIBUTING.md). AI-assisted PRs are welcome.

## License

MIT
