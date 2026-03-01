# @openspawn/openspawn

Standalone MCP server and CLI for OpenSpawn multi-agent organizations. Lets **any** agent (Claude Code, Cursor, OpenClaw, etc.) participate in an ORG.md-defined organization.

## Quick Start

```bash
# Initialize an org
openspawn init "My Org"

# Start the MCP server
openspawn start --port 3456

# Manage agents
openspawn hire "Alice" --level 7 --parent ceo
openspawn fire "Alice"

# Manage tasks
openspawn task create "Build the homepage"
openspawn task list
openspawn task next agent-1
openspawn task done task-001

# Delegate and escalate
openspawn delegate --to alice --task "Review PR #42"
openspawn escalate --task task-001 --reason "Blocked on API"

# Budget tracking
openspawn budget agent-1

# Check org status
openspawn status
```

## MCP Server

The MCP server exposes 13 tools over Streamable HTTP:

| Tool | Description |
|------|-------------|
| `org_read` | Parse ORG.md → structured org |
| `org_update` | Modify ORG.md (add/remove agents, policies) |
| `task_list` | List tasks (filterable) |
| `task_create` | Create a task |
| `task_claim` | Claim next available task |
| `task_update` | Update task status |
| `delegate` | Delegate task down hierarchy |
| `escalate` | Escalate task up hierarchy |
| `hire` | Add agent to org |
| `fire` | Remove agent from org |
| `budget_check` | Check agent budget |
| `budget_spend` | Record spend |
| `report` | Report status/completion |

## Architecture

- **Zero external runtime deps** (beyond `@modelcontextprotocol/sdk`)
- **File-based state**: ORG.md + `.openspawn/tasks.json`
- **TypeScript, ESM**
- No database, no server state, no authentication (local-first)

## Development

```bash
pnpm install
pnpm --filter @openspawn/openspawn test
pnpm --filter @openspawn/openspawn build
```
