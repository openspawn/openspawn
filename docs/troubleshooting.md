---
purpose: Diagnose and fix common OpenSpawn problems
audience: AI agents, developers
related: [FAQ.md, agent-quickstart.md, getting-started.md, mcp-reference.md]
---

# Troubleshooting Guide

**What you'll learn:** How to diagnose and fix the most common OpenSpawn problems — CLI errors, validation failures, MCP auth issues, port conflicts, and task coordination bugs.

> **Quick start:** Run `openspawn validate` first. It catches ~80% of config problems and tells you exactly what to fix.

> **Q: Where should I start when something is broken?**
> Always run `openspawn validate` first. Most problems are config or syntax issues in ORG.md that validation will catch and explain.

> **Q: My agent isn't doing anything — what do I check?**
> In order: (1) Is the server running? `curl http://localhost:3333/health`. (2) Is the agent registered? `tool: agent_list`. (3) Does the agent have open tasks? `tool: task_list { assigned_to: "agent-id" }`. (4) Is the agent's status `idle`? `tool: agent_update_status { status: "idle" }`.

> **Q: How do I reset an org back to a clean state?**
> Stop the server, delete the SQLite DB (usually `openspawn.db` in your project directory), and restart with `openspawn preview`. All task/agent state is wiped. ORG.md is preserved.

---

## CLI Errors

### `Cannot read ORG.md` / `File not found`

**Symptom:** `openspawn start` or `openspawn validate` reports it can't find your org file.

**Diagnosis:**
```bash
ls -la ORG.md          # Is the file there?
pwd                     # Are you in the right directory?
openspawn validate ./path/to/ORG.md  # Explicit path
```

**Fix:**
- Make sure you're in the directory containing `ORG.md`
- Or pass the path explicitly: `openspawn validate path/to/ORG.md`

---

### `Unknown template: foo`

**Symptom:** `openspawn init --template=foo` fails.

**Valid template names:**
```bash
openspawn init my-org --template=assistant-team
openspawn init my-org --template=content-agency
openspawn init my-org --template=dev-shop
openspawn init my-org --template=research-lab
```

---

### `Port 3333 already in use`

**Symptom:** `openspawn preview` fails because port 3333 is taken.

**Fix option 1 — Kill the existing process:**
```bash
lsof -i :3333           # Find what's using port 3333
kill <PID>              # Kill it
openspawn preview       # Try again
```

**Fix option 2 — Change the port:**
```json
// openspawn.config.json
{
  "port": 3334
}
```

---

### `openspawn: command not found`

**Symptom:** Running `openspawn` fails with command not found.

**Fix:**
```bash
# Use npx (no install required)
npx openspawn init my-org

# Or install globally
npm install -g openspawn
openspawn --version
```

---

## Validation Errors

### `Missing Structure section`

**Symptom:** `openspawn validate` reports the Structure section is missing.

**Fix:** Add a `## Structure` section with at least one agent:

```markdown
## Structure

### MyAgent — Role
- **Level:** 10
- **Reports to:** Human Principal
```

---

### `Agent reports to unknown agent: "SomeName"`

**Symptom:** An agent's `Reports to` value doesn't match any defined agent.

**Common causes:**
- Typo in the agent name (case-sensitive)
- Agent was renamed but `Reports to` wasn't updated
- Agent was deleted but others still reference it

**Fix:**
```markdown
# WRONG — typo
#### Engineer — Backend Dev
- **Reports to:** Techh Lead   ← typo

# RIGHT
#### Engineer — Backend Dev
- **Reports to:** Tech Lead
```

**Pro tip:** Run `grep -n "Reports to" ORG.md` to list all references at once.

---

### `No top-level agent`

**Symptom:** No agent has `Reports to: Human Principal`.

**Fix:** Exactly one agent must report to the human:

```markdown
### CEO — Chief Executive
- **Level:** 10
- **Reports to:** Human Principal   ← required
```

---

### `Circular reporting chain detected`

**Symptom:** Agent A reports to Agent B, and Agent B reports to Agent A (or a longer cycle).

**Fix:** Draw out your hierarchy and check for loops. Every chain must terminate at `Human Principal`.

```bash
# Check all reporting lines
grep -A5 "### " ORG.md | grep "Reports to"
```

---

## MCP & Auth Issues

### `HMAC authentication failed`

**Symptom:** MCP tool calls return `401 Unauthorized`.

**Diagnosis:**
```bash
echo $AGENT_ID      # Should be set
echo $AGENT_SECRET  # Should be set
```

**Fix:** Set the env vars to match your API config:
```bash
export AGENT_ID="my-agent-id"
export AGENT_SECRET="my-agent-secret"
```

If you're unsure what the values should be, check `openclaw-patch.json` — the `id` field is the agent ID. The secret is set in your OpenClaw gateway config.

---

### `task_claim returns error: task already claimed`

**Symptom:** You try to claim a task but another agent already claimed it.

