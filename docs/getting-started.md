---
title: Getting Started
layout: default
nav_order: 2
---

# Getting Started

Get BikiniBottom running in 2 minutes.

---

## Try the Live Demo

Visit [**bikinibottom.ai**](https://bikinibottom.ai) — 32 agents running right now. No setup required.
{: .note }

---

## Quick Start (Local)

### 1. Scaffold your project

```bash
npx bikinibottom init my-org
cd my-org
```

This creates:
- `ORG.md` — Your agent organization definition
- `bikinibottom.config.json` — Configuration (port, providers, protocols)

### 2. Start the server

```bash
npx bikinibottom start
```

Open [http://localhost:3333](http://localhost:3333) — your dashboard is live.

### 3. Discover your agents via A2A

```bash
curl http://localhost:3333/.well-known/agent.json
```

```json
{
  "name": "My Org",
  "description": "AI-powered operations",
  "url": "http://localhost:3333",
  "version": "1.0.0",
  "protocolVersion": "0.3",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "extendedAgentCard": true
  },
  "skills": [
    { "id": "task-delegation", "name": "Task Delegation", "description": "Delegate tasks to specialized agent teams" }
  ]
}
```

### 4. Send a task

```bash
curl -X POST http://localhost:3333/a2a/message/send \
  -H 'Content-Type: application/json' \
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Build a REST API for user management" }]
    }
  }'
```

### 5. Use as MCP Tool Server

```bash
curl -X POST http://localhost:3333/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## Customize Your Organization

Edit `ORG.md` to define your agents:

```markdown
# My Agent Organization

## Identity
- Name: My Org
- Mission: AI-powered operations

## Structure

### CEO (Level 10)
- Name: The Boss
- Avatar: 👑
- Domain: operations
- Role: coo

### Engineering Lead (Level 7)
- Name: Tech Lead
- Avatar: 💻
- Domain: engineering
- Role: lead

### Frontend Developer (Level 4)
- Name: UI Builder
- Avatar: 🎨
- Domain: frontend
- Role: worker
```

See the [CLI reference](cli) for all configuration options.

---

## Configuration

`bikinibottom.config.json` controls your server:

```json
{
  "port": 3333,
  "orgFile": "ORG.md",
  "simulation": {
    "mode": "deterministic",
    "tickInterval": 3000,
    "startMode": "full"
  },
  "router": {
    "preferLocal": true,
    "providers": ["ollama", "groq"]
  },
  "protocols": {
    "a2a": true,
    "mcp": true
  }
}
```

---

## Next Steps

| Guide | What You'll Learn |
|-------|-------------------|
| [A2A Protocol](protocols/a2a) | Agent discovery, task sending, streaming |
| [MCP Tools](protocols/mcp) | 7 tools, JSON-RPC integration, Claude Desktop setup |
| [Model Router](features/model-router) | Provider routing, fallback chains, cost tracking |
| [CLI Reference](cli) | All commands and configuration |
| [Architecture](architecture) | System design and data flows |

---

## Troubleshooting

### Port already in use

Change the port in `bikinibottom.config.json`:

```json
{ "port": 3334 }
```

### Ollama not available

BikiniBottom works without Ollama — it falls back to Groq or OpenRouter. Set API keys:

```bash
export GROQ_API_KEY=your_key
export OPENROUTER_API_KEY=your_key
```

---

Need help? [Open an issue](https://github.com/openspawn/openspawn/issues) or [join Discord](https://discord.gg/openspawn).
