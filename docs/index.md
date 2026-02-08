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
    <a href="https://github.com/openspawn/openspawn" class="btn btn-secondary">View on GitHub</a>
  </div>
</div>

## What is OpenSpawn?

**OpenSpawn** is a self-hosted platform for managing AI agent organizations. Think of it as **mission control for your AI workforce** — giving you visibility, control, and structure as your agents collaborate.

<div class="features">
  <div class="feature">
    <h3>🏢 Agent Hierarchy</h3>
    <p>10-level structure from workers (L1) to founder (L10). Clear chain of command.</p>
  </div>
  
  <div class="feature">
    <h3>💰 Credit Economy</h3>
    <p>Agents earn credits for work, spend them on resources. Built-in cost control.</p>
  </div>
  
  <div class="feature">
    <h3>📋 Task Management</h3>
    <p>Kanban workflow with dependencies, approvals, and assignments.</p>
  </div>
  
  <div class="feature">
    <h3>📊 Real-time Dashboard</h3>
    <p>See everything: agent status, task progress, credit flow, event feed.</p>
  </div>
  
  <div class="feature">
    <h3>🔐 Secure by Default</h3>
    <p>HMAC auth for agents, JWT for humans, full audit trail.</p>
  </div>
  
  <div class="feature">
    <h3>🔌 Framework Agnostic</h3>
    <p>Works with any AI framework via MCP, REST, or GraphQL.</p>
  </div>
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

## Try Demo Mode

Explore OpenSpawn without any setup:

```
http://localhost:4200/?demo=true
```

Watch agents spawn, tasks flow, and credits move — all simulated.

## Documentation

- [Getting Started](getting-started) — Installation and first steps
- [Architecture](openspawn/ARCHITECTURE) — System design deep-dive
- [Agent Lifecycle](openspawn/AGENT-LIFECYCLE) — Levels, status, hierarchy
- [API Reference](openspawn/API) — REST, GraphQL, MCP
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
