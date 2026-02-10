# Case Study: Which Agent Broke Production?

> *"The post-mortem question: who approved this? Nobody knows."*

## The Scenario

**Jordan's** engineering team uses AI agents for their development workflow:

- **Code Reviewer** (L6): Reviews PRs, suggests changes
- **Test Writer** (L5): Generates test cases
- **Deploy Agent** (L4): Handles staging/production deployments

One morning, a critical bug ships to production. Users are affected. The team scrambles to fix it.

Then comes the post-mortem: *How did this get through?*

- Did the code reviewer approve it?
- Did tests pass?
- Who triggered the deploy?
- Was there human oversight?

The answers are scattered across GitHub, Slack, deployment logs, and LLM provider dashboards. Piecing it together takes hours.

## How BikiniBottom Solves This

### 1. Centralized Event History

Every significant action is logged in one place:

```
[2026-02-07 14:32:01] task.status_changed
Task: TASK-0089 - Add payment validation
Actor: code-reviewer (L6)
Previous: IN_PROGRESS → New: REVIEW
Reasoning: "Code looks good. Added input validation for edge cases."

[2026-02-07 14:45:22] task.status_changed  
Task: TASK-0089 - Add payment validation
Actor: test-writer (L5)
Previous: REVIEW → New: DONE
Reasoning: "All 12 test cases passing. Coverage at 94%."

[2026-02-07 15:01:33] agent.action
Actor: deploy-agent (L4)
Action: deploy_to_production
Task: TASK-0089
Reasoning: "Task marked DONE, deploying to production per workflow."
```

Now you can trace exactly what happened, when, and *why each agent made their decision*.

### 2. Actor Attribution

Every event has an `actorId` — whether it's an agent or a human:

```typescript
{
  id: "evt-a1b2c3",
  type: "task.completed",
  actorId: "agent-code-reviewer",  // Who did this
  entityType: "task",
  entityId: "TASK-0089",           // What was affected
  severity: "INFO",
  reasoning: "...",                 // Why they did it
  createdAt: "2026-02-07T14:45:22Z"
}
```

### 3. Filterable Event Queries

Need to see everything a specific agent did? Or everything related to a specific task?

```bash
# All events for a task
openspawn events list --task TASK-0089

# All actions by an agent
openspawn events list --actor code-reviewer

# All production deployments this week
openspawn events list --type deploy --since 7d
```

### 4. Severity Levels

Events are categorized by severity, making it easy to spot issues:

- **INFO**: Routine operations
- **WARNING**: Unusual but not critical
- **ERROR**: Something went wrong

The Events Dashboard highlights warnings and errors so they don't get buried.

## The Outcome

In Jordan's post-mortem with BikiniBottom:

1. **14:32** — Code Reviewer approved the PR *(logged with reasoning)*
2. **14:45** — Test Writer marked tests passing *(logged with coverage %)*
3. **15:01** — Deploy Agent pushed to production *(logged with task reference)*

The root cause? The Test Writer's test cases didn't cover the specific edge case. The Code Reviewer's reasoning shows they focused on input validation, not the affected code path.

**Time to root cause**: 5 minutes, not 5 hours.

**Action item**: Add test coverage requirements before tasks can be marked DONE.

---

## Compliance & Audits

For regulated industries, BikiniBottom provides:

- **Immutable event logs**: Once logged, events can't be modified
- **Organization-scoped data**: Each org's data is isolated
- **Exportable history**: Pull events for external audit systems
- **Actor accountability**: Every action traced to an agent or human

---

## Try It Yourself

```bash
# View recent events
openspawn events list --limit 20

# Filter by severity
openspawn events list --severity WARNING,ERROR

# Get full event details
openspawn events get evt-a1b2c3
```

**Live Demo**: [openspawn.github.io/openspawn/#/events](https://openspawn.github.io/openspawn/#/events)
