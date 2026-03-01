# OpenSpawn

**Persistent governed organizations for AI agents.**

While other tools give you ephemeral agent teams that forget everything when the session ends, OpenSpawn builds persistent organizations — with memory, hierarchy, budgets, and governance that survive across sessions.

[![npm](https://img.shields.io/npm/v/openspawn)](https://www.npmjs.com/package/openspawn)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/openspawn/openspawn/blob/main/LICENSE)

## Quick Start

```bash
npx openspawn init my-org
cd my-org
```

This creates an `ORG.md` file — **your entire agent organization defined in markdown**.

## Define Your Org

Edit `ORG.md` to define your team:

```markdown
# My Agent Org

## Culture

- **Preset:** professional
- **Escalation:** fast
- **Ack Required:** yes

## Policies

- **Per-Agent Limit:** $50
- **Alert Threshold:** 80%

## Structure

### CEO — Chief Executive

- **Level:** 10
- **Domain:** operations

### Engineering

#### Lead — Engineering Lead

- **Level:** 7
- **Domain:** engineering
- **Reports To:** CEO

#### Builder — Developer

- **Level:** 4
- **Domain:** engineering
- **Reports To:** Lead
- **Count:** 2
```

View your org tree:

```bash
openspawn org
```

```
My Agent Org
└── CEO (executive, L10)
    └── Lead (L7)
        ├── Builder-1 (L4)
        └── Builder-2 (L4)
```

## Connect to Claude Code

Add OpenSpawn as an MCP server in your Claude Code config:

```json
{
  "mcpServers": {
    "openspawn": {
      "command": "npx",
      "args": ["openspawn", "start", "--stdio"]
    }
  }
}
```

Your Claude Code agents can now:
- Read your org structure (`org_read`)
- Create and claim tasks (`task_create`, `task_claim`)
- Delegate work down the hierarchy (`delegate`)
- Escalate blockers up the chain (`escalate`)
- Track budgets (`budget_check`, `budget_spend`)

## CLI Commands

```
openspawn init [name]          Scaffold ORG.md + .openspawn/
openspawn org                  Show org tree
openspawn start                Start MCP server (HTTP, port 3456)
openspawn start --stdio        Start MCP server (stdio, for Claude Code)
openspawn status               Show org status

openspawn hire <name>          Add agent to org
openspawn fire <name>          Remove agent from org

openspawn task list            List all tasks
openspawn task create <desc>   Create a task
openspawn task next            Claim next available task
openspawn task done <id>       Mark task complete

openspawn delegate             Delegate task to a report
openspawn escalate             Escalate task to manager
openspawn report               Report status/completion
openspawn budget [agent]       Show budget status
```

## MCP Tools

When running as an MCP server, OpenSpawn exposes 13 tools:

| Tool | Description |
|------|-------------|
| `org_read` | Parse ORG.md, return structured org |
| `org_update` | Modify ORG.md |
| `task_list` | List tasks (filterable) |
| `task_create` | Create a new task |
| `task_claim` | Claim an available task |
| `task_update` | Update task status |
| `delegate` | Delegate task down hierarchy |
| `escalate` | Escalate task up hierarchy |
| `hire` | Add agent to org |
| `fire` | Remove agent from org |
| `budget_check` | Check remaining budget |
| `budget_spend` | Record spend |
| `report` | Report status/completion |

## How It Works

1. **ORG.md** — Your org chart in markdown. Agents, hierarchy, policies, culture. Version-controlled, diffable.
2. **`.openspawn/tasks.json`** — Task state on disk. No database. Just files.
3. **MCP Server** — Any MCP-compatible agent connects and participates in the org.
4. **CLI** — Human operators manage the org from the terminal.

## Why Not Just Use Sub-Agents?

| | OpenSpawn | Ephemeral Teams |
|---|---|---|
| **Memory** | Persistent across sessions | Dies with the window |
| **Hierarchy** | 10-level (L1–L10) | Flat (lead/teammate) |
| **Budget control** | Per-agent limits + tracking | None |
| **Escalation** | Typed chain of command | Ad-hoc |
| **Governance** | Policies, approval gates | None |
| **Framework** | Any agent, any framework | Single platform |

## Works With

- **Claude Code** — via MCP (stdio)
- **Cursor** — via MCP
- **OpenClaw** — native integration
- **Any MCP client** — Streamable HTTP or stdio
- **Any agent with shell access** — via CLI

## License

MIT — [OpenSpawn](https://github.com/openspawn/openspawn)
