# OpenSpawn: Shared Long‑Term Memory & Multi‑Agent Orchestration

## Product Requirements Document (PRD) & Implementation Plan

---

# 1. Overview

OpenSpawn is evolving into a **control plane for AI agent organizations**.  
The goal of this project is to extend OpenSpawn with a **shared long‑term memory system, event bus, and orchestration layer** so multiple agents (Claude, Codex, OpenClaw, and others) can collaborate with persistent knowledge.

This document describes:

• Product goals  
• Architecture  
• Implementation plan  
• Data model  
• Dashboard integration  
• Testing strategy  
• Rollout phases

---

# 2. Goals

## Primary Goals

1. Provide **shared persistent memory** across agents.
2. Enable **agent‑to‑agent coordination** via a unified event bus.
3. Build **memory pipelines** that convert events → knowledge.
4. Integrate **Claude, Codex, and OpenClaw agents**.
5. Provide **observability through a dashboard**.
6. Support **cloud‑native deployment with optional local/self‑hosted mode**.

---

# 3. Non‑Goals

The following are explicitly **out of scope for v1**:

• Training custom LLMs  
• Replacing OpenClaw plugins  
• Large‑scale enterprise RBAC  
• Offline mobile clients

---

# 4. Core Concept

OpenSpawn becomes the **agent control plane**.

Architecture:

Agents → OpenSpawn Core → Memory Pipeline → Knowledge Graph

Agents do not talk directly to each other.

Instead:

Agent A → Event Bus → OpenSpawn → Agent B

All interactions become memory events.

---

# 5. High‑Level Architecture

```
                ┌────────────────────┐
                │   OpenSpawn Core   │
                │  (NestJS API)      │
                └─────────┬──────────┘
                          │
                   Event Bus (NATS)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Memory Pipeline    Task Engine      Agent Router
        │                 │                 │
        │                 │                 │
   ┌────▼────┐      ┌─────▼────┐      ┌─────▼─────┐
   │Postgres │      │ Redis    │      │ Agents     │
   │pgvector │      │ Streams  │      │ Claude     │
   │          │      │          │      │ Codex      │
   │          │      │          │      │ OpenClaw   │
   └────┬─────┘      └────┬─────┘      └────┬──────┘
        │                 │                 │
        └───────── Neo4j Graph DB ─────────┘
```

---

# 6. Technology Stack

## Backend

NestJS (existing OpenSpawn API)  
Node / Bun runtime  
GraphQL + REST APIs

## Event Bus

Primary: **NATS Jetstream**

Reasons:

• lightweight  
• reliable for self‑hosted installs  
• horizontally scalable

Future compatibility:

• Kafka  
• Redis Streams

## Databases

Postgres + pgvector (primary memory storage)

Redis (task queues + streams)

Neo4j (optional graph relationships)

Qdrant (optional high‑scale vector DB)

---

# 7. Memory Model

Memory consists of three layers.

## Episodic Memory

Agent events.

Example:

Agent fixed caching bug in ProductService.

Stored as:

```
type: episode
agent: coder
content: fixed caching bug
timestamp
embedding
```

## Semantic Memory

Extracted facts.

Example:

ProductService invalidates Redis cache after update.

## Graph Memory

Relationships.

Example:

ProductService → depends_on → RedisCache

---

# 8. Memory Pipeline

All agent output flows through the pipeline.

Pipeline stages:

1. Event ingestion
2. Deduplication
3. Summarization (LLM)
4. Fact extraction
5. Embedding generation
6. Graph relationship extraction

Output stored across:

• Postgres
• Vector index
• Graph database

---

# 9. Agent Integration

Agents supported initially:

Claude  
Codex  
OpenClaw

Agents interact with OpenSpawn via:

```
POST /events
POST /tasks
GET /memory/search
```

Example memory event:

```
{
  "agent":"claude",
  "event":"code_change",
  "content":"Added cache invalidation logic"
}
```

---

# 10. Task System

Tasks represent work units.

Task states:

pending  
assigned  
running  
completed  
failed

Agents claim tasks via:

GET /tasks/pending

---

# 11. Dashboard Requirements

The dashboard must show:

Agent swarm map  
Task timeline  
Memory growth  
Event stream

Built using:

Tailwind v4  
shadcn/ui components  
TanStack Table  
Framer Motion animations

Pages:

Agents  
Tasks  
Memory  
Events

---

# 12. Memory Visualization

Memory dashboard shows:

Recent memory events  
Fact graph visualization  
Top memory contributors  
Agent knowledge overlap

Optional graph rendering via:

Cytoscape.js

---

# 13. SDK Updates

Extend existing SDKs.

Typescript:

```
sdk.memory.store()
sdk.memory.search()
sdk.events.emit()
```

Python:

```
client.memory.store()
client.memory.search()
```

---

# 14. Repository Structure Changes

```
apps/api/src/memory/
    memory.module.ts
    memory.service.ts
    memory.controller.ts
    memory.processor.ts

libs/database/entities/
    Memory.ts
    Fact.ts
    GraphEdge.ts

dashboard/src/pages/
    Memory.tsx
```

---

# 15. Deployment

Cloud‑native first.

Default stack:

Docker  
Kubernetes optional

Services:

openspawn-api  
postgres  
redis  
nats  
neo4j (optional)

---

# 16. Testing Strategy

## Unit Tests

Memory ingestion  
Task state transitions  
Event bus subscriptions

## Integration Tests

Agent → memory pipeline  
Agent → task assignment

## Load Tests

Simulate 50 agents writing memory simultaneously.

---

# 17. Success Metrics

System metrics:

Agent uptime  
Event throughput  
Memory growth rate

User metrics:

Agent task completion rate  
Memory retrieval accuracy

---

# 18. Phased Rollout

## Phase 1

Memory API  
Event bus  
Single agent integration

## Phase 2

Multi‑agent coordination  
Dashboard panels

## Phase 3

Graph memory  
Advanced visualization

---

# 19. Risks

Memory explosion  
Agent hallucination poisoning memory  
Graph DB performance

Mitigation:

Deduplication  
Confidence scoring  
Periodic pruning

---

# 20. Future Extensions

Autonomous agent spawning  
Self‑improving agents  
Cross‑organization knowledge graphs

---

# 21. Conclusion

This architecture transforms OpenSpawn from:

Agent scheduler

into

Agent operating system.

Agents become disposable workers.

Knowledge persists as shared memory.

OpenSpawn becomes the **control plane for AI agent ecosystems**.
