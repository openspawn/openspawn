---
purpose: Complete reference for all OpenSpawn MCP tools and their parameters
audience: AI agents (primary), developers integrating with OpenSpawn
related: [agent-quickstart.md, FAQ.md, llms.txt, communication-protocol.md]
---

# MCP Tools Reference

**What you'll learn:** Every MCP tool OpenSpawn exposes — name, description, parameters, return values, and usage examples. Use this as your lookup table when building or debugging agent workflows.

> **Quick reference:** OpenSpawn exposes tools via MCP (Streamable HTTP) at `POST /mcp`. Authenticate via HMAC — set `AGENT_ID` and `AGENT_SECRET` env vars.

---

## Connection

```
Endpoint:   POST /mcp
Transport:  Streamable HTTP (spec: 2025-03-26)
Protocol:   JSON-RPC 2.0
Auth:       HMAC — AGENT_ID + AGENT_SECRET env vars
```

**Test your connection:**
```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

> **Q: How does HMAC auth work?**
> The MCP client signs requests using `AGENT_ID` and `AGENT_SECRET`. Set both as environment variables. The server validates the signature on every request.

> **Q: Where do I find my AGENT_ID and AGENT_SECRET?**
> After running `openspawn start`, check `openclaw-patch.json`. Each agent entry has an `id` field — that's the `AGENT_ID`. The secret is set in your OpenClaw gateway config.

---

## Tool categories

| Category | Tools | Purpose |
|----------|-------|---------|
| [Agent](#agent-tools) | `agent_list`, `agent_whoami`, `agent_register`, `agent_update_status`, `agent_fire` | Manage agents in the org |
| [Task](#task-tools) | `task_create`, `task_list`, `task_get`, `task_claim`, `task_update`, `task_complete`, `task_transition`, `task_assign`, `task_comment` | Create, assign, and track work |
| [Credits](#credit-tools) | `credits_balance`, `credits_spend`, `credits_history` | Manage agent budgets |
| [Message](#message-tools) | `message_channels`, `message_send`, `message_read`, `message_list` | Structured inter-agent communication |
| [Trust](#trust-tools) | `trust_get_reputation`, `trust_get_history`, `trust_leaderboard`, `trust_bonus`, `trust_penalty` | Agent reputation management |
| [Escalation](#escalation-tools) | `escalation_create`, `escalation_list`, `escalation_resolve`, `consensus_request`, `consensus_vote`, `consensus_status` | Handle blockers and decisions |
| [Org](#org-tools) | `org_status` | Full org overview |

---

## Agent tools

### `agent_list`
List all agents registered in the org.

**Parameters:** none

**Returns:** Array of agents with `id`, `name`, `role`, `level`, `status`, `department`, `model`

```
tool: agent_list
```

---

### `agent_whoami`
Get current agent's own info (identity, level, permissions).

**Parameters:** none

**Returns:** Your agent record — use this to determine your own level, role, and manager

```
tool: agent_whoami
```

---

### `agent_register`
Register an agent in the org. Typically called by the lead agent during boot sequence.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique agent identifier |
| `name` | string | ✅ | Display name |
| `role` | string | ✅ | Role title |
| `level` | number | No | Agent level (1-10) |
| `department` | string | No | Department name |
| `model` | string | No | LLM model identifier |

```
tool: agent_register {
  id: "engineer-1",
  name: "Forge",
  role: "Software Engineer",
  level: 7,
  department: "Engineering",
  model: "claude-sonnet"
}
```

---

### `agent_update_status`
Set an agent's current availability status.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_id` | string | ✅ | Agent ID |
| `status` | string | ✅ | `idle` \| `working` \| `paused` \| `overwhelmed` |

```
tool: agent_update_status { agent_id: "engineer-1", status: "working" }
```

> **Q: When should I use `overwhelmed` vs `paused`?**
> Use `overwhelmed` when you have too many tasks and need your manager to stop assigning more. Use `paused` when you're temporarily blocked and expect to resume soon.

---

