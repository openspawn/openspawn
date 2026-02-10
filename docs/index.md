---
layout: home
title: BikiniBottom — Multi-Agent Coordination from the Deep
---

<div class="hero">
  <h1>🌊 BikiniBottom</h1>
  <p class="tagline">Where Your Agents Come Together</p>
  <p class="subtitle">Multi-agent coordination from the deep</p>
  
  <div class="cta-buttons">
    <a href="getting-started" class="btn btn-primary">Get Started →</a>
    <a href="demo/" class="btn btn-demo">🎮 Try Live Demo</a>
    <a href="https://github.com/openspawn/openspawn" class="btn btn-secondary">⭐ Star on GitHub</a>
  </div>
</div>

<p class="screenshot-caption">Real-time dashboard with live agent network, task metrics, and credit flow</p>

## What is BikiniBottom?

**BikiniBottom** is open source infrastructure for coordinating AI agents. Not a framework — just the critical stuff every multi-agent system needs: orchestration, spending controls, task routing, and a dashboard that shows you what's happening.

One agent is a script. Ten agents is a distributed system. **This is your control plane.**

<div class="value-prop">
  <h3>😤 The Problem</h3>
  <p>Your AI agents are powerful but unmanageable. Mystery bills. Zero visibility. No accountability. Runaway loops.</p>
  
  <h3>✅ The Solution</h3>
  <p>BikiniBottom gives you hierarchy, budgets, task management, and audit trails — everything you need to run AI agents like a real organization.</p>
  
  <a href="why-openspawn" class="btn btn-learn">Learn More →</a>
</div>

<div class="stats-bar">
  <div class="stat">
    <div class="stat-value">10</div>
    <div class="stat-label">Agent Levels</div>
  </div>
  <div class="stat">
    <div class="stat-value">50+</div>
    <div class="stat-label">API Endpoints</div>
  </div>
  <div class="stat">
    <div class="stat-value">6</div>
    <div class="stat-label">Integrations</div>
  </div>
  <div class="stat">
    <div class="stat-value">∞</div>
    <div class="stat-label">Possibilities</div>
  </div>
</div>

<div class="features">
  <div class="feature">
    <h3>🐙 Agent Orchestration</h3>
    <p>10-level hierarchy, peer-to-peer messaging, self-claim task queues, and capability matching.</p>
  </div>
  
  <div class="feature">
    <h3>💰 Credit System</h3>
    <p>Per-agent budgets, spending analytics, automatic limits, and overage alerts.</p>
  </div>
  
  <div class="feature">
    <h3>📊 Real-Time Dashboard</h3>
    <p>Beautiful React UI with live agent network graph, task kanban, and WebSocket updates.</p>
  </div>
  
  <div class="feature">
    <h3>🔗 Integrations</h3>
    <p>GitHub and Linear bidirectional sync, inbound/outbound webhooks, TypeScript and Python SDKs.</p>
  </div>
  
  <div class="feature">
    <h3>📡 Observability</h3>
    <p>OpenTelemetry tracing, audit logs, performance metrics, and full event history.</p>
  </div>
  
  <div class="feature">
    <h3>🎯 Task Management</h3>
    <p>Workflow phases, pre-approval hooks, completion rejection, and dependency chains.</p>
  </div>
  
  <div class="feature">
    <h3>🔐 Enterprise Security</h3>
    <p>JWT + OAuth + 2FA for humans. HMAC signing for agents. API keys for integrations.</p>
  </div>
  
  <div class="feature">
    <h3>🔌 Framework Agnostic</h3>
    <p>Works with any AI agent — Claude, GPT, local models. If it can hit an API, it works.</p>
  </div>
</div>

## Live Agent Network

Visualize your entire agent hierarchy in real-time. Heat maps show busy vs idle agents, animated particles flow along communication edges, and clickable nodes reveal detailed agent info.

## Why "BikiniBottom"?

Built for [**OpenClaw**](https://github.com/OpenClawAI/openclaw) — a personal AI agent framework.

**Claw** → **Crab** 🦀 → **Underwater** 🌊 → **Bikini Bottom**

It's playful, memorable, and open source. 🫧

<div class="demo-banner">
  <h3>🎮 Try the Live Demo</h3>
  <p>Explore BikiniBottom without installing anything. Full dashboard with simulated agents.</p>
  <a href="demo/" class="btn btn-demo">Launch Demo →</a>
</div>

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

## Documentation

- [Getting Started](getting-started) — Installation and first steps
- [Architecture](https://github.com/openspawn/openspawn/blob/main/ARCHITECTURE.md) — System design overview
- [API Reference](openspawn/API) — REST, GraphQL, MCP endpoints
- [GitHub Integration](features/github-integration) — Bidirectional sync
- [OpenTelemetry](features/opentelemetry) — Distributed tracing
- [OpenClaw Skill](https://github.com/openspawn/openspawn/tree/main/skills/openclaw) — Manage agents from OpenClaw
- [Contributing](https://github.com/openspawn/openspawn/blob/main/CONTRIBUTING.md) — Join the reef!

## Community

- [Discord](https://discord.gg/openspawn)
- [GitHub Issues](https://github.com/openspawn/openspawn/issues)

---

<div class="footer">
  <p>Built with 🫧 by the BikiniBottom contributors</p>
  <p>MIT License © 2026</p>
</div>
