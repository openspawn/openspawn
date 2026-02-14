---
title: Protocols
layout: default
nav_order: 3
has_children: true
permalink: /protocols/
---

# Protocols

BikiniBottom is protocol-native. Every agent org you deploy speaks two open protocols out of the box — no adapters, no plugins, no configuration.

---

## Why Two Protocols?

**A2A** and **MCP** solve different problems. You need both.

| | A2A Protocol | MCP Tools |
|---|---|---|
| **Purpose** | Agent-to-agent communication | LLM-to-tool integration |
| **Who talks** | Agents ↔ Agents | LLMs → Tools |
| **Transport** | HTTP REST + SSE | JSON-RPC 2.0 over HTTP |
| **Discovery** | `/.well-known/agent.json` | `initialize` → `tools/list` |
| **Key operation** | Send task, stream updates | Call tool, get result |
| **Spec** | [a2a-protocol.org](https://a2a-protocol.org) | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| **Use when** | Another agent needs to delegate work | An LLM needs to take action |

### A2A = Agents Talking to Agents

The [A2A (Agent-to-Agent) protocol](https://a2a-protocol.org) by Google defines how autonomous agents discover each other, send tasks, and stream progress updates. Think of it as HTTP for the agent web.

When you deploy BikiniBottom, every agent publishes an **Agent Card** at a well-known URL. Other agents (or humans with curl) can discover capabilities, send tasks, and subscribe to real-time updates.

[A2A Protocol Guide →](a2a){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }

### MCP = LLMs Using Tools

The [MCP (Model Context Protocol)](https://modelcontextprotocol.io) by Anthropic defines how LLMs discover and call tools. It's the standard that Claude Desktop, Cursor, and other AI IDEs use to connect to external capabilities.

BikiniBottom exposes **7 tools** via MCP: delegate tasks, list agents, get stats, and more. Connect your favorite AI client and let it orchestrate your agent org directly.

[MCP Tools Guide →](mcp){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }

---

## How They Complement Each Other

```
┌─────────────────────────────────────────────────────┐
│                   Your Agent Org                     │
│                                                     │
│  ┌─────────┐    ┌──────────┐    ┌───────────────┐  │
│  │  A2A    │    │  Control  │    │  MCP Tool     │  │
│  │  Server  │───▶│  Plane    │◀───│  Server       │  │
│  └─────────┘    └──────────┘    └───────────────┘  │
│       ▲              │               ▲              │
│       │         ┌────┴────┐          │              │
│       │         │  Model   │          │              │
│       │         │  Router  │          │              │
│       │         └────┬────┘          │              │
│       │              │               │              │
│       │    ┌─────────┴─────────┐     │              │
│       │    │   Agent Runtime    │     │              │
│       │    └───────────────────┘     │              │
└───────┼──────────────────────────────┼──────────────┘
        │                              │
   Other Agents                  Claude Desktop
   (A2A clients)                 Cursor, LLMs
```

- **External agent** sends task via A2A → routed to the right internal agent
- **LLM client** calls MCP tool → task delegated to the org
- Both feed into the same control plane, same router, same agents

---

## Try It Now

```bash
# A2A: Discover agents on the live demo
curl https://bikinibottom.ai/.well-known/agent.json

# MCP: List available tools
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Both protocols are enabled by default when you run `npx bikinibottom init`.
{: .note }
