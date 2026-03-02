---
title: Agent Quickstart
---

# Agent Quickstart

**What you'll learn:** How to go from zero to a running multi-agent org in 3 commands — templates, ORG.md structure, MCP tool usage, error recovery, and the boot sequence protocol.

You are an AI agent that needs to coordinate other agents. OpenSpawn gives you an org chart, task routing, escalation protocols, and a credit system — defined in a single markdown file called `ORG.md`.

**The core idea:** One file defines your entire agent organization. Everything else — the CLI, the coordinator, the dashboard — exists to execute what's in the ORG.md.

## Three commands to a running org

```bash
openspawn init my-org --template=saas-onboarding --yes
cd my-org
openspawn start
openspawn status
```

That's it. You now have a running org with an Onboarding Lead, Data Migration Specialist, Integration Engineer, and Success Agent — with OpenClaw gateway configs ready to apply.

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

Seven industry templates ship with OpenSpawn. Each produces a complete ORG.md you can use immediately or customize.

```bash
# SaaS customer onboarding pipeline
openspawn init my-org --template=saas-onboarding

# DevOps incident response team
openspawn init my-org --template=incident-response

# Legal contract review pipeline
openspawn init my-org --template=contract-review

# Fintech compliance monitoring
openspawn init my-org --template=compliance-monitoring

# Gaming live operations team
openspawn init my-org --template=game-live-ops

# E-commerce catalog management
openspawn init my-org --template=catalog-management

# Healthcare clinical trial processing
openspawn init my-org --template=clinical-trials
```

> **Q: Which template should I use?**
> ```
> What's your domain?
> ├── Customer success / onboarding → saas-onboarding
> ├── Infrastructure / reliability  → incident-response
> ├── Legal / compliance            → contract-review or compliance-monitoring
> ├── Gaming / live service         → game-live-ops
> ├── E-commerce / retail           → catalog-management
> └── Healthcare / life sciences    → clinical-trials
> ```

> **Q: Can I combine templates?**
> - Yes. Pick one as a starting point, then add agents from other templates into the Structure section of your ORG.md.

> **Q: Can I create agents not in any template?**
> - Absolutely. Templates are starting points. Add any agent to the `## Structure` section with a name, level, domain, and reporting line.

---

## Understanding ORG.md

Your entire org lives in one file. Five sections, all optional except Structure:

```markdown
# SaaS Onboarding Org

## Identity
Mission, industry context, pain solved.
Becomes ambient context for every agent.

## Culture
preset: agency
Communication norms, escalation speed, progress frequency.

## Structure

### Onboarding Lead — Customer Onboarding Manager
The quarterback. Owns customer relationships from contract to go-live.
- **Level:** 7
- **Department:** Customer Success
- **Reports to:** Human Principal

#### Data Migration Specialist — Senior Data Engineer
Ingests and validates customer data from source systems.
- **Level:** 5
- **Department:** Engineering
- **Reports to:** Onboarding Lead

## Policies
Budget limits, permission guardrails, human approval thresholds.

## Playbooks
Step-by-step procedures for standard scenarios and escalations.
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

  Organization:  SaaS Onboarding Org
  Agents:        4
  Culture:       agency

  Agent hierarchy:
    🎯 Onboarding Lead (L7, Customer Success)
      📦 Data Migration Specialist (L5, Engineering)
      🔧 Integration Engineer (L5, Engineering)
      ✅ Success Agent (L4, Customer Success)
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
preset: agency
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
> preset: agency
> - **Escalation:** batched
> - **Ack required:** no
> ```

---

## Interacting via MCP

Agents communicate with OpenSpawn through MCP tools at `POST /mcp`:

```bash
# List all agents
→ agent_list

# Create a task (e.g., onboard a new customer)
→ task_create { title: "Onboard Acme Corp", priority: "high", assigneeId: "onboarding-lead" }

# Check your balance
→ credits_balance

# Escalate a blocker
→ escalation_create { taskId: "task-123", reason: "migration blocked", targetAgentId: "onboarding-lead" }

# Send a structured message
→ message_send { channelId: "chan-1", body: "Migration complete for Acme Corp. 1.2M rows verified.", type: "handoff" }
```

> **Q: How do I authenticate?**
> - HMAC authentication. Set `AGENT_ID` and `AGENT_SECRET` environment variables. The MCP client handles the rest.

> **Q: What's the full tool list?**
> - See `docs/llms.txt` for every tool with all parameters.

---

## Managing Tasks

The coordination tools give agents a shared task board backed by SQLite. Here's the core workflow:

### Create a task
```
tool: task_create { title: "Migrate Acme Corp database", priority: "high", assign_to: "data-migration-specialist" }
```

### Claim an open task
```
tool: task_claim { task_id: "abc123", agent_id: "data-migration-specialist" }
```
> **Q: Can two agents claim the same task?**
> No. `task_claim` is atomic — only one agent wins, the other gets an error. This prevents duplicate work.

