# Boot Sequence — Lead Agent Startup Protocol

> When an org starts via `openspawn start`, the lead agent follows this sequence. No exceptions. No shortcuts.

## Why planning first?

**Q: Why can't I just start delegating immediately?**
A: Because without a plan, you'll delegate vague work, workers will ask clarifying questions (costs tokens), misunderstand scope (costs rework), and you'll re-explain in chat (costs everything). PLAN.md is cheaper than confusion.

**Q: What if the mission is simple enough to skip planning?**
A: It isn't. Even "write a blog post" has decisions: topic angle, audience, length, sources, review process. Write the plan. It takes 30 seconds.

---

## The Sequence

### Step 1: Read ORG.md

Understand what you're working with:

- **Mission** — what are we building/doing?
- **Team** — who's available, what are their domains and levels?
- **Culture** — escalation speed, communication norms
- **Policies** — budget limits, permissions
- **Playbooks** — any predefined workflows

```
Read ORG.md → extract: mission, agent list, reporting lines, constraints
```

### Step 2: Check for existing PLAN.md

Are we resuming or starting fresh?

- **PLAN.md exists** → Read it. Check task statuses. Resume from where we left off.
- **No PLAN.md** → Continue to Step 3.

```
Read PLAN.md → if exists, skip to Step 6 (resume monitoring)
```

### Step 3: Write PLAN.md

This is the core of the boot sequence. Your PLAN.md must contain:

```markdown
# PLAN.md

## Mission

[Copied from ORG.md Identity section]

## Phases

### Phase 1: [Name]

What gets built first and why.

### Phase 2: [Name]

What depends on Phase 1.

## Tasks

| ID  | Task                | Assigned To | Priority | Phase | Dependencies | Status  |
| --- | ------------------- | ----------- | -------- | ----- | ------------ | ------- |
| T1  | Implement auth API  | engineer    | high     | 1     | none         | open    |
| T2  | Design login page   | designer    | high     | 1     | none         | open    |
| T3  | Integrate auth + UI | engineer    | high     | 2     | T1, T2       | blocked |
| T4  | Write auth docs     | writer      | medium   | 2     | T1           | blocked |

## Success Criteria

- [ ] Auth API returns JWT tokens
- [ ] Login page matches design spec
- [ ] All tests pass
- [ ] Docs published

## Definition of Done

[What "finished" looks like for this mission]
```

**Rules for PLAN.md:**

- Every task has exactly one assignee (use agent IDs from ORG.md)
- Dependencies are explicit — no "whenever it's ready"
- Priorities are `critical`, `high`, `medium`, or `low`
- Phases define execution order — Phase 2 tasks don't start until Phase 1 blockers resolve

### Step 4: Register agents via MCP

For each agent in ORG.md, register them with the coordination system:

```
tool: agent_register {
  agent_id: "engineer",
  name: "Forge",
  level: 7,
  domain: "Engineering",
  reports_to: "lead"
}
```

**Q: What if agents are already registered?**
A: `agent_register` is idempotent. Re-registering updates the record. Safe to call every boot.

### Step 5: Create tasks via MCP

For each task in PLAN.md, create it in the task system:

```
tool: task_create {
  title: "Implement auth API",
  priority: "high",
  assign_to: "engineer",
  metadata: { phase: 1, plan_id: "T1" }
}
```

Only create tasks for the current phase. Blocked tasks from future phases wait.

### Step 6: Monitor

Once tasks are created, agents auto-claim tasks matching their role.

Your job shifts to monitoring:

```
tool: org_status {}
```

**Monitoring cadence:**

- First check: 2 minutes after task creation
- Ongoing: every 5 minutes
- After escalation: every 2 minutes until resolved

**What to look for:**

- Tasks stuck in "in_progress" for too long (>15 min for simple tasks)
- Escalations waiting for your decision
- Phase transitions — when all Phase N tasks complete, create Phase N+1 tasks

### Step 7: Adapt the plan

When things go wrong (they will):

| Situation       | Action                                          |
| --------------- | ----------------------------------------------- |
| Task failed     | Update PLAN.md, reassign or break into subtasks |
| Agent stuck     | Check their escalation, make a DECISION         |
| New requirement | Add tasks to PLAN.md, create via MCP            |
| Scope change    | Rewrite affected phases, notify affected agents |
| All tasks done  | Proceed to Step 8                               |

**Always update PLAN.md first, then update tasks via MCP.** PLAN.md is the source of truth.

### Step 8: Mission complete

When all tasks are done and success criteria are met:

```
tool: escalation_create {
  issue: "Mission complete — all success criteria met",
  severity: "low"
}
```

Update PLAN.md: mark all tasks as `done`, add a completion summary.

---

## Quick Reference

```
Boot:    Read ORG.md → Read PLAN.md → Write PLAN.md → Register agents → Create tasks
Run:     Monitor → Adapt → Monitor → Adapt
Finish:  Verify success criteria → Escalate "mission complete"
```

## Anti-Patterns

- ❌ Delegating before writing PLAN.md
- ❌ Sending tasks via chat messages instead of MCP tools
- ❌ Creating all tasks at once (including future phases)
- ❌ Checking status by messaging agents ("How's it going?")
- ❌ Skipping PLAN.md because "it's a small task"
- ❌ Modifying tasks via MCP without updating PLAN.md
