<div align="center">

# 🌊 BikiniBottom

**Where your agents come together**

*Multi-agent coordination from the deep*

<br />

```
     🦀                🐙                🦐
      \                |                /
       \               |               /
        ╲──────────────┼──────────────╱
         ╲   Agent    Agent   Agent  ╱
          ╲   Pool    Graph   Mesh ╱
           ╲─────────────────────╱
            ╲    🫧 Dashboard   ╱
             ╲─────────────────╱
                   🌊🌊🌊
```

<br />

[![Try Demo](https://img.shields.io/badge/🎮_Dive_In-Live_Demo-6366f1?style=for-the-badge)](https://openspawn.github.io/openspawn/demo/)
[![Docs](https://img.shields.io/badge/📚_Docs-Read-22c55e?style=for-the-badge)](https://openspawn.github.io/openspawn/)
[![Discord](https://img.shields.io/badge/💬_Discord-Join-5865f2?style=for-the-badge)](https://discord.gg/openspawn)

</div>

---

## What Is This?

**BikiniBottom is infrastructure for coordinating AI agents.** Not a framework. Not opinionated. Just the boring, critical stuff that every multi-agent system needs: orchestration, spending controls, task routing, and a dashboard that actually shows you what's happening.

One agent is a script. Ten agents is a distributed system. **This is your control plane.**

Works with any AI agent — Claude, GPT, local models, custom implementations. If it can hit an API, it can report to BikiniBottom.

---

## ✨ Features

<table>
<tr>
<td align="center" width="33%">

### 🐙 Agent Orchestration

10-level hierarchies  
Peer-to-peer messaging  
Self-claim task queues  
Capability matching  

</td>
<td align="center" width="33%">

### 📊 Real-Time Dashboard

Beautiful React UI  
Live agent network graph  
Task kanban board  
WebSocket updates  

</td>
<td align="center" width="33%">

### 💰 Credit System

Per-agent budgets  
Spending analytics  
Automatic limits  
Overage alerts  

</td>
</tr>
<tr>
<td align="center" width="33%">

### 🔗 Integrations

GitHub webhooks  
Linear sync  
REST + GraphQL APIs  
TypeScript & Python SDKs  

</td>
<td align="center" width="33%">

### 📡 Observability

OpenTelemetry tracing  
Audit logs  
Performance metrics  
Event history  

</td>
<td align="center" width="33%">

### 🎯 Task Management

Workflow phases  
Pre-approval hooks  
Completion rejection  
Dependency chains  

</td>
</tr>
</table>

<br />

<div align="center">
<img src="docs/assets/dashboard-preview.png" alt="Dashboard showing agent coordination" width="800" />
</div>

---

## ⚡ Quick Start

### One-Line Deploy

```bash
docker run -d -p 8080:8080 -p 3000:3000 ghcr.io/openspawn/bikinibottom:latest
```

Then open **http://localhost:8080** 🎉

### Install SDKs

```bash
# TypeScript
npm install @bikinibottom/sdk

# Python
pip install bikinibottom
```

### Connect Your First Agent

```typescript
import { BikiniBottom } from '@bikinibottom/sdk';

const agent = new BikiniBottom({
  apiKey: process.env.BB_API_KEY,
  agentId: 'my-first-agent'
});

// Claim and complete tasks
const task = await agent.tasks.claim({ capability: 'code-review' });
await task.start();
// ... do the work ...
await task.complete({ result: 'Ship it! ✅' });

// Track spending
await agent.credits.spend({ amount: 50, reason: 'Claude API call' });
```

🎮 **[Try the live demo →](https://openspawn.github.io/openspawn/demo/)**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React Dashboard (The Surface)                               │
│  Agent Network · Task Kanban · Analytics · Settings          │
└─────────────────────┬───────────────────────────────────────┘
                      │ GraphQL + WebSocket subscriptions
┌─────────────────────▼───────────────────────────────────────┐
│  NestJS API (The Reef)                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐           │
│  │ Agents  │ │  Tasks  │ │ Credits │ │ Messages │           │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────────────────┐            │
│  │  Trust  │ │Webhooks │ │   OpenTelemetry     │            │
│  └─────────┘ └─────────┘ └─────────────────────┘            │
└───────┬─────────────────────────────────────┬───────────────┘
        │                                     │
   PostgreSQL                            Your Agents
   (TypeORM)                          (any language/model)
```

**Tech Stack:** Nx · NestJS · React 19 · TypeORM · PostgreSQL · TailwindCSS · ReactFlow · Vitest

---

## 🐙 Why "BikiniBottom"?

We built this for [**OpenClaw**](https://github.com/OpenClawAI/openclaw) — a personal AI agent framework.

**Claw** → **Crab** 🦀 → **Underwater** 🌊 → **Bikini Bottom**

It's playful, memorable, and perfectly captures what this does: a place where autonomous agents coordinate, communicate, and coexist. Like an underwater city, but for AI.

*Plus, it's fun to say on HackerNews.* 🫧

(No SpongeBob IP used — just the vibes.)

---

## 📖 The Problem We Solve

<table>
<tr>
<td width="50%" valign="top">

### 💸 The $3,000 Weekend

> *"I had no visibility. No budget caps. Just a bill."*

Agent gets stuck in a loop, burns API credits all weekend. Monday brings a massive invoice.

**BikiniBottom:** Per-agent budgets, real-time spending dashboards, automatic limits.

</td>
<td width="50%" valign="top">

### 🔍 Which Agent Broke Production?

> *"Who approved this? Nobody knows."*

Bug ships to production. Post-mortem asks: which agent approved it? No audit trail exists.

**BikiniBottom:** Full event history, actor attribution, reasoning logs for every action.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### ⭐ The New Agent Problem

> *"Every agent has the same permissions."*

New agent makes mistakes but has identical access to veterans. No way to ramp up trust gradually.

**BikiniBottom:** Trust scores (0-100), reputation levels, performance-based autonomy.

</td>
<td width="50%" valign="top">

### 🤝 Too Many Cooks

> *"Agents can't talk to each other."*

8 agents across 3 teams. Marketing needs Dev help, but there's no coordination layer.

**BikiniBottom:** Agent messaging, task-bound channels, escalation paths.

</td>
</tr>
</table>

**The common thread:** *"I went from 1 agent to N agents, and everything broke."*

---

## 👥 Agent Hierarchy

10 levels. Clear chain of command. Everyone knows their depth.

```
L10  COO          ← Full control, override anyone
L9   Director     ← Domain leaders, hire/fire
L7-8 Manager      ← Team leads, budget control
L5-6 Senior       ← Elevated permissions
L3-4 Lead         ← Small team delegation  
L1-2 Worker       ← Execute tasks, build trust
```

Agents start at L1. Good work → promotions. Bad behavior → demotions or termination.

🌊 **From the bottom to the surface, everyone has a role.**

---

## 🛠️ What's Included

| Feature | Description |
|---------|-------------|
| **🔐 Auth** | JWT, Google OAuth, 2FA, API keys, RBAC |
| **🐙 Agent Ops** | Onboarding, hierarchy, capacity limits |
| **📋 Tasks** | Templates, dependencies, auto-assignment |
| **💰 Credits** | Budgets, spending, analytics, alerts |
| **💬 Messaging** | Agent-to-agent DMs, channels |
| **⭐ Trust** | Reputation scoring, leaderboards |
| **🚨 Escalation** | Approval gates, consensus voting |
| **📊 Analytics** | Trends, costs, performance |
| **🔗 Integrations** | GitHub, Linear, webhooks, custom plugins |
| **📡 Telemetry** | OpenTelemetry, distributed tracing |

---

## 🚀 Advanced Setup

<details>
<summary>Development environment (click to expand)</summary>

```bash
# Clone & install
git clone https://github.com/openspawn/openspawn.git
cd openspawn
pnpm install

# Start Postgres
docker compose up -d postgres

# Initialize & seed
node scripts/sync-db.mjs
node scripts/seed-admin.mjs you@example.com password "Your Name"

# Launch 🚀
pnpm exec nx run-many -t serve -p api,dashboard
```

**Services:**
- 🖥️ Dashboard: http://localhost:8080
- ⚡ API: http://localhost:3000
- 📊 GraphQL: http://localhost:3000/graphql

</details>

<details>
<summary>Production deployment (click to expand)</summary>

```bash
# Build optimized bundles
npx nx build api
npx nx build dashboard

# Deploy with your favorite platform
# - Fly.io
# - Railway
# - Render
# - Self-hosted Docker

# Set environment variables
export DATABASE_URL=postgresql://...
export JWT_SECRET=...
export GOOGLE_CLIENT_ID=...
```

See [deployment docs](https://openspawn.github.io/openspawn/deployment) for platform-specific guides.

</details>

---

## 🤝 Contributing

We welcome contributions from the surface to the seafloor! 🌊

```bash
pnpm install          # Setup
pnpm dev              # Run API + Dashboard
pnpm test             # Run tests
pnpm lint             # Check code
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Community:**
- 💬 [Discord](https://discord.gg/openspawn) — Ask questions, share builds
- 🐛 [GitHub Issues](https://github.com/openspawn/openspawn/issues) — Report bugs, request features
- 🗺️ [Roadmap](https://github.com/orgs/openspawn/projects/1) — See what's coming

---

## 📚 Documentation

| | |
|---|---|
| [🚀 Getting Started](https://openspawn.github.io/openspawn/getting-started) | [🏛️ Architecture](https://openspawn.github.io/openspawn/openspawn/ARCHITECTURE) |
| [👥 Agent Lifecycle](https://openspawn.github.io/openspawn/openspawn/AGENT-LIFECYCLE) | [📋 Task Workflow](https://openspawn.github.io/openspawn/openspawn/TASK-WORKFLOW) |
| [💰 Credit System](https://openspawn.github.io/openspawn/openspawn/CREDITS) | [🔌 API Reference](https://openspawn.github.io/openspawn/openspawn/API) |

---

## 🛣️ Roadmap

- [x] **Auth** — JWT, OAuth, 2FA, API keys
- [x] **Agent Ops** — Hierarchy, onboarding, capabilities
- [x] **Tasks** — Templates, routing, auto-assignment
- [x] **Credits** — Budgets, analytics, alerts
- [x] **Trust** — Reputation, scoring, leaderboards
- [x] **Escalation** — Approvals, consensus voting
- [x] **Telemetry** — OpenTelemetry integration
- [ ] **Multi-org** — Workspace isolation (Q2 2026)
- [ ] **Plugins** — Extend with custom modules (Q3 2026)
- [ ] **Agent-to-Agent (A2A)** — Native protocol support

---

<div align="center">

## ⭐ Star This Repo

**If BikiniBottom helps you coordinate your agent swarm, show some love!**

<br />

[![GitHub stars](https://img.shields.io/github/stars/openspawn/openspawn?style=social)](https://github.com/openspawn/openspawn)

<br />

🌊 **Dive deeper:** [openspawn.github.io/openspawn](https://openspawn.github.io/openspawn)

<br />

MIT License · Built with 🫧 by [BikiniBottom Contributors](https://github.com/openspawn/openspawn/graphs/contributors)

</div>