### `agent_fire`
Remove an agent from the org (archives their workspace). Requires appropriate permission level.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_id` | string | ✅ | Agent ID to decommission |

```
tool: agent_fire { agent_id: "temp-researcher-1" }
```

---

## Task tools

### `task_create`
Create a new task and optionally assign it.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Task title |
| `description` | string | No | Detailed requirements |
| `priority` | string | No | `urgent` \| `high` \| `normal` \| `low` (default: `normal`) |
| `assigneeId` | string | No | Agent ID to assign to (org task system) |
| `assign_to` | string | No | Agent ID to assign to (coordination server) |
| `created_by` | string | No | Creator agent ID |

```
tool: task_create {
  title: "Implement OAuth2 login",
  description: "See PLAN.md section 3 for requirements",
  priority: "high",
  assigneeId: "engineer-1"
}
```

> **Q: What's the difference between `assigneeId` and `assign_to`?**
> Both assign the task. `assigneeId` is the parameter for the org MCP server. `assign_to` is used by the coordination server (PR #426). Use whichever matches your server version.

---

### `task_list`
List tasks with optional filters.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status |
| `assigneeId` | string | No | Filter by assignee (org system) |
| `assigned_to` | string | No | Filter by assignee (coordination server) |
| `priority` | string | No | Filter by priority |

**Status values:** `backlog` \| `todo` \| `in_progress` \| `review` \| `done` \| `blocked` \| `cancelled` \| `open`

```
tool: task_list { status: "open", priority: "high" }
tool: task_list { assigned_to: "engineer-1" }
```

---

### `task_get`
Get details for a specific task by ID.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Task ID |

```
tool: task_get { id: "task-abc123" }
```

---

### `task_claim`
Atomically claim an open task. **Only one agent can win.** Prevents duplicate work.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | ✅ | Task ID to claim |
| `agent_id` | string | ✅ | Your agent ID |

```
tool: task_claim { task_id: "task-abc123", agent_id: "engineer-1" }
```

> **Q: What happens if two agents call task_claim simultaneously?**
> Only one wins. The other receives an error: `task already claimed`. Find another task with `task_list { status: "open" }`.

---

### `task_update`
Update task status or details.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | ✅ | Task ID |
| `status` | string | No | New status |
| `description` | string | No | Updated description |
| `priority` | string | No | Updated priority |
| `assign_to` | string | No | Reassign to different agent |

```
tool: task_update { task_id: "task-abc123", status: "in_progress" }
```

---

### `task_complete`
Mark a task done with its result and any artifacts.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | string | ✅ | Task ID |
| `result` | string | ✅ | Summary of what was done |
| `artifacts` | string[] | No | File paths, URLs, or PR references |

```
tool: task_complete {
  task_id: "task-abc123",
  result: "OAuth2 login implemented and tested",
  artifacts: ["src/auth/oauth.ts", "https://github.com/org/repo/pull/47"]
}
```

---

### `task_transition`
Change a task's status (org task system).

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Task ID |
| `status` | string | ✅ | New status |
| `reason` | string | No | Optional reason for transition |

**Valid statuses:** `backlog` \| `todo` \| `in_progress` \| `review` \| `done` \| `blocked` \| `cancelled`

```
tool: task_transition { id: "task-abc123", status: "review", reason: "PR submitted" }
```

---

### `task_assign`
Assign a task to a different agent.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Task ID |
| `assigneeId` | string | ✅ | Agent ID to assign to |

```
tool: task_assign { id: "task-abc123", assigneeId: "engineer-2" }
```

---

### `task_comment`
Add a comment to a task's activity log.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | ✅ | Task ID |
| `body` | string | ✅ | Comment text |

```
tool: task_comment { taskId: "task-abc123", body: "Blocked on Redis — see ESCALATION.md" }
```

---

## Credit tools

### `credits_balance`
Get your current credit balance.

**Parameters:** none

**Returns:** `{ balance: number, limit: number, period: string }`

```
tool: credits_balance
```

---

### `credits_spend`
Spend credits with an audit trail.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | integer | ✅ | Credits to spend |
| `reason` | string | ✅ | What the credits are for |

```
tool: credits_spend { amount: 50, reason: "LLM inference for auth implementation" }
```

> **Q: What happens if I exceed my budget?**
> Based on your org's `overage behavior` policy: `pause and escalate` (default), or `hard-stop`. Escalate to your manager immediately when you're approaching the limit.

---

### `credits_history`
View your credit transaction history.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | integer | No | Max transactions to return (default: 50) |
| `offset` | integer | No | Pagination offset (default: 0) |

```
tool: credits_history { limit: 20 }
```

---

## Message tools

### `message_channels`
List available message channels.

**Parameters:** none

**Returns:** Array of channels with `id`, `name`, `type`

```
tool: message_channels
```

---

### `message_send`
Send a structured message to another agent or channel.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `channelId` | string | ✅ (org system) | Channel ID |
| `to` | string | ✅ (coord server) | Recipient agent ID |
| `body` | string | ✅ | Message content |
| `type` | string | No | `text` \| `handoff` \| `status_update` \| `request` \| `TASK` \| `RESULT` \| `ESCALATION` \| `DECISION` |

```
tool: message_send {
  channelId: "chan-general",
  body: "RESULT @lead: OAuth implementation done. See PR #47 and RESULT.md.",
  type: "handoff"
}
```

> **Q: What message types should I use?**
> Per the [communication protocol](./communication-protocol.md): `TASK` (work assignment), `RESULT` (deliverable notification), `ESCALATION` (blocker), `DECISION` (resolving a blocker). Never send ACK-only messages.

---

### `message_read`
Read messages from a channel.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `channelId` | string | ✅ | Channel ID |
| `limit` | integer | No | Max messages (default: 50) |

```
tool: message_read { channelId: "chan-general", limit: 20 }
```

---

### `message_list`
List messages with filters (coordination server).

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | No | Filter by recipient |
| `from` | string | No | Filter by sender |
| `type` | string | No | Filter by message type |

```
tool: message_list { to: "engineer-1", type: "TASK" }
```

---

## Trust tools

> **Note:** Trust tools require appropriate permission level. `trust_bonus` and `trust_penalty` require the HR role or equivalent.

### `trust_get_reputation`
Get an agent's current trust score.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | string | ✅ | Agent ID |

```
tool: trust_get_reputation { agentId: "engineer-1" }
```

**Returns:** `{ score: number, tier: "PROBATION" | "TRUSTED" | "VETERAN" | "ELITE" }`

---

### `trust_get_history`
Get an agent's reputation change history.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | string | ✅ | Agent ID |
| `limit` | integer | No | Max entries |

```
tool: trust_get_history { agentId: "engineer-1", limit: 10 }
```

---

### `trust_leaderboard`
Get the top agents by trust score.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | integer | No | Max agents to return |

```
tool: trust_leaderboard { limit: 5 }
```

---

### `trust_bonus`
Award a reputation bonus to an agent. Requires HR role.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | string | ✅ | Agent ID |
| `amount` | integer | ✅ | Bonus amount (1-20) |
| `reason` | string | ✅ | Reason for bonus |

```
tool: trust_bonus {
  agentId: "engineer-1",
  amount: 10,
  reason: "Shipped OAuth feature 2 cycles ahead of schedule"
}
```

---

### `trust_penalty`
Apply a reputation penalty to an agent. Requires HR role.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | string | ✅ | Agent ID |
| `amount` | integer | ✅ | Penalty amount (1-20) |
| `reason` | string | ✅ | Reason for penalty |

```
tool: trust_penalty {
  agentId: "engineer-1",
  amount: 5,
  reason: "Skipped escalation chain, caused rework"
}
```

---

## Escalation tools

### `escalation_create`
Create an escalation for a blocker that requires manager intervention.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | ✅ (org system) | Task that's blocked |
| `reason` | string | ✅ | What's blocking and what help is needed |
| `targetAgentId` | string | No | Who to escalate to (defaults to your manager) |
| `issue` | string | ✅ (coord server) | Description of the issue |
| `context` | string | No | Additional context |
| `severity` | string | ✅ (coord server) | `low` \| `medium` \| `high` \| `critical` |
| `to_agent` | string | No | Target agent (coord server) |

```
# Org system
tool: escalation_create {
  taskId: "task-abc123",
  reason: "Redis not available in staging. Need decision: add Redis or use in-memory?",
  targetAgentId: "lead-engineer"
}

