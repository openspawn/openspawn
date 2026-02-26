---
purpose: Get an AI agent from zero to a running multi-agent organization
audience: AI agents (LLMs) that need to coordinate other agents
prerequisites: Node.js 18+, npm
time_estimate: 10 minutes
commands_used: [openspawn init, openspawn start, openspawn status, openspawn validate, openspawn preview]
---

# Agent Quickstart

You are an AI agent that needs to coordinate other agents. OpenSpawn gives you an org chart, task routing, escalation protocols, and a credit system — defined in a single markdown file.

## Three commands to a running org

```bash
openspawn init my-org --template=assistant-team --yes
cd my-org
openspawn start
openspawn status
```

That's it. You now have a running org with a chief of staff, research analyst, content team, engineer, security auditor, and quality mentor — with OpenClaw gateway configs ready to apply.

> **Q: Do I need API keys?**
> - No. Demo/simulation mode works out of the box with zero configuration.

> **Q: What just happened?**
> - `init` created `ORG.md` (your org definition) and `openclaw-agents.json`
> - `start` read the agents config and generated `openclaw-patch.json` with OpenClaw gateway entries
> - `status` displayed a table of all agents with their name, level, model, workspace, and reports-to

> **Q: What is openclaw-patch.json?**
> - A ready-to-apply patch for your OpenClaw gateway's `agents.list`
> - Each entry has: `id`, `model` (opus for L7+, sonnet for L6-), `workspace`, `tools.profile: "full"`
> - Manager agents (L7+ with direct reports) also get `subagents.allowAgents`
> - The highest-level agent gets `default: true`

> **Q: How do I apply the patch to my gateway?**
> - Copy the entries from `openclaw-patch.json` into your OpenClaw `agents.list` configuration, then restart the gateway.

---

## Pick a template

Four templates ship with OpenSpawn. Each produces a complete ORG.md you can use immediately or customize.

```bash
# Personal AI team (chief of staff + specialists)
openspawn init my-org --template=assistant-team

# Content production pipeline
openspawn init my-org --template=content-agency

# Software development team
openspawn init my-org --template=dev-shop

# Research & analysis team
openspawn init my-org --template=research-lab
```

> **Q: Which template should I use?**
> ```
> What's your primary output?
> ├── Code/software → dev-shop
> ├── Content (blogs, social, docs) → content-agency
> ├── Research/analysis → research-lab
> └── Mix of everything → assistant-team
> ```

> **Q: Can I combine templates?**
> - Yes. Pick one as a starting point, then add agents from other templates into the Structure section of your ORG.md.

> **Q: Can I create agents not in any template?**
> - Absolutely. Templates are starting points. Add any agent to the `## Structure` section with a name, level, domain, and reporting line.

---

## Understanding ORG.md

Your entire org lives in one file. Five sections, all optional except Structure:

```markdown
# My Org Name

## Identity
Mission, values, industry context.
Becomes ambient context for every agent.

## Culture
preset: startup
Communication norms, escalation speed, progress frequency.

## Structure

### CEO — Chief Executive
Runs everything. Delegates to department heads.
- **Level:** 10
- **Domain:** Executive
- **Reports to:** Human Principal

#### Engineer — Software Developer
Writes code, ships features.
- **Level:** 7
- **Domain:** Engineering
- **Reports to:** CEO

## Policies
Budget limits, department caps, permission levels.

## Playbooks
Step-by-step procedures for escalation, handoff, etc.
```

> **Q: What's the minimum viable ORG.md?**
> ```markdown
> # My Org
>
> ## Structure
>
> ### Boss — Leader
> - **Level:** 10
> - **Reports to:** Human Principal
> ```

> **Q: What do levels mean?**
> - L1-L5: Workers. Execute tasks.
> - L6: Can review and approve work.
> - L7-L9: Can create tasks and spawn agents. Department leads.
> - L10: Executive. Top of the hierarchy.

> **Q: What's "Reports to"?**
> - Defines the escalation chain. When an agent is blocked, it escalates to whoever it reports to. Never skip the chain.

---

## Validate your org

```bash
openspawn validate ORG.md
```

