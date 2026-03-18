<div align="center">

# 🐙 OpenSpawn

The control plane your AI agents deserve.

[![CI](https://github.com/openspawn/openspawn/actions/workflows/ci.yml/badge.svg)](https://github.com/openspawn/openspawn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://bikinibottom.ai/app/) · [Website](https://openspawn.ai) · [ORG.md](https://openspawn.ai/org-md) · [GitHub](https://github.com/openspawn/openspawn)

</div>

## What is OpenSpawn?

OpenSpawn is an open-source multi-agent coordination platform — the control plane for AI agent organizations. Define your org in markdown, coordinate agents via open protocols, and watch them work in a real-time dashboard.

**Infrastructure, not a framework.** OpenSpawn doesn't replace your agent stack — it coordinates it. Works with CrewAI, LangGraph, AutoGen, or any A2A-compatible agent. Built on [OpenClaw](https://openclaw.ai).

## ✨ Key Features

- **ORG.md** — define your entire agent org in markdown ([learn more](https://openspawn.ai/org-md))
- **Agent Spawning** — spawn Claude Code CLI agents as coordinated subprocesses
- **A2A Protocol** — every agent is discoverable via `/.well-known/agent.json`
- **MCP Server** — 7 tools via Streamable HTTP at `POST /mcp`
- **Model Router** — intelligent routing across Ollama, Groq, and OpenRouter
- **Live Dashboard** — real-time network graph, task timeline, agent details, credits
- **CLI** — `npx openspawn init` to scaffold, `npx openspawn preview` to see it run, `npx openspawn start` for the real coordinator
- **SQLite Local Mode** — no Docker or Postgres needed for local development
- **SSE Updates** — real-time event streaming, no polling

## ⚡ Quick Start

**Prerequisites:** Node.js 18+, Python 3.12+, [uv](https://docs.astral.sh/uv/)

```bash
npx openspawn init my-org     # scaffold a new org
cd my-org
npx openspawn preview         # simulation + dashboard at localhost:3333 (no API keys needed)
```

Ready for real agents? `npx openspawn start` launches the FastAPI coordinator with SQLite (no Docker needed).

Or try the live demo with 22 agents across 5 departments: **[bikinibottom.ai](https://bikinibottom.ai/app/)**

## 🏗️ Architecture

```
                         ┌─────────────────────┐
  openspawn.ai/          │    Website (React)   │
                         └──────────┬───────────┘
                                    │
  bikinibottom.ai/app/   ┌─────────┴───────────┐
                         │   Dashboard (React)  │
                         └──────────┬───────────┘
                                    │ SSE + REST
                         ┌──────────┴───────────┐
  :3333                  │   Sandbox Server      │
                         │  ┌─────┬─────┬─────┐ │
                         │  │ A2A │ MCP │Model│ │
                         │  │     │     │Route│ │
                         │  └─────┴─────┴─────┘ │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴───────────┐
                         │  ORG.md → Org Parser  │
                         │   → Agent Engine      │
                         └──────────────────────┘
```

## 📦 Project Structure

```
apps/dashboard/          # React dashboard (openspawn.ai + bikinibottom.ai)
apps/api/                # Python API — FastAPI coordinator + agent spawning
apps/website/            # Marketing site (openspawn.ai)
apps/team/               # Internal team dashboard (team.openspawn.ai)
apps/platform/           # Landing page (openspawn.ai)
tools/sandbox/           # Node.js sandbox server (simulation engine)
packages/openspawn/      # npm CLI (npx openspawn init / preview / start)
packages/coordinator/    # Coordination server package
docs/                    # Design docs & spikes
```

## 🔗 Protocols

| Protocol         | Endpoint                  | What it does                       |
| ---------------- | ------------------------- | ---------------------------------- |
| **A2A**          | `/.well-known/agent.json` | Agent discovery + task management  |
| **MCP**          | `POST /mcp`               | 7 tools via Streamable HTTP        |
| **Model Router** | Internal                  | Routes to Ollama, Groq, OpenRouter |

## 🤝 Works With

CrewAI · LangGraph · AutoGen · OpenClaw · Any A2A-compatible agent

## Contributing

Contributions welcome! This is a demo-stage project — things move fast and break sometimes. Open an issue or PR and we'll figure it out together.

## License

[MIT](LICENSE)
