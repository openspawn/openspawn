# 🪸 OpenSpawn

**AI agent orchestration control plane** — run 32 agents locally with A2A + MCP support.

OpenSpawn is the control plane your AI agents deserve. Define your organization in a simple Markdown file, and watch agents coordinate tasks in real-time with protocol-native communication.

## Quick Start

```bash
npx openspawn init my-org
cd my-org
openspawn start
```

Open [http://localhost:3333](http://localhost:3333) to see the real-time dashboard.

## Features

- **🤖 32 Agents** — Define your agent org chart in `ORG.md`
- **🔗 A2A Protocol** — Agent-to-Agent communication via Google's A2A spec
- **🔌 MCP Support** — Model Context Protocol for tool integration
- **🧠 Model Router** — Intelligent routing across Ollama, Groq, OpenRouter, and more
- **📊 Real-time Dashboard** — Watch agents coordinate tasks live
- **🎯 Deterministic Simulation** — Reproducible agent behavior for testing

## Commands

| Command | Description |
|---------|-------------|
| `openspawn init [name]` | Scaffold a new agent organization |
| `openspawn start` | Start the local control plane server |
| `openspawn status` | Show current server status |
| `openspawn demo` | Start with the BikiniBottom demo scenario |

## Configuration

After `init`, edit `openspawn.config.json`:

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

## Agent Organization

Define agents in `ORG.md` using simple Markdown:

```markdown
### CEO (Level 10)
- Name: The Boss
- Avatar: 👑
- Domain: operations
- Role: coo
```

Agents inherit hierarchy from heading levels and communicate via A2A protocol.

## Protocols

- **A2A** → `http://localhost:3333/.well-known/agent.json`
- **MCP** → `http://localhost:3333/mcp`

## Showcase

Check out the [BikiniBottom demo](https://bikinibottom.ai) — a 32-agent SpongeBob-themed showcase built with OpenSpawn.

## Links

- 🌐 **Website:** [openspawn.ai](https://openspawn.ai)
- 🍍 **Live Demo:** [bikinibottom.ai](https://bikinibottom.ai)
- 📖 **GitHub:** [openspawn/openspawn](https://github.com/openspawn/openspawn)

## License

MIT
