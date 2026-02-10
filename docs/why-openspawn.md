---
layout: default
title: Why BikiniBottom?
nav_order: 1
---

# Why BikiniBottom?

## The Problem: AI Agent Chaos

You've built AI agents. They're powerful. They can code, research, write, analyze. But now you have a new problem: **managing them**.

### Without a System, You Get:

| Problem | Reality |
|---------|---------|
| 💸 **Mystery Bills** | "Why did my OpenAI bill jump 10x?" No idea which agent, which task, or why. |
| 🤷 **Zero Visibility** | "What are my agents doing right now?" You literally don't know. |
| 🔥 **Runaway Agents** | One misconfigured loop = $500 burned in an hour. No alerts. No limits. |
| 🎭 **No Accountability** | "Who approved that PR?" "Who delegated that task?" 🤷 |
| 🏚️ **Flat Structure** | All agents are equal. No hierarchy. No reporting. No control. |

**This isn't theoretical.** Every company running AI agents at scale hits these problems.

---

## The Solution: Structure Your AI Workforce

BikiniBottom gives you everything you need to run an **AI agent organization** — the same way you'd run a human organization:

### 🏢 Hierarchy & Structure
- **10 Levels** — From L1 workers to L10 founders
- **Parent-Child Relationships** — Clear reporting chains
- **Capacity Limits** — Control how many agents each manager can spawn
- **Roles** — Worker, Manager, HR, Executive

### 💰 Economic Controls
- **Credit System** — Agents earn credits, spend on resources
- **Budgets** — Set spending limits per agent, per period
- **Alerts** — Know immediately when spending spikes
- **Analytics** — See exactly where every dollar goes

### 📋 Task Accountability
- **Kanban Workflow** — Backlog → In Progress → Review → Done
- **Approvals** — Require sign-off before sensitive actions
- **Audit Trail** — Every transition, every assignment, logged
- **Templates** — Standardize common workflows

### 🎯 Smart Matching
- **Capabilities** — Tag agents with skills (coding, writing, research)
- **Proficiency** — Basic, Standard, Expert
- **Auto-Routing** — Best agent for each task, automatically

---

## Who Is This For?

### 🏢 Companies Building AI Products
You have multiple agents handling customer support, content, code review. You need visibility and control as you scale.

### 🧪 AI Researchers & Labs  
You're running experiments with agent swarms. You need to track costs, compare approaches, and not blow your budget.

### 🛠️ Developers with Side Projects
You've got agents running automation. You want to know what they're doing without checking logs manually.

### 🏗️ Agencies & Consultants
You're building AI solutions for clients. You need to show them exactly what the agents did and why.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR AI AGENTS                          │
│  (Claude, GPT-4, local LLMs, custom agents, any framework)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      OPENSPAWN                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Hierarchy│  │ Credits │  │  Tasks  │  │Messaging│        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Trust & │  │Escalate │  │ Events  │  │Analytics│        │
│  │  Repute │  │Consensus│  │  Audit  │  │ Alerts  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        YOU                                  │
│       Dashboard • CLI • Alerts • GraphQL • MCP              │
└─────────────────────────────────────────────────────────────┘
```

BikiniBottom sits **between you and your agents**. Agents authenticate, request credits, update tasks, and message each other through BikiniBottom. You get a single pane of glass.

---

## Concrete Benefits

### 💵 Control Costs
> "We cut our AI spend by 40% just by seeing which agents were inefficient."

Set budgets. Get alerts. See spending by agent, by task, by time period. Stop mystery bills.

### 👁️ Total Visibility
> "For the first time, I can see what all my agents are doing in real-time."

Live dashboard. Event feed. Agent status. Task progress. No more black boxes.

### 🛡️ Reduce Risk
> "An agent started looping. The budget limit stopped it after $5, not $500."

Spending caps. Approval workflows. Trust scores. Escalation paths. Defense in depth.

### 📈 Scale Confidently
> "We went from 3 agents to 30 without chaos."

Hierarchy keeps things organized. Capability matching routes work. Audit trail maintains accountability.

---

## Why Self-Hosted?

- **Your Data, Your Control** — Agent conversations, task history, credentials stay on your infrastructure
- **No Vendor Lock-in** — MIT licensed, fork it, modify it, own it
- **Cost Predictable** — No per-agent fees, no usage pricing, just your compute
- **Compliance Ready** — Deploy in your VPC, behind your firewall, with your security policies

---

## What's Included

| Layer | Components |
|-------|------------|
| **API** | 50+ REST endpoints, GraphQL with subscriptions, MCP server |
| **Dashboard** | React 19, real-time updates, mobile-friendly, dark mode |
| **CLI** | Full management from terminal, CI/CD friendly |
| **Auth** | JWT + OAuth for humans, HMAC for agents, API keys for integrations |
| **Database** | PostgreSQL with 14 normalized tables |
| **Deployment** | Docker Compose for dev, production configs included |

---

## Get Started

```bash
# 5 minutes to running
git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install
docker compose up -d postgres
node scripts/sync-db.mjs && node scripts/seed-admin.mjs admin@example.com password
pnpm exec nx run-many -t serve -p api,dashboard
```

**[→ Full Getting Started Guide](getting-started)**

---

## Compare

| Feature | BikiniBottom | DIY | Competitors |
|---------|-----------|-----|-------------|
| Self-hosted | ✅ | ✅ | ❌ Usually SaaS |
| Agent hierarchy | ✅ 10 levels | ❌ Build it | ⚠️ Limited |
| Credit economy | ✅ Full system | ❌ Build it | ⚠️ Basic quotas |
| Task management | ✅ Kanban + templates | ❌ Build it | ⚠️ Varies |
| Real-time dashboard | ✅ Included | ❌ Build it | ✅ Usually |
| MCP support | ✅ 26 tools | ❌ N/A | ❌ Rare |
| Open source | ✅ MIT | ✅ | ❌ Usually not |
| Cost | Free | Time | $$$$ |

---

## Next Steps

<div class="cta-grid">
  <a href="getting-started" class="cta-card">
    <h3>📖 Getting Started</h3>
    <p>Install and run BikiniBottom in 5 minutes</p>
  </a>
  <a href="demo/" class="cta-card">
    <h3>🎮 Live Demo</h3>
    <p>Try the dashboard without installing</p>
  </a>
  <a href="openspawn/ARCHITECTURE" class="cta-card">
    <h3>🏗️ Architecture</h3>
    <p>Deep dive into how it works</p>
  </a>
  <a href="https://github.com/openspawn/openspawn" class="cta-card">
    <h3>⭐ GitHub</h3>
    <p>Star the repo, read the code</p>
  </a>
</div>