### Complete a task
```
tool: task_complete { task_id: "abc123", result: "1.2M rows migrated, checksum verified", artifacts: ["migration-report.md"] }
```

### List tasks
```
tool: task_list { status: "open", priority: "high" }
```

### Escalate a problem
```
tool: escalation_create { issue: "source database connection refused", severity: "high", to_agent: "onboarding-lead" }
```

### Check org status
```
tool: org_status
```
> Returns a full overview: all agents, task counts, budget status.

> **Q: How do agents coordinate work?**
> Via coordination tools. `task_create` assigns work, `task_claim` prevents duplicate effort, `task_complete` records results. `message_send` handles structured communication (TASK/RESULT/ESCALATION/DECISION types).

> **Q: Where's the full tool reference?**
> See `docs/llms.txt` — the "Coordination Tools" section lists all 14 tools with parameters.

---

## Common workflows

### Delegate a task
```
1. task_create { title: "...", assigneeId: "specialist-id" }
2. Specialist receives task → auto-ACKs (👍)
3. Specialist logs progress to task activity
4. Specialist completes → task_transition { id: "...", status: "done" }
5. You get a completion notification
```

### Handle an escalation
```
1. escalation_list → see pending escalations
2. Read the reason and task details
3. Either: resolve it, reassign the task, or escalate further
4. escalation_resolve { escalationId: "...", resolution: "Engaged engineering support, ETA 2 hours" }
```

### Request consensus
```
1. consensus_request { taskId: "...", question: "Proceed with live migration?", voterIds: ["agent-a", "agent-b"] }
2. Each voter: consensus_vote { consensusId: "...", vote: "approve" }
3. consensus_status { consensusId: "..." } → see result
```

---

## Error recovery

| You see | Run this |
|---------|----------|
| `Cannot read ORG.md` | `openspawn validate` — check the file exists and is valid markdown |
| `Port 3333 already in use` | `lsof -i :3333` then kill the process, or set `"port": 3334` in config |
| `Unknown template: foo` | Valid templates: `saas-onboarding`, `incident-response`, `contract-review`, `compliance-monitoring`, `game-live-ops`, `catalog-management`, `clinical-trials` |
| `Agent reports to unknown agent` | Check the `Reports to` field matches an existing agent name exactly |
| `HMAC authentication failed` | Verify `AGENT_ID` and `AGENT_SECRET` env vars match the API config |

---

## Boot Sequence — How Orgs Start Up

When `openspawn start` boots your org, the lead agent doesn't just start delegating. It follows a **planning-first boot sequence**:

```
1. Read ORG.md     → understand mission, team, constraints
2. Read PLAN.md    → check if resuming a previous run
3. Write PLAN.md   → break mission into phased tasks with assignments
4. Register agents → agent_register for each team member
5. Create tasks    → task_create for current-phase items
6. Monitor         → org_status every 5 minutes
7. Adapt           → update PLAN.md when things change
8. Complete        → escalate "mission complete" when done
```

**Example for a SaaS onboarding org:** The Onboarding Lead reads the ORG.md, sees the 48-hour track playbook, writes PLAN.md with phases (Migration, Integration, Config, Go-Live), creates tasks for each specialist, and monitors via org_status until the customer completes their first workflow.

> **Q: Why planning first?**
> Plans are cheaper than confusion. A 30-second PLAN.md prevents hours of rework, wasted tokens, and "what did you mean?" messages.

> **Q: What goes in PLAN.md?**
> - Mission statement (from ORG.md)
> - Phase breakdown (what order to build)
> - Task table with assignments, priorities, dependencies, and status
> - Success criteria and definition of done

> **Q: How do workers know what to do?**
> Workers read PLAN.md on startup, then claim their assigned tasks via `task_claim`. They don't wait for chat messages — the plan IS the assignment.

> **Q: What if the plan needs to change?**
> The lead updates PLAN.md first, then updates MCP tasks to match. PLAN.md is always the source of truth.

See `templates/boot-sequence.md` for the full protocol, `templates/SOUL-lead.md` for the lead agent template, and `templates/SOUL-worker.md` for the worker template.

---

## Next steps

- **Customize your ORG.md:** add agents, change levels, write playbooks — see [`docs/org-md-reference.md`](./org-md-reference.md)
- **Connect real models:** set Ollama/Groq/OpenRouter keys in `openspawn.config.json`
- **All MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md) — full parameter reference
- **Communication rules:** [`docs/communication-protocol.md`](./communication-protocol.md) — save 50-70% on coordination tokens
- **Template deep dive:** [`docs/templates-guide.md`](./templates-guide.md) — all 7 industry templates
- **Top FAQ:** [`docs/FAQ.md`](./FAQ.md) — common questions answered
- **Fix errors:** [`docs/troubleshooting.md`](./troubleshooting.md) — common issues and fixes
- **Full reference:** [`docs/llms.txt`](./llms.txt)
- **Live demo:** https://openspawn.dev/app/
