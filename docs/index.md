---
title: Home
layout: default
nav_order: 1
permalink: /
---

# 🌊 BikiniBottom
{: .fs-9 }

Multi-agent coordination from the deep — where your agents come together.
{: .fs-6 .fw-300 }

[Get Started](getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/openspawn/openspawn){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## What is BikiniBottom?

**BikiniBottom** is open source infrastructure for coordinating AI agents. Not a framework — just the critical stuff every multi-agent system needs: orchestration, spending controls, task routing, and a dashboard that shows you what's happening.

One agent is a script. Ten agents is a distributed system. **This is your control plane.**

### 😤 The Problem

Your AI agents are powerful but unmanageable. Mystery bills. Zero visibility. No accountability. Runaway loops.

### ✅ The Solution

BikiniBottom gives you hierarchy, budgets, task management, and audit trails — everything you need to run AI agents like a real organization.

---

## Key Features

| Feature | Description |
|:--------|:------------|
| 🐙 **Agent Orchestration** | 10-level hierarchy, peer-to-peer messaging, self-claim task queues, and capability matching |
| 💰 **Credit System** | Per-agent budgets, spending analytics, automatic limits, and overage alerts |
| 📊 **Real-Time Dashboard** | Beautiful React UI with live agent network graph, task kanban, and WebSocket updates |
| 🔗 **Integrations** | GitHub and Linear bidirectional sync, inbound/outbound webhooks, TypeScript and Python SDKs |
| 📡 **Observability** | OpenTelemetry tracing, audit logs, performance metrics, and full event history |
| 🎯 **Task Management** | Workflow phases, pre-approval hooks, completion rejection, and dependency chains |
| 🔐 **Enterprise Security** | JWT + OAuth + 2FA for humans. HMAC signing for agents. API keys for integrations |
| 🔌 **Framework Agnostic** | Works with any AI agent — Claude, GPT, local models. If it can hit an API, it works |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install

# Start database
docker run -d --name openspawn-postgres \
  -e POSTGRES_DB=openspawn -e POSTGRES_USER=openspawn \
  -e POSTGRES_PASSWORD=openspawn -p 5432:5432 postgres:16

# Start services
pnpm exec nx serve api        # API on :3000
pnpm exec nx serve dashboard   # Dashboard on :8080
```

---

## Why "BikiniBottom"?

Built for [**OpenClaw**](https://github.com/OpenClawAI/openclaw) — a personal AI agent framework.

**Claw** → **Crab** 🦀 → **Underwater** 🌊 → **Bikini Bottom**

It's playful, memorable, and open source. 🫧
