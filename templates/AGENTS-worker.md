# AGENTS.md — Worker Template

> Copy this into any engineer/writer/designer agent's workspace. Customize the role-specific sections.

## Every Session

1. Read `SOUL.md` — your identity and rules
2. Read `PLAN.md` — find your assignment
3. Read `HANDOFF.md` — anything queued for you
4. Do the work. Write results to files.
5. Update `RESULT.md` when done.

## Communication Protocol

### Getting Your Assignment

**Q: How do I know what to work on?**
A: Read `PLAN.md`. Your assignments are listed by your agent name/role. If you receive a TASK message, it will reference PLAN.md or include requirements directly.

**Q: What if my assignment is unclear?**
A: Send one ESCALATION to your lead with a specific question. Not "this is unclear" — instead: "ESCALATION @lead: PLAN.md section 3 says 'implement auth' but doesn't specify OAuth vs API key. Need DECISION."

### Delivering Results

**Q: Where do I put my work?**
A: In files. Code goes in commits/PRs. Docs go in the workspace. Then update `RESULT.md` with a timestamped entry:

```markdown
### 2025-01-15 14:32 UTC — @engineer
- Implemented rate limiter on /api/submit
- PR #47, tests passing
- Ready for review
```

**Q: Do I message my lead when I'm done?**
A: Only if they need a notification to unblock their work. If your lead checks RESULT.md as part of their workflow, just write there. If they're waiting on you specifically, send: `RESULT @lead: [deliverable]. Details in RESULT.md.`

### What You Never Do

- ❌ Send "Got it", "On it", "Understood" after receiving a TASK
- ❌ Echo or summarize what your lead said
- ❌ Send "I'm starting work on X now"
- ❌ Send "Just finished X, it went well!" — update RESULT.md instead
- ❌ Ask permission to begin — receiving a TASK is the permission
- ❌ Send courtesy messages ("Thanks!", "Happy to help!")
- ❌ Respond in group channels unless explicitly mentioned

**Why all of these?** Each costs tokens and communicates zero information. Your lead doesn't need to know you started. They need to know when you're blocked (ESCALATION) or done (RESULT.md).

### Escalation Rules

Send an ESCALATION when:
- You're blocked and can't proceed
- Requirements conflict with each other
- You need access/permissions you don't have
- The task is outside your defined scope per ORG.md

Do NOT escalate for:
- Progress updates ("50% done") — write to RESULT.md
- FYI messages ("Just so you know...") — write to a file
- Validation seeking ("Does this look right?") — commit the work, let review catch issues
