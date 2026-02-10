---
title: Home
layout: default
nav_order: 1
permalink: /
---

<div class="hero-section" markdown="0">
  <div class="hero-particles">
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>
    <div class="bubble bubble-4"></div>
    <div class="bubble bubble-5"></div>
    <div class="bubble bubble-6"></div>
  </div>
  <div class="hero-content">
    <div class="hero-badge">Open Source · MIT Licensed</div>
    <h1 class="hero-title">
      <span class="hero-gradient">BikiniBottom</span>
    </h1>
    <p class="hero-subtitle">The control plane for your AI agent army</p>
    <p class="hero-description">
      Orchestrate hundreds of agents with task routing, spending controls, trust hierarchies, and a real-time dashboard. Not a framework — just the infrastructure every multi-agent system needs.
    </p>
    <div class="hero-cta">
      <a href="https://openspawn.github.io/openspawn/demo/" class="cta-button cta-primary">
        <span class="cta-icon">▶</span> Launch Live Demo
      </a>
      <a href="getting-started" class="cta-button cta-secondary">
        Get Started →
      </a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <span class="hero-stat-value">50+</span>
        <span class="hero-stat-label">API Endpoints</span>
      </div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-value">5</span>
        <span class="hero-stat-label">Ocean Themes</span>
      </div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-value">2</span>
        <span class="hero-stat-label">SDKs</span>
      </div>
      <div class="hero-stat-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-value">8</span>
        <span class="hero-stat-label">Integrations</span>
      </div>
    </div>
  </div>
</div>

<div class="demo-showcase" markdown="0">
  <div class="demo-showcase-header">
    <span class="demo-showcase-tag">✨ Interactive Demo</span>
    <h2 class="demo-showcase-title">See it in action — no setup required</h2>
    <p class="demo-showcase-desc">22 agents, 5 scenarios, real-time simulation. Switch between AcmeTech startup and enterprise orgs.</p>
  </div>
  <div class="demo-browser">
    <div class="demo-browser-bar">
      <div class="demo-browser-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="demo-browser-url">openspawn.github.io/openspawn/demo</div>
    </div>
    <a href="https://openspawn.github.io/openspawn/demo/" class="demo-browser-content">
      <img src="assets/dashboard-preview.png" alt="BikiniBottom Dashboard" class="demo-screenshot" />
      <div class="demo-overlay">
        <div class="demo-play-button">▶</div>
        <span>Launch Live Demo</span>
      </div>
    </a>
  </div>
</div>

---

## Why BikiniBottom?

One agent is a script. Ten agents is a distributed system. **This is your control plane.**
{: .fs-5 .fw-300 .text-center }

<div class="feature-grid" markdown="0">
  <div class="feature-card">
    <div class="feature-icon">🎯</div>
    <h3>Task Orchestration</h3>
    <p>Priority queues, self-claim, approval workflows, and rejection handling. Route the right task to the right agent.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">💰</div>
    <h3>Credit System</h3>
    <p>Every agent has a budget. Track spending, set limits, prevent runaway costs. Real-time balance monitoring.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🏆</div>
    <h3>Trust & Reputation</h3>
    <p>Agents earn trust through performance. Automated promotion, demotion, and capability gating.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">👥</div>
    <h3>Teams & Hierarchy</h3>
    <p>Organize agents into teams with leads, sub-teams, and org charts. Real-time presence tracking.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>Integrations</h3>
    <p>GitHub sync, Linear, webhooks, OpenTelemetry, OpenClaw. Framework adapters for LangGraph & CrewAI.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📊</div>
    <h3>Live Dashboard</h3>
    <p>Real-time React dashboard with network graph, timeline, customizable widgets, and ocean themes.</p>
  </div>
</div>

---

## Quick Start

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install && pnpm dev
```

Or skip setup entirely → [**try the live demo**](https://openspawn.github.io/openspawn/demo/)
{: .fs-5 .text-center }

[Full getting started guide →](getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/openspawn/openspawn){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Architecture

BikiniBottom is an **Nx monorepo** with a NestJS API, React dashboard, TypeScript SDK, and Python SDK.

| Component | Tech | Purpose |
|-----------|------|---------|
| **API** | NestJS + GraphQL | Core coordination engine |
| **Dashboard** | React + TanStack Query | Real-time monitoring UI |
| **TS SDK** | TypeScript | Agent integration library |
| **Python SDK** | Python | Agent integration library |

[Architecture deep dive →](openspawn/)

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phases 1-8 | ✅ Complete | Core platform (auth → orchestrator mode) |
| Phase A | ✅ Complete | SDKs + Webhooks |
| Phase B | ✅ Complete | GitHub, Linear, OTEL, OpenClaw |
| Phase C | ✅ Complete | Framework adapters (LangGraph, CrewAI) |
| Phase D | 📋 Planned | Marketplace |

---

## Community

BikiniBottom is built for the [OpenClaw](https://openclaw.ai) community and open to all.

[GitHub Discussions](https://github.com/openspawn/openspawn/discussions) · [Discord](https://discord.com/invite/clawd) · [Contributing Guide](https://github.com/openspawn/openspawn/blob/main/CONTRIBUTING.md)
{: .text-center }

<p style="text-align: center; opacity: 0.6; margin-top: 3rem;">
  Built with 🫧 from the deep. MIT License © 2026.
</p>
