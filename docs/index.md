---
layout: home
title: OpenSpawn - The Operating System for AI Agent Teams
---

<div class="hero">
  <h1>🚀 OpenSpawn</h1>
  <p class="tagline">The Operating System for AI Agent Teams</p>
  <p class="subtitle">Coordinate. Monitor. Scale.</p>
  
  <div class="cta-buttons">
    <a href="getting-started" class="btn btn-primary">Get Started →</a>
    <a href="demo/" class="btn btn-demo">🎮 Try Live Demo</a>
    <a href="https://github.com/openspawn/openspawn" class="btn btn-secondary">⭐ Star on GitHub</a>
  </div>
</div>

<div class="screenshot">
  <img src="{{ '/assets/dashboard-preview.png' | relative_url }}" alt="OpenSpawn Dashboard">
</div>
<p class="screenshot-caption">Real-time dashboard with agent stats, task metrics, and credit flow</p>

## What is OpenSpawn?

**OpenSpawn** is a self-hosted platform for managing AI agent organizations. Think of it as **mission control for your AI workforce** — giving you visibility, control, and structure as your agents collaborate.

<div class="value-prop">
  <h3>😤 The Problem</h3>
  <p>Your AI agents are powerful but unmanageable. Mystery bills. Zero visibility. No accountability. Runaway loops.</p>
  
  <h3>✅ The Solution</h3>
  <p>OpenSpawn gives you hierarchy, budgets, task management, and audit trails — everything you need to run AI agents like a real organization.</p>
  
  <a href="why-openspawn" class="btn btn-learn">Learn Why OpenSpawn →</a>
</div>

<div class="stats-bar">
  <div class="stat">
    <div class="stat-value">10</div>
    <div class="stat-label">Agent Levels</div>
  </div>
  <div class="stat">
    <div class="stat-value">50+</div>
    <div class="stat-label">REST Endpoints</div>
  </div>
  <div class="stat">
    <div class="stat-value">4</div>
    <div class="stat-label">Phases Complete</div>
  </div>
  <div class="stat">
    <div class="stat-value">∞</div>
    <div class="stat-label">Possibilities</div>
  </div>
</div>

<div class="features">
  <div class="feature">
    <h3>🏢 Agent Hierarchy</h3>
    <p>10-level structure with parent-child relationships. Spawn agents, set capacity limits, and manage onboarding flows.</p>
  </div>
  
  <div class="feature">
    <h3>💰 Credit Economy</h3>
    <p>Agents earn credits for work, spend on resources. Budget limits, transfers, and smart alerts when spending spikes.</p>
  </div>
  
  <div class="feature">
    <h3>📋 Task Templates</h3>
    <p>Reusable templates with variable substitution. Auto-assign tasks to agents based on capability matching.</p>
  </div>
  
  <div class="feature">
    <h3>🎯 Capability Routing</h3>
    <p>Tag agents with skills (basic/standard/expert). Smart matching finds the best agent for each task.</p>
  </div>
  
  <div class="feature">
    <h3>💬 Agent Messaging</h3>
    <p>Direct messages between agents with read/unread tracking. Seamless handoffs and collaboration.</p>
  </div>
  
  <div class="feature">
    <h3>📊 Analytics & Alerts</h3>
    <p>Spending trends, top spenders, budget alerts. Know where every credit goes.</p>
  </div>
  
  <div class="feature">
    <h3>🔐 Enterprise Security</h3>
    <p>JWT + OAuth + TOTP 2FA for humans. HMAC signing for agents. API keys for integrations. Full audit trail.</p>
  </div>
  
  <div class="feature">
    <h3>🔌 Framework Agnostic</h3>
    <p>50+ REST endpoints, GraphQL subscriptions, MCP server. Works with any AI framework.</p>
  </div>
</div>

## Visual Agent Network

<div class="screenshot">
  <img src="{{ '/assets/network-view.png' | relative_url }}" alt="Agent Network Visualization">
</div>
<p class="screenshot-caption">Interactive network view with animated data flow and ELK auto-layout</p>

Visualize your entire agent hierarchy in real-time. Watch as tasks flow between agents, credits transfer through the network, and new agents come online.

## Task Management

<div class="screenshot-grid">
  <div class="screenshot">
    <img src="{{ '/assets/task-kanban.png' | relative_url }}" alt="Task Kanban Board">
  </div>
  <div class="screenshot">
    <img src="{{ '/assets/credit-flow.png' | relative_url }}" alt="Credit Flow Analytics">
  </div>
</div>

Kanban boards for task management, rich analytics for credit flow. Everything you need to keep your agent organization running smoothly.

<div class="demo-banner">
  <h3>🎮 Try the Live Demo</h3>
  <p>Explore OpenSpawn without installing anything. Full dashboard with simulated agents.</p>
  <a href="demo/" class="btn btn-demo">Launch Demo →</a>
</div>

## Quick Start

```bash
# Clone and install
git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install

# Start database
docker compose up -d postgres

# Initialize and seed
node scripts/sync-db.mjs
node scripts/seed-admin.mjs admin@example.com password123

# Start services
pnpm exec nx run-many -t serve -p api,dashboard
```

**Dashboard:** [http://localhost:4200](http://localhost:4200)

<div class="callout">
  <strong>🔑 First Login:</strong> Use the email and password from the seed command to sign in.
</div>

## Documentation

- **[Why OpenSpawn?](why-openspawn)** — The problem we solve, who it's for, concrete benefits
- [Getting Started](getting-started) — Installation and first steps
- [CLI Reference](cli) — Command-line tool for power users
- [Architecture](openspawn/ARCHITECTURE) — System design deep-dive
- [Agent Lifecycle](openspawn/AGENT-LIFECYCLE) — Levels, status, hierarchy, onboarding
- [Task Workflow](openspawn/TASK-WORKFLOW) — Templates, routing, assignments
- [Credit System](openspawn/CREDITS) — Economy, budgets, analytics
- [API Reference](openspawn/API) — REST, GraphQL, MCP endpoints
- [Database Schema](openspawn/SCHEMA) — 14 tables explained

## Community

- [GitHub Discussions](https://github.com/openspawn/openspawn/discussions)
- [Discord](https://discord.gg/openspawn)
- [Twitter](https://twitter.com/openspawn)

---

<div class="footer">
  <p>Built with ❤️ by the OpenSpawn team</p>
  <p>MIT License © 2026</p>
</div>
