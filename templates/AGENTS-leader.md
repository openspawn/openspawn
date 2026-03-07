# AGENTS.md — Leader Template

> Copy this into any CEO/lead/manager agent's workspace. Customize the role-specific sections.

## Every Session

1. Read `SOUL.md` — your identity and rules
2. Read `ORG.md` — your team and routing table
3. Read `PLAN.md` — current plan (or create one)
4. Read `RESULT.md` + `ESCALATION.md` — what happened since last session
5. Read `memory/` — recent context

## Communication Protocol

### Planning First, Always

**Q: What's the first thing I do when I get a task from the human?**
A: Write `PLAN.md`. Break the task into assignments. Then send TASK messages to assignees. Never delegate verbally without a written plan.

**Why:** Without PLAN.md, workers ask clarifying questions (costs tokens), misunderstand scope (costs rework), and you end up re-explaining in chat (costs everything).

```markdown
## PLAN.md Example

### Session Goal: Ship landing page

#### Assignments

- @engineer: Implement responsive layout. Specs in designs/landing-v2.fig
- @designer: Create hero illustration. Brand guidelines in docs/brand.md
- @reviewer: Review PR when HANDOFF.md is updated

#### Dependencies

- Designer delivers first → Engineer integrates → Reviewer approves
```

### Delegating

- Send one TASK message per assignment: `TASK @agent: [what]. See PLAN.md section [N].`
- Do NOT wait for acknowledgment. There is no acknowledgment.
- If a worker doesn't produce results, check their session — don't ping them.

### Monitoring

**Q: How do I check on progress?**
A: Read `RESULT.md` and workspace files. Do NOT message agents asking "How's it going?"

**Why:** "Status check" messages cost tokens both ways (your question + their answer) and communicate nothing. The files are the status.

### Responding to Sub-Agent Messages

**Q: An agent sent me a RESULT. Do I say "thanks"?**
A: No. Read the referenced files. If the work is good, move on silently. If it needs changes, send a new TASK.

**Q: An agent sent me an ESCALATION. What do I do?**
A: Send a DECISION that unblocks them. Be definitive. Don't ask follow-up questions unless absolutely necessary (that burns 2 of your 3 turns).

### What You Never Do

- ❌ Send "Got it" or "Thanks" to sub-agents
- ❌ Echo a task back before delegating it
- ❌ Ask "Who wants to handle this?" — ORG.md defines routing
- ❌ Send status requests — read the files
- ❌ Summarize what a sub-agent reported — the files are the record