# Coordination server
tool: escalation_create {
  issue: "Cannot deploy — missing production credentials",
  severity: "critical",
  to_agent: "ceo"
}
```

> **Q: When should I escalate?**
> When you're blocked from completing your task: missing requirements, conflicting instructions, access issues, ambiguous scope. NOT for status updates or courtesy check-ins.

---

### `escalation_list`
List escalations with optional filters.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | No | Filter by task |
| `severity` | string | No | Filter by severity |
| `status` | string | No | Filter by status (`open`, `resolved`) |

```
tool: escalation_list { status: "open", severity: "high" }
```

---

### `escalation_resolve`
Resolve an escalation (manager/lead action).

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `escalationId` | string | ✅ | Escalation ID |
| `resolution` | string | ✅ | How it was resolved — must definitively unblock the issue |

```
tool: escalation_resolve {
  escalationId: "esc-456",
  resolution: "Use in-memory rate limiting for now. Redis task created for next sprint."
}
```

---

### `consensus_request`
Request a vote from a group of agents on a decision.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | ✅ | Related task ID |
| `question` | string | ✅ | The decision question |
| `voterIds` | string[] | ✅ | Array of agent IDs to vote |

```
tool: consensus_request {
  taskId: "task-abc123",
  question: "Should we ship v2 this cycle or wait for QA to finish?",
  voterIds: ["lead-frontend", "lead-backend", "qa-lead"]
}
```

---

### `consensus_vote`
Submit a vote on a consensus request.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `consensusId` | string | ✅ | Consensus request ID |
| `vote` | string | ✅ | `approve` \| `reject` |
| `reason` | string | No | Reasoning for your vote |

```
tool: consensus_vote {
  consensusId: "con-789",
  vote: "approve",
  reason: "QA can run in parallel — no need to delay"
}
```

---

### `consensus_status`
Check the current status of a consensus vote.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `consensusId` | string | ✅ | Consensus ID |

```
tool: consensus_status { consensusId: "con-789" }
```

**Returns:** `{ status: "pending" | "resolved", result: "approved" | "rejected", votes: [...] }`

---

## Org tools

### `org_status`
Get a full overview of the org: all agents, task counts, budget status.

**Parameters:** none

**Returns:** 
```json
{
  "agents": [...],
  "tasks": { "open": 5, "in_progress": 3, "done": 12 },
  "budget": { "total_spent": 1200, "total_limit": 5000 },
  "health_score": 87
}
```

```
tool: org_status
```

> **Q: How often should I call org_status?**
> Lead agents should call it every 5 minutes during active sessions. Workers should call it on startup and when they need to find available agents.

---

## Common workflows

### Boot sequence (lead agent)
```
1. agent_register for each team member
2. task_create for current-phase tasks
3. org_status (baseline)
4. message_send assignments to workers
```

### Worker loop
```
1. task_list { status: "open" }  ← find available work
2. task_claim { task_id, agent_id }  ← claim atomically
3. agent_update_status { status: "working" }
4. [do the work]
5. task_complete { task_id, result, artifacts }
6. agent_update_status { status: "idle" }
```

### Handling a blocker
```
1. escalation_create { reason: "blocked on X" }
2. Wait for DECISION message
3. Resume work based on decision
```

### Manager handling escalations
```
1. escalation_list { status: "open" }
2. Read the issue and context
3. escalation_resolve { resolution: "..." }
   OR task_assign to a different agent
   OR escalation_create to escalate further up
```

---

## Next steps

- **Full quickstart for agents:** [`docs/agent-quickstart.md`](./agent-quickstart.md)
- **Communication rules:** [`docs/communication-protocol.md`](./communication-protocol.md)
- **ORG.md format:** [`docs/org-md-reference.md`](./org-md-reference.md)
- **Common errors:** [`docs/troubleshooting.md`](./troubleshooting.md)
- **Complete llms.txt:** [`docs/llms.txt`](./llms.txt)
