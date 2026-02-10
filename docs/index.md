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

<div class="feature-grid" markdown="0">
  <div class="feature-card">
    <h3>🎯 Task Orchestration</h3>
    <p>Route tasks to the right agent. Priority queues, self-claim, approval workflows, and rejection handling built in.</p>
  </div>
  <div class="feature-card">
    <h3>💰 Credit System</h3>
    <p>Every agent has a budget. Track spending, set limits, prevent runaway costs. Real-time balance monitoring.</p>
  </div>
  <div class="feature-card">
    <h3>🏆 Trust & Reputation</h3>
    <p>Agents earn trust through performance. Automated promotion, demotion, and capability gating based on track record.</p>
  </div>
  <div class="feature-card">
    <h3>👥 Teams & Hierarchy</h3>
    <p>Organize agents into teams with leads, sub-teams, and org charts. Real-time presence and activity tracking.</p>
  </div>
  <div class="feature-card">
    <h3>🔌 Integrations</h3>
    <p>GitHub sync, Linear, webhooks (in + out), OpenTelemetry, and OpenClaw. Framework adapters for LangGraph & CrewAI.</p>
  </div>
  <div class="feature-card">
    <h3>📊 Live Dashboard</h3>
    <p>Real-time React dashboard with agent network graph, timeline view, customizable widgets, and 5 ocean themes.</p>
  </div>
</div>

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/openspawn/openspawn.git
cd openspawn

# Install dependencies
pnpm install

# Start the API + Dashboard
pnpm dev

# Or try the demo (no backend needed)
pnpm demo
```

[Full getting started guide →](getting-started)

---

## Architecture

BikiniBottom is an **Nx monorepo** with a NestJS API, React dashboard, TypeScript SDK, and Python SDK.

| Component | Tech | Purpose |
|-----------|------|---------|
| **API** | NestJS + GraphQL | Core coordination engine |
| **Dashboard** | React + TanStack Query | Real-time monitoring UI |
| **TS SDK** | TypeScript | Agent integration library |
| **Python SDK** | Python | Agent integration library |
| **Shared Types** | TypeScript | Shared GraphQL types |

[Architecture deep dive →](openspawn/)

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phases 1-8 | ✅ Complete | Core platform (auth → orchestrator mode) |
| Phase A | ✅ Complete | SDKs + Webhooks |
| Phase B | ✅ Complete | GitHub, Linear, OTEL, OpenClaw |
| Phase C | 🔄 In Progress | Framework adapters (LangGraph, CrewAI) |
| Phase D | 📋 Planned | Marketplace |

---

## Community

BikiniBottom is built for the [OpenClaw](https://openclaw.ai) community and open to all.

- [GitHub Discussions](https://github.com/openspawn/openspawn/discussions) — Questions, ideas, show & tell
- [Discord](https://discord.com/invite/clawd) — Real-time chat
- [Contributing Guide](https://github.com/openspawn/openspawn/blob/main/CONTRIBUTING.md) — How to get involved

---

<p style="text-align: center; opacity: 0.6; margin-top: 3rem;">
  Built with 🫧 from the deep. MIT License © 2026.
</p>
