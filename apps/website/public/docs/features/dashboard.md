---
source: https://openspawn.ai/docs/features/dashboard
generated: 2026-03-03
---

# Dashboard

## Overview

Real-time React dashboard with network graph, task timeline, cost charts, and agent monitoring. 💡 See it live at bikinibottom.ai

## Pages

### Home

The dashboard starts automatically when you run npx openspawn start. It provides:

### Tasks

Main view with agent network graph showing live task flows. Agents light up when working.

### Agents

All tasks with filtering by state (submitted, working, completed, failed). Click any task for full delegation chain.

### Router

Grid view of all agents showing level, domain, status, and current task.

## API Endpoints

```
curl https://bikinibottom.ai/api/org/stats
# Agent list
curl https://bikinibottom.ai/api/agents
# Task list
```

Provider status dashboard: online/offline, rate limits, cost breakdown, and latency distribution.
