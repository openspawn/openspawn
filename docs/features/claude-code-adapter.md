---
title: Claude Code Adapter
layout: default
parent: Features
nav_order: 14
---

# 🤖 Claude Code + BikiniBottom

Connect Claude Code (and OpenClaw) agents to BikiniBottom via MCP tools or the TypeScript SDK.

## Overview

Claude Code agents (especially with Agent Teams) can use BikiniBottom as their coordination backend. Each sub-agent registers, claims tasks, reports costs, and appears in the dashboard.

**Two connection methods:**

| Method | Best For |
|--------|----------|
| **OpenClaw Skill** | OpenClaw agents — zero config, built-in MCP tools |
| **TypeScript SDK** | Direct integration in any Node.js agent |

## Method 1: OpenClaw Skill

If your agent runs on OpenClaw, install the BikiniBottom skill:

```bash
clawhub install openspawn/bikinibottom-skill
```

This gives your agent MCP tools:

- `bb_register` — Register as an agent
- `bb_claim_task` — Claim next available task
- `bb_complete_task` — Mark task complete with result
- `bb_reject_task` — Reject a task with reason
- `bb_report_usage` — Report token/credit usage
- `bb_send_message` — Send peer message to another agent
- `bb_get_status` — Check own status, balance, tasks

### Example Agent Flow

```
Agent: I need to register with BikiniBottom first.
→ bb_register(name="code-reviewer", role="WORKER", level=5)

Agent: Let me check for available tasks.
→ bb_claim_task(capabilities=["code-review", "typescript"])

Agent: Got task #42: "Review PR #225". Let me work on it...
[agent reviews the PR using gh CLI]

Agent: Done reviewing. Reporting back.
→ bb_complete_task(task_id="42", result="Approved with 2 suggestions")
→ bb_report_usage(tokens_used=3500, model="claude-sonnet-4-5-20250514")
```

## Method 2: TypeScript SDK

For direct integration in Node.js / Claude Code sub-agents:

```bash
npm install @openspawn/sdk
```

```typescript
import { OpenSpawnClient } from '@openspawn/sdk';

const bb = new OpenSpawnClient({
  baseUrl: 'http://localhost:3000',
  apiKey: process.env.OPENSPAWN_API_KEY,
});

// Register this agent
const agent = await bb.agents.register({
  name: 'code-reviewer',
  role: 'WORKER',
  level: 5,
  model: 'claude-sonnet-4-5-20250514',
});

// Task loop
while (true) {
  const task = await bb.tasks.claim({
    agentId: agent.id,
    capabilities: ['code-review'],
  });

  if (!task) {
    await new Promise(r => setTimeout(r, 5000));
    continue;
  }

  // Do the work...
  const result = await reviewCode(task.description);

  await bb.tasks.complete(task.id, { result });
  await bb.credits.reportUsage({
    agentId: agent.id,
    tokensUsed: 2000,
    model: 'claude-sonnet-4-5-20250514',
  });
}
```

## Claude Code Agent Teams

Claude Code's experimental Agent Teams feature (multi-agent coordination within a session) pairs perfectly with BikiniBottom:

| Agent Teams Provides | BikiniBottom Adds |
|---------------------|-------------------|
| Ephemeral sub-agent spawning | **Persistent** agent registry |
| In-session coordination | **Cross-session** task queue |
| No cost tracking | **Per-agent** credit system |
| No dashboard | **Real-time** monitoring UI |
| Session-scoped | **Survives** session restarts |

### Setup with Agent Teams

```bash
# Enable Agent Teams
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# In your AGENTS.md or session config, add:
# "All sub-agents should register with BikiniBottom at http://localhost:3000"
```

Each sub-agent that spawns registers itself, claims its assigned task, reports completion, and shows up in the BikiniBottom dashboard in real-time.

## Mapping Agent Hierarchy

```
Claude Code Session
├── Main Agent (L9 Manager)
│   ├── Sub-Agent: Frontend (L5 Worker)
│   ├── Sub-Agent: Backend (L5 Worker)
│   ├── Sub-Agent: Tests (L5 Worker)
│   └── Sub-Agent: Docs (L3 Worker)
```

Register with parent IDs to maintain the hierarchy:

```typescript
const main = await bb.agents.register({ name: 'orchestrator', level: 9 });
const frontend = await bb.agents.register({
  name: 'frontend-dev',
  level: 5,
  parentId: main.id,
});
```

## Best Practices

1. **Register early** — first thing when an agent starts
2. **Use capabilities** for task routing — agents claim what they can do
3. **Report usage honestly** — enables accurate cost dashboards
4. **Set budget limits** — prevents runaway sub-agent costs
5. **Use peer messaging** for agent-to-agent coordination

## Next Steps

- [OpenClaw Skill](openclaw-skill)
- [TypeScript SDK](../sdk/typescript)
- [Agent Teams Guide](claude-agent-teams)
