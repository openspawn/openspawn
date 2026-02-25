<div align="center">

# 🍍 BikiniBottom

The control plane your AI agents deserve.

[![CI](https://github.com/openspawn/openspawn/actions/workflows/ci.yml/badge.svg)](https://github.com/openspawn/openspawn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://bikinibottom.ai/app/) · [Docs](https://bikinibottom.ai/docs) · [ORG.md](https://bikinibottom.ai/org-md) · [GitHub](https://github.com/openspawn/openspawn)

</div>

## What is BikiniBottom?

BikiniBottom is an open-source multi-agent coordination platform — the control plane for AI agent organizations. Define your org in markdown, coordinate agents via open protocols, and watch them work in a real-time dashboard.

**Infrastructure, not a framework.** BikiniBottom doesn't replace your agent stack — it coordinates it. Works with CrewAI, LangGraph, AutoGen, or any A2A-compatible agent. Built on [OpenClaw](https://openclaw.ai).

## ✨ Key Features

- **ORG.md** — define your entire agent org in markdown ([learn more](https://bikinibottom.ai/org-md))
- **A2A Protocol** — every agent is discoverable via `/.well-known/agent.json`
- **MCP Server** — 7 tools via Streamable HTTP at `POST /mcp`
- **Model Router** — intelligent routing across Ollama, Groq, and OpenRouter
- **Live Dashboard** — real-time network graph, task timeline, agent details, credits
- **CLI** — `npx bikinibottom init` to scaffold a new org
- **SSE Updates** — real-time event streaming, no polling

## ⚡ Quick Start

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install
pnpm exec nx serve sandbox
```

Open [http://localhost:3333](http://localhost:3333) 🎉

Or try the live demo with 22 agents across 5 departments: **[bikinibottom.ai](https://bikinibottom.ai/app/)**

## 🏗️ Architecture

```
                         ┌─────────────────────┐
  bikinibottom.ai/       │    Website (React)   │
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
apps/dashboard/          # React + TanStack Router dashboard SPA
apps/website/            # Marketing site + docs
tools/sandbox/           # Node.js sandbox server (the brain)
packages/cli/            # BikiniBottom CLI
docs/strategy/           # Design docs
```

## 🔗 Protocols

| Protocol | Endpoint | What it does |
|----------|----------|-------------|
| **A2A** | `/.well-known/agent.json` | Agent discovery + task management |
| **MCP** | `POST /mcp` | 7 tools via Streamable HTTP |
| **Model Router** | Internal | Routes to Ollama, Groq, OpenRouter |

## 🤝 Works With

CrewAI · LangGraph · AutoGen · OpenClaw · Any A2A-compatible agent

## Contributing

Contributions welcome! This is a demo-stage project — things move fast and break sometimes. Open an issue or PR and we'll figure it out together.

## License

[MIT](LICENSE)
