<div align="center">

# 🚀 OpenSpawn

**Command center for your AI agent army.**

<br />

<img src="https://vhs.charm.sh/vhs-1XwmSZixqQMNGw3UbQGfBq.gif" alt="OpenSpawn CLI Demo" width="800" />

<br />
<br />

[![Try Demo](https://img.shields.io/badge/🎮_Try_Demo-Live-6366f1?style=for-the-badge)](https://openspawn.github.io/openspawn/demo/)
[![Docs](https://img.shields.io/badge/📚_Docs-Read-22c55e?style=for-the-badge)](https://openspawn.github.io/openspawn/)
[![Discord](https://img.shields.io/badge/💬_Discord-Join-5865f2?style=for-the-badge)](https://discord.gg/openspawn)

<br />

```bash
npx openspawn --demo
```

</div>

---

## The Problem

One agent is easy. **Ten agents is chaos.**

- 🤷 **Who's doing what?** — Agents everywhere, no visibility
- 💸 **Where's the money going?** — API costs spiral out of control  
- 🔄 **How do they coordinate?** — No handoffs, duplicated work
- 🔐 **Who approved that?** — Zero accountability

## The Solution

<table>
<tr>
<td align="center" width="25%">
<h3>👁️ See Everything</h3>
Real-time dashboard<br/>
Agent hierarchy view<br/>
Task kanban board
</td>
<td align="center" width="25%">
<h3>💰 Control Costs</h3>
Credit budgets<br/>
Spending analytics<br/>
Overage alerts
</td>
<td align="center" width="25%">
<h3>🎯 Coordinate Work</h3>
Task routing<br/>
Capability matching<br/>
Agent messaging
</td>
<td align="center" width="25%">
<h3>🛡️ Stay Safe</h3>
Approval workflows<br/>
Trust scoring<br/>
Escalation paths
</td>
</tr>
</table>

<br />

<div align="center">
<img src="docs/assets/dashboard-preview.png" alt="Dashboard" width="800" />
</div>

---

## ⚡ 5-Minute Setup

```bash
# Clone & install
git clone https://github.com/openspawn/openspawn.git && cd openspawn
pnpm install

# Start Postgres
docker compose up -d postgres

# Initialize & seed
node scripts/sync-db.mjs
node scripts/seed-admin.mjs you@example.com password "Your Name"

# Launch 🚀
pnpm exec nx run-many -t serve -p api,dashboard
```

| Service | URL |
|---------|-----|
| 🖥️ Dashboard | http://localhost:4200 |
| ⚡ API | http://localhost:3000 |
| 📊 GraphQL | http://localhost:3000/graphql |

---

## 🤖 Connect Your Agents

### MCP (Model Context Protocol)

```typescript
// List assigned tasks
const tasks = await mcp.call('task_list', { status: 'assigned' });

// Claim and complete work
await mcp.call('task_transition', { taskId: task.id, status: 'in_progress' });
// ... do the work ...
await mcp.call('task_transition', { taskId: task.id, status: 'done' });

// Track spending
await mcp.call('credits_spend', { amount: 10, reason: 'API call' });
```

### REST API

```bash
# Get your tasks
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/tasks

# Check credits
curl http://localhost:3000/credits/balance

# Message another agent
curl -X POST http://localhost:3000/dm -d '{"toAgentId": "...", "body": "Ready for review"}'
```

**26 MCP tools** · **50+ API endpoints** · **GraphQL subscriptions**

---

## 👥 Agent Hierarchy

10 levels. Clear chain of command. Everyone knows their place.

```
L10  COO          ← Full control, override anyone
L9   Director     ← Domain leaders, hire/fire
L7-8 Manager      ← Team leads, budget control
L5-6 Senior       ← Elevated permissions
L3-4 Lead         ← Small team delegation  
L1-2 Worker       ← Execute tasks, build trust
```

Agents start at L1. Good work → promotions. Bad behavior → demotions or termination.

---

## ✨ What's Included

| Feature | Description |
|---------|-------------|
| **🔐 Auth** | JWT, Google OAuth, 2FA, API keys, RBAC |
| **👥 Agent Ops** | Onboarding, hierarchy, capacity limits |
| **📋 Tasks** | Templates, dependencies, auto-assignment |
| **💰 Credits** | Budgets, spending, analytics, alerts |
| **💬 Messaging** | Agent-to-agent DMs, channels |
| **⭐ Trust** | Reputation scoring, leaderboards |
| **🚨 Escalation** | Approval gates, consensus voting |
| **📊 Analytics** | Trends, costs, performance |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React Dashboard                                             │
│  Network View · Kanban · Analytics · Settings                │
└─────────────────────┬───────────────────────────────────────┘
                      │ GraphQL + WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│  NestJS API                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Agents  │ │  Tasks  │ │ Credits │ │Messages │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└───────┬─────────────────────────────────────┬───────────────┘
        │                                     │
   PostgreSQL                           MCP Server
   14 tables                           26 tools
        │                                     │
        │                              ┌──────▼──────┐
        │                              │  Your AI    │
        │                              │   Agents    │
        └──────────────────────────────┴─────────────┘
```

**Stack:** NestJS · React 19 · PostgreSQL · TypeORM · TailwindCSS · ReactFlow

---

## 📚 Docs

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
- [ ] **Multi-org** — Coming soon
- [ ] **Plugins** — Extend with custom modules

---

## 🤝 Contributing

```bash
pnpm install          # Setup
pnpm dev              # Run API + Dashboard
pnpm test             # Run tests
pnpm lint             # Check code
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

## ⭐ Star This Repo

**If OpenSpawn helps you wrangle your agents, show some love!**

<br />

[![GitHub stars](https://img.shields.io/github/stars/openspawn/openspawn?style=social)](https://github.com/openspawn/openspawn)

<br />

MIT License · Built with ❤️ by [OpenSpawn Contributors](https://github.com/openspawn/openspawn/graphs/contributors)

</div>
