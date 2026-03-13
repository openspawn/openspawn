---
source: https://openspawn.ai/docs/features/dashboard
generated: 2026-03-13
---

# Dashboard

## Overview

Real-time React dashboard with network graph, task timeline, cost charts, and agent monitoring. 💡 See it live at bikinibottom.ai The dashboard starts automatically when you run

npx openspawn start. It provides:

Agent network graph — Visualize the org hierarchy and active connections

Task timeline — Real-time feed of task creation, delegation, and completion

Cost charts — Per-provider spending, savings calculator

Agent status — Idle, busy, offline for every agent

## Pages

### Home

### Tasks

### Agents

### Router

## API Endpoints

```
curl https://bikinibottom.ai/api/org/stats
# Agent list
curl https://bikinibottom.ai/api/agents
# Task list
```

Router metrics — Provider health, latency, fallback frequency Main view with agent network graph showing live task flows. Agents light up when working. All tasks with filtering by state (submitted, working, completed, failed). Click any task for full delegation chain. Grid view of all agents showing level, domain, status, and current task. Provider status dashboard: online/offline, rate limits, cost breakdown, and latency distribution.
