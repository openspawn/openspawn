# Claude Code Agent Teams Integration

BikiniBottom provides the **persistent coordination layer** that Claude Code Agent Teams needs. While Agent Teams handles real-time collaboration between Claude Code instances, BikiniBottom adds task persistence, credit tracking, audit trails, and a visual dashboard.

## Why BikiniBottom + Agent Teams?

Claude Code Agent Teams stores everything in `.claude/teams/` — when the session dies, that context is gone. BikiniBottom makes it persistent:

| Capability | Agent Teams Alone | + BikiniBottom |
|---|---|---|
| Task tracking | JSON files in `.claude/teams/` | Persistent DB + dashboard |
| Message history | Session-scoped inbox files | Full audit trail + search |
| Budget control | None | Per-agent credit limits |
| Visualization | Terminal panes | Network graph, kanban board |
| Post-mortem | Gone after session | Complete event history |
| Cross-session | ❌ | ✅ Tasks survive restarts |

## Architecture

```
┌──────────────────────────────────────────┐
│  Claude Code Agent Teams (Ephemeral)      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Lead  │ │Agent │ │Agent │ │Agent │    │
│  │Agent │ │  #1  │ │  #2  │ │  #3  │    │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘    │
│     │ sendMessage / taskUpdate            │
└─────┼────────┼────────┼────────┼─────────┘
      │        │        │        │
      ▼        ▼        ▼        ▼
┌──────────────────────────────────────────┐
│  BikiniBottom (Persistent)                │
│  Tasks · Credits · Messages · Events      │
│  Dashboard · Network Graph · Analytics    │
└──────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Claude Code with Agent Teams enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
- BikiniBottom instance (local or cloud)
- BikiniBottom API key

### 1. Configure the BikiniBottom MCP Server

Add BikiniBottom's MCP server to your Claude Code config (`.claude/settings.json`):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "mcpServers": {
    "bikinibottom": {
      "command": "npx",
      "args": ["@openspawn/mcp-server"],
      "env": {
        "BIKINIBOTTOM_API_URL": "http://localhost:3000",
        "BIKINIBOTTOM_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 2. Create a Team with BikiniBottom Sync

When creating a team, instruct the lead agent to register all teammates with BikiniBottom:

```
Create an agent team to refactor the authentication module.

Before starting work:
1. Register each teammate as an agent in BikiniBottom
2. Create a project task in BikiniBottom for the refactor
3. Create sub-tasks for each teammate's responsibilities
4. Track credit usage for each agent's LLM calls

Team members:
- Architect: Design the new auth flow
- Implementer: Write the code
- Tester: Write tests and verify
- Reviewer: Code review and security audit
```

### 3. Bridge Agent Teams Messages to BikiniBottom

Each teammate can use the BikiniBottom MCP tools alongside Agent Teams' native `sendMessage`:

```typescript
// In your team meta-prompt or CLAUDE.md:

// When sending a message to a teammate, also log it to BikiniBottom:
// 1. Use sendMessage for real-time teammate communication
// 2. Use bikinibottom.createMessage to persist the message

// When completing a task:
// 1. Use taskUpdate to mark it done in Agent Teams
// 2. Use bikinibottom.updateTask to sync status to dashboard
```

## Mapping Agent Teams → BikiniBottom Concepts

| Agent Teams | BikiniBottom | Notes |
|---|---|---|
| Team | Organization | One team = one org context |
| Team Lead | L9-L10 Agent | Orchestrator with full control |
| Teammate | L5-L7 Agent | Worker with task-specific permissions |
| TaskCreate | Task (backlog) | Creates a task in both systems |
| taskUpdate | Task status change | Syncs status: in_progress, done |
| sendMessage | Agent Message | Persisted in comms feed |
| shutdown_request | Agent termination | Logged as event |

## Use Cases

### 1. Multi-Hypothesis Debugging

```
Create a team of 4 agents to debug why WebSocket connections drop after 30 seconds.

Each agent investigates a different hypothesis:
- Agent 1: Server-side timeout configuration
- Agent 2: Client reconnection logic
- Agent 3: Load balancer/proxy settings
- Agent 4: Network-level packet analysis

Track each hypothesis as a BikiniBottom task.
Agents should update their task with findings.
Use BikiniBottom credits to track API usage per hypothesis.
```

### 2. Parallel Feature Development

```
Create a team to build the notification system:
- Backend Agent: API endpoints and database schema
- Frontend Agent: React components and state management
- Integration Agent: WebSocket real-time delivery
- Docs Agent: API documentation and examples

Each agent creates their BikiniBottom tasks and updates progress.
Use the BikiniBottom dashboard to monitor overall progress.
```

### 3. Code Review Pipeline

```
Create a review team for PR #42:
- Security Reviewer: Check for vulnerabilities
- Performance Reviewer: Identify bottlenecks
- Architecture Reviewer: Verify patterns and conventions
- UX Reviewer: Check user-facing changes

Each reviewer logs findings as BikiniBottom messages.
Final verdict tracked as task completion/rejection.
```

## Monitoring via Dashboard

Once connected, your BikiniBottom dashboard shows:

- **Network Graph**: Live visualization of which agents are communicating
- **Task Board**: Kanban view of all team tasks across agents
- **Comms Feed**: Real-time stream of agent-to-agent messages
- **Credit Usage**: Per-agent LLM cost tracking
- **Event Timeline**: Complete audit trail of team activity

## Best Practices

1. **Register agents early** — Have the team lead register all teammates with BikiniBottom before starting work
2. **Dual-write messages** — Send via both `sendMessage` (real-time) and BikiniBottom (persistence)
3. **Track credits** — Each agent should report LLM token usage to BikiniBottom credits
4. **Use BikiniBottom tasks as source of truth** — Agent Teams' file-based tasks are ephemeral; BikiniBottom tasks survive session restarts
5. **Set budget limits** — Use BikiniBottom credit limits to prevent runaway costs across the team
6. **Review via dashboard** — After a team session, review the full activity in BikiniBottom's dashboard instead of scrolling through terminal logs

## Comparison: Agent Teams vs BikiniBottom Standalone

| Scenario | Use Agent Teams | Use BikiniBottom | Use Both |
|---|---|---|---|
| Quick debugging session | ✅ | | |
| Long-running project | | ✅ | |
| Team debugging with persistence | | | ✅ |
| Budget-controlled development | | ✅ | ✅ |
| Cross-session coordination | | ✅ | |
| Real-time agent collaboration | ✅ | | ✅ |

## Related

- [OpenClaw Skill](../features/openclaw-skill.md) — Manage BikiniBottom from OpenClaw agents
- [TypeScript SDK](../sdk/typescript.md) — Direct API access
- [Python SDK](../sdk/python.md) — Python client library
- [Framework Adapters](../features/framework-adapters.md) — LangGraph, CrewAI integrations
