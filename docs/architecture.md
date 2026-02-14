---
title: Architecture
layout: default
nav_order: 5
permalink: /architecture/
---

# Architecture
{: .no_toc }

BikiniBottom is a layered system: protocol interfaces on top, a control plane in the middle, and agent runtimes at the bottom.

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## System Overview

```
                    ┌──────────────────────────────────────────┐
                    │           Protocol Layer                  │
                    │                                          │
                    │  ┌──────────┐       ┌──────────────┐    │
 Other Agents ─────▶│  A2A Server │       │  MCP Server   │◀──── Claude Desktop
                    │  (REST+SSE) │       │  (JSON-RPC)   │    │  Cursor, LLMs
                    │  └─────┬────┘       └──────┬───────┘    │
                    │        │                   │             │
                    └────────┼───────────────────┼─────────────┘
                             │                   │
                    ┌────────▼───────────────────▼─────────────┐
                    │           Control Plane                   │
                    │                                          │
                    │  ┌────────────┐  ┌───────────────────┐  │
                    │  │  Task      │  │  Model Router      │  │
                    │  │  Scheduler │  │  (Ollama/Groq/OR)  │  │
                    │  └─────┬──────┘  └────────┬──────────┘  │
                    │        │                   │             │
                    │  ┌─────▼───────────────────▼──────────┐  │
                    │  │     Agent Communication (ACP)       │  │
                    │  └────────────────┬───────────────────┘  │
                    └───────────────────┼──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │           Agent Runtime                   │
                    │                                          │
                    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
                    │  │L10  │ │ L7  │ │ L4  │ │ L3  │ ...  │
                    │  │CEO  │ │Lead │ │Dev  │ │ QA  │      │
                    │  └─────┘ └─────┘ └─────┘ └─────┘      │
                    └─────────────────────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │           Dashboard (React)              │
                    │  Real-time UI, network graph, metrics    │
                    └─────────────────────────────────────────┘
```

---

## Layers

### Protocol Layer

The top layer handles external communication via two open protocols:

- **A2A Server** — Implements Google's Agent-to-Agent protocol v0.3. Handles agent discovery (`/.well-known/agent.json`), task sending, SSE streaming, and task management. See [A2A Protocol Guide](protocols/a2a).

- **MCP Server** — Implements Anthropic's Model Context Protocol. Exposes 7 tools via JSON-RPC 2.0 at `POST /mcp`. See [MCP Tools Guide](protocols/mcp).

Both protocols feed into the same control plane — a task sent via A2A and a task delegated via MCP follow the same internal path.

### Control Plane

The middle layer handles orchestration:

- **Task Scheduler** — Receives tasks from protocols or internal agents, matches them to the right agent based on domain keywords, level requirements, and availability. Manages the full task lifecycle: submitted → working → completed.

- **Model Router** — Routes LLM requests to the optimal provider based on agent level and task type. Manages fallback chains, rate limiting, and cost tracking. See [Model Router Guide](features/model-router).

- **ACP (Agent Communication Protocol)** — Internal messaging between agents. Handles delegation chains, status updates, and coordination.

### Agent Runtime

The bottom layer runs the agents themselves:

- Agents are organized in a **hierarchy** with levels L1–L10
- Each agent has a **domain** (engineering, marketing, finance, etc.)
- Agents can **delegate** tasks to subordinates or **escalate** to superiors
- The simulation engine drives agent behavior with configurable tick intervals

---

## Data Flow

### External Task (A2A)

```
1. Client sends POST /a2a/message/send
2. A2A Server extracts text, detects domain (keyword matching)
3. Task Scheduler creates internal task, assigns to best agent
4. Agent processes task (via Model Router for LLM calls)
5. Status updates flow back via SSE or polling
6. Client receives completed task with artifacts
```

### External Task (MCP)

```
1. LLM client calls tools/call with delegate_task
2. MCP Server creates internal task via Task Scheduler
3. Same flow as A2A from step 3 onward
4. Result returned as MCP tool response (text content)
```

### Internal Delegation

```
1. L10 CEO receives complex task
2. Breaks into subtasks, delegates to L7 leads
3. Leads further delegate to L4-L6 workers
4. Workers execute (using appropriate LLM tier)
5. Results bubble up through the chain
```

---

## Agent Hierarchy

| Level | Tier | Role | Capabilities |
|-------|------|------|-------------|
| L10 | Executive | CEO/COO | Full delegation, strategic decisions, premium models |
| L9 | Executive | VP | Cross-domain coordination, premium models |
| L7–L8 | Lead | Team Lead | Domain management, mid-tier models, approval authority |
| L4–L6 | Senior | Senior IC | Complex tasks, local/cheap models |
| L1–L3 | Junior | Worker | Simple tasks, local models only |

Higher-level agents can delegate to lower levels. Lower-level agents can escalate to higher levels. The model router automatically assigns the right LLM tier.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Server | Node.js (raw HTTP, no framework) |
| Simulation | Deterministic engine with configurable ticks |
| Dashboard | React + TanStack Query |
| CLI | Node.js with zero dependencies |
| Protocols | A2A v0.3, MCP (2025-03-26) |
| Build | Nx monorepo, TypeScript |
| Deployment | GitHub Pages (docs), any Node.js host (server) |

---

## Monorepo Structure

```
openspawn/
├── packages/
│   └── cli/              # bikinibottom CLI
│       ├── src/
│       │   ├── cli.ts
│       │   └── commands/
│       │       ├── init.ts
│       │       ├── start.ts
│       │       ├── status.ts
│       │       └── demo.ts
│       └── templates/
│           └── ORG.md
├── tools/
│   └── sandbox/           # Server + protocols
│       └── src/
│           ├── server.ts       # HTTP server, route dispatch
│           ├── a2a-server.ts   # A2A protocol implementation
│           ├── a2a-types.ts    # A2A type definitions
│           ├── mcp-server.ts   # MCP tool server
│           ├── model-router.ts # Multi-provider routing
│           └── deterministic.ts # Simulation engine
├── docs/                  # Jekyll docs (this site)
└── nx.json
```
