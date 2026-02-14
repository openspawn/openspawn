---
title: CLI
layout: default
nav_order: 6
permalink: /cli/
---

# CLI Reference
{: .no_toc }

The BikiniBottom CLI scaffolds, configures, and runs your agent organization.

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Installation

```bash
# Use directly with npx (no install)
npx bikinibottom --help

# Or install globally
npm install -g bikinibottom
```

---

## Commands

### `bikinibottom init [name]`

Scaffold a new agent organization.

```bash
# Create in new directory
npx bikinibottom init my-org

# Create in current directory
npx bikinibottom init
```

**Creates:**

| File | Purpose |
|------|---------|
| `ORG.md` | Agent organization definition |
| `bikinibottom.config.json` | Server configuration |
| `.gitignore` | Standard ignores |

**Output:**

```
🍍 BikiniBottom initialized!

Created:
  ORG.md                 — Define your agent organization
  bikinibottom.config.json — Configuration
  .gitignore

Next steps:
  cd my-org
  1. Edit ORG.md to customize your agents
  2. Run: bikinibottom start
  3. Open: http://localhost:3333

Protocols enabled:
  🔗 A2A  → http://localhost:3333/.well-known/agent.json
  🔌 MCP  → http://localhost:3333/mcp
```

### `bikinibottom start`

Start the BikiniBottom server.

```bash
npx bikinibottom start
```

Reads `bikinibottom.config.json` and `ORG.md` from the current directory. Starts the server with:
- Real-time dashboard at `http://localhost:3333`
- A2A protocol at `http://localhost:3333/.well-known/agent.json`
- MCP tool server at `http://localhost:3333/mcp`

### `bikinibottom status`

Show server status.

```bash
npx bikinibottom status
```

### `bikinibottom demo`

Start with a built-in demo scenario (32 agents, pre-configured tasks).

```bash
npx bikinibottom demo
```

---

## ORG.md

Define your agent organization in Markdown. The CLI parses this to create your agent hierarchy.

```markdown
# My Agent Organization

## Identity
- Name: AcmeTech
- Mission: Build the best SaaS platform

## Structure

### CEO (Level 10)
- Name: The Boss
- Avatar: 👑
- Domain: operations
- Role: coo

### Engineering Lead (Level 7)
- Name: Tech Lead
- Avatar: 💻
- Domain: engineering
- Role: lead

### Frontend Developer (Level 4)
- Name: UI Builder
- Avatar: 🎨
- Domain: frontend
- Role: worker

### Backend Developer (Level 4)
- Name: API Builder
- Avatar: ⚙️
- Domain: backend
- Role: worker

### QA Engineer (Level 3)
- Name: Bug Hunter
- Avatar: 🔍
- Domain: testing
- Role: worker
```

### Agent Properties

| Property | Required | Description |
|----------|----------|-------------|
| Heading | ✅ | Agent title + `(Level N)` |
| Name | ✅ | Display name |
| Avatar | ❌ | Emoji avatar |
| Domain | ✅ | Specialization (engineering, marketing, finance, etc.) |
| Role | ✅ | `coo`, `lead`, or `worker` |

### Levels

| Level | Tier | Model Tier | Typical Role |
|-------|------|------------|-------------|
| 9–10 | Executive | Premium (Claude, GPT-4o) | CEO, COO |
| 7–8 | Lead | Mid-tier (Llama 70B) | Team leads, directors |
| 4–6 | Senior | Local/cheap (Qwen 7B, Llama 8B) | Senior ICs |
| 1–3 | Junior | Local (Qwen 7B) | Workers, interns |

---

## Configuration

`bikinibottom.config.json` reference:

```json
{
  "port": 3333,
  "orgFile": "ORG.md",
  "simulation": {
    "mode": "deterministic",
    "tickInterval": 3000,
    "startMode": "full"
  },
  "router": {
    "preferLocal": true,
    "providers": ["ollama", "groq"]
  },
  "protocols": {
    "a2a": true,
    "mcp": true
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `port` | `3333` | Server port |
| `orgFile` | `"ORG.md"` | Path to organization definition |
| `simulation.mode` | `"deterministic"` | Simulation engine mode |
| `simulation.tickInterval` | `3000` | Tick interval in ms |
| `simulation.startMode` | `"full"` | Start with all agents active |
| `router.preferLocal` | `true` | Prefer Ollama for worker agents |
| `router.providers` | `["ollama","groq"]` | Enabled LLM providers |
| `protocols.a2a` | `true` | Enable A2A protocol endpoints |
| `protocols.mcp` | `true` | Enable MCP tool server |

---

## Global Options

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