**This is expected behavior.** `task_claim` is atomic — only one agent wins. 

**Fix:**
```
tool: task_list { status: "open" }   ← find another open task
```

If you need to take over a claimed task, use `task_update` to reassign it (requires appropriate permissions).

---

### `MCP endpoint unreachable`

**Symptom:** MCP calls fail to connect.

**Diagnosis:**
```bash
curl http://localhost:3333/health    # Is the server up?
openspawn preview                    # Start it if not
```

**Common causes:**
- Server isn't running — run `openspawn preview`
- Wrong port — check `openspawn.config.json`
- Firewall blocking — check network rules if running remotely

---

### `credits_balance returns 0 or insufficient credits`

**Symptom:** Agent can't perform operations due to zero or insufficient credits.

**Diagnosis:**
```
tool: credits_balance
tool: credits_history { limit: 10 }
```

**Fix:**
- If budget is genuinely exhausted: escalate to your manager via `escalation_create`
- If budget seems wrong: check `## Policies` in `ORG.md` for per-agent limits
- Managers can reallocate via the dashboard or by updating policy

---

## Task Coordination Issues

### Agent isn't receiving tasks

**Symptom:** Tasks are created but an agent isn't picking them up.

**Diagnosis:**
```
tool: task_list { status: "open" }          ← are tasks in the queue?
tool: agent_list                            ← is the agent registered?
tool: agent_update_status { agent_id: "...", status: "idle" }  ← update status
```

**Common causes:**
- Agent status is `paused` or `overwhelmed` — update to `idle`
- Agent isn't registered — run `agent_register`
- Tasks are assigned to a different `assigneeId` — check `task_list { assigned_to: "agent-id" }`

---

### Escalations not resolving

**Symptom:** Escalations pile up without resolution.

**Diagnosis:**
```
tool: escalation_list { status: "open" }
```

**Fix — for managers:**
```
tool: escalation_resolve { 
  escalationId: "esc-123", 
  resolution: "Use in-memory storage for now, Redis is a future task" 
}
```

**The 2-cycle rule:** If an escalation isn't resolved in 2 cycles, escalate it further up the chain. If it reaches the top without resolution, it alerts the Human Principal.

---

### Task is stuck in `in_progress` with no updates

**Symptom:** A task was claimed but there's no progress and the agent seems stuck.

**Diagnosis:**
```
tool: task_get { id: "task-123" }            ← check status and assignee
tool: message_read { channelId: "general" }  ← any escalations?
```

**Fix:**
```
# Option 1: Reassign the task
tool: task_assign { id: "task-123", assigneeId: "other-agent" }

# Option 2: Reset to open
tool: task_update { task_id: "task-123", status: "todo" }
```

---

## Dashboard Issues

### Dashboard shows no agents

**Symptom:** The React dashboard at `http://localhost:3333` shows an empty org.

**Fix:**
```bash
openspawn start   # Generate openclaw-patch.json
openspawn status  # Verify agents are listed
```

Then apply `openclaw-patch.json` to your OpenClaw gateway config and restart.

---

### Real-time updates not working (SSE)

**Symptom:** Dashboard shows stale data, no live updates.

**Diagnosis:**
- Check browser console for SSE connection errors
- Check `EventSource` is connecting to `http://localhost:3333/events`

**Fix:**
- Refresh the browser
- Verify the server is running: `curl http://localhost:3333/health`
- Check for proxy interference if running behind a reverse proxy (SSE requires long-lived connections — disable buffering)

---

## ORG.md Format Issues

### Agent not appearing in `openspawn status` output

**Symptom:** You added an agent to `ORG.md` but it doesn't show in status output.

**Common causes:**
```markdown
# WRONG — H5 heading (too deep for direct agent)
##### NewAgent — Role

# RIGHT — H3 or H4 depending on hierarchy level
### NewAgent — Role
```

Also check that the agent has the required fields:
```markdown
### NewAgent — Role
- **Level:** 7
- **Reports to:** ExistingAgent
```

---

### Culture preset not applying

**Symptom:** Culture settings aren't affecting agent behavior.

**Fix:** Check syntax:
```markdown
## Culture
preset: startup      ← lowercase, no quotes
```

**Valid presets:** `startup`, `enterprise`, `agency`, `research`, `military`, `remote-async`

---

## Getting More Help

1. **Run validation first:** `openspawn validate` — most issues appear here
2. **Check the FAQ:** [`docs/FAQ.md`](./FAQ.md)
3. **Read the quickstart:** [`docs/agent-quickstart.md`](./agent-quickstart.md)
4. **GitHub issues:** https://github.com/openspawn/openspawn/issues
5. **Live demo for comparison:** https://bikinibottom.ai/app/

---

## Next steps

- **Back to basics:** [`docs/getting-started.md`](./getting-started.md)
- **All MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md)
- **Communication protocol:** [`docs/communication-protocol.md`](./communication-protocol.md)
- **Template options:** [`docs/templates-guide.md`](./templates-guide.md)