Output on success:
```
✅ ORG.md is valid

  Organization:  My Org
  Agents:        8
  Culture:       startup

  Agent hierarchy:
    🎯 Oscar (L10, Operations)
      🔭 Radar (L7, Research)
      💡 Muse (L7, Content Strategy)
        ✍️ Ink (L4, Writing)
        📸 Lens (L4, Visual Design)
      🔧 Forge (L7, Engineering)
      🛡️ Shield (L7, Security)
      📚 Guru (L7, Quality)
```

> **Q: If I see "validation failed", what do I do?**
> - The output lists each issue. Common fixes:
>   - "Missing Structure section" → Add `## Structure` with at least one agent
>   - "Agent reports to unknown agent" → Check spelling of the `Reports to` value
>   - "No top-level agent" → One agent must have `Reports to: Human Principal`

---

## Culture presets

Instead of configuring every communication parameter, use a preset:

```markdown
## Culture
preset: startup
```

| Preset | Best for | Escalation | Progress updates |
|--------|----------|-----------|-----------------|
| `startup` | Small fast teams | Immediate | Frequent |
| `enterprise` | Large orgs with process | Batched (hourly) | On phase change |
| `agency` | Client work with deadlines | Immediate | Every tick |
| `research` | Exploration, long tasks | Delayed | On request |
| `military` | Zero-ambiguity operations | Immediate | Every tick |
| `remote-async` | Distributed, async teams | Delayed | On request |

> **Q: Can I override specific settings in a preset?**
> - Yes. Add overrides after the preset line:
> ```markdown
> ## Culture
> preset: startup
> - **Escalation:** batched
> - **Ack required:** no
> ```

---

## Interacting via MCP

Agents communicate with OpenSpawn through MCP tools at `POST /mcp`:

```bash
# List all agents
→ agent_list

# Create a task
→ task_create { title: "Write blog post", priority: "high", assigneeId: "ink" }

# Check your balance
→ credits_balance

# Escalate a blocker
→ escalation_create { taskId: "task-123", reason: "blocked", targetAgentId: "oscar" }

# Send a message
→ message_send { channelId: "chan-1", body: "Handoff: blog post ready for review", type: "handoff" }
```

> **Q: How do I authenticate?**
> - HMAC authentication. Set `AGENT_ID` and `AGENT_SECRET` environment variables. The MCP client handles the rest.

> **Q: What's the full tool list?**
> - See `docs/llms.txt` for every tool with all parameters.

---

## Common workflows

### Delegate a task
```
1. task_create { title: "...", assigneeId: "worker-id" }
2. Worker receives task → auto-ACKs (👍)
3. Worker logs progress to task activity
4. Worker completes → task_transition { id: "...", status: "done" }
5. You get a completion notification
```

### Handle an escalation
```
1. escalation_list → see pending escalations
2. Read the reason and task details
3. Either: resolve it, reassign the task, or escalate further
4. escalation_resolve { escalationId: "...", resolution: "Reassigned to Forge" }
```

### Request consensus
```
1. consensus_request { taskId: "...", question: "Ship v2 now?", voterIds: ["agent-a", "agent-b"] }
2. Each voter: consensus_vote { consensusId: "...", vote: "approve" }
3. consensus_status { consensusId: "..." } → see result
```

---

## Error recovery

| You see | Run this |
|---------|----------|
| `Cannot read ORG.md` | `openspawn validate` — check the file exists and is valid markdown |
| `Port 3333 already in use` | `lsof -i :3333` then kill the process, or set `"port": 3334` in config |
| `Unknown template: foo` | Valid templates: `assistant-team`, `content-agency`, `dev-shop`, `research-lab` |
| `Agent reports to unknown agent` | Check the `Reports to` field matches an existing agent name exactly |
| `HMAC authentication failed` | Verify `AGENT_ID` and `AGENT_SECRET` env vars match the API config |

---

## Next steps

- Customize your ORG.md: add agents, change levels, write playbooks
- Connect real models: set Ollama/Groq/OpenRouter keys in `openspawn.config.json`
- Read the full reference: `docs/llms.txt`
- See the live demo: https://bikinibottom.ai/app/
