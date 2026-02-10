---
title: Framework Adapters
layout: default
parent: Features
nav_order: 11
---

# 🔌 Framework Adapters

BikiniBottom is **infrastructure, not a framework**. It doesn't replace LangGraph, CrewAI, or Claude Code — it gives them superpowers: task persistence, budget enforcement, agent hierarchy, and audit trails.

Think of it like a database for your agent operations. Your framework runs the logic; BikiniBottom runs the coordination.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Your Application                │
├─────────────┬──────────────┬────────────────┤
│  LangGraph  │   CrewAI     │  Claude Code   │
│  Workflow   │   Crew       │  Sub-agents    │
├─────────────┴──────────────┴────────────────┤
│         BikiniBottom Client Layer            │
│  (Python SDK · TypeScript SDK · MCP Tools)  │
├─────────────────────────────────────────────┤
│          BikiniBottom API Server             │
│  REST · GraphQL · WebSocket · MCP           │
├─────────────────────────────────────────────┤
│  Task Queue │ Credit System │ Agent Registry │
│  Audit Log  │ Peer Messaging│ Webhooks      │
└─────────────────────────────────────────────┘
```

## How Frameworks Connect

| Method | Best For | Install |
|--------|----------|---------|
| **Python SDK** | LangGraph, CrewAI, any Python agent | `pip install openspawn` |
| **TypeScript SDK** | Node.js agents, custom frameworks | `npm i @openspawn/sdk` |
| **MCP Server** | Claude Code, OpenClaw, any MCP client | Built into BikiniBottom |
| **REST API** | Any language, direct integration | No SDK needed |

## Quick Example (Python)

```python
from openspawn import OpenSpawnClient

bb = OpenSpawnClient(base_url="http://localhost:3000", api_key="your-key")

# Register your agent
agent = bb.agents.register(name="researcher", parent_id="boss-agent-id")

# Claim a task from the queue
task = bb.tasks.claim(agent_id=agent.id, capabilities=["research"])

# Do work with your framework of choice...
result = my_langgraph_workflow.invoke({"query": task.description})

# Report back
bb.tasks.complete(task.id, result=result)
bb.credits.report_usage(agent_id=agent.id, tokens_used=1500, model="gpt-4")
```

## Integration Guides

- **[LangGraph Adapter](langgraph-adapter)** — State persistence, callback handlers, credit-aware nodes
- **[CrewAI Adapter](crewai-adapter)** — Crew hierarchy mapping, task sync, budget controls
- **[Claude Code / OpenClaw Adapter](claude-code-adapter)** — MCP tools, session mapping, sub-agent coordination

## Why Not Just Use [Framework] Alone?

| Problem | Framework Alone | With BikiniBottom |
|---------|----------------|-------------------|
| Agent crashes mid-task | Task lost | Task persisted, re-claimable |
| Runaway spending | Hope for the best | Hard budget limits per agent |
| "What are my agents doing?" | Check logs maybe | Real-time dashboard |
| Multi-framework coordination | Build it yourself | Shared task queue + messaging |
| Audit trail | DIY | Built-in event history |

BikiniBottom doesn't add complexity — it removes the infrastructure you'd have to build anyway. 🫧
