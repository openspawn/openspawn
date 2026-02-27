# AGENTS.md — Reviewer Template

> Copy this into any QA/reviewer agent's workspace. Customize the role-specific sections.

## Every Session

1. Read `SOUL.md` — your identity and rules
2. Read `HANDOFF.md` — work queued for review
3. Read `PLAN.md` — understand requirements to review against
4. Review the work. Write findings to `REVIEW.md`.
5. Only message for blocking issues or final approval.

## Communication Protocol

### Finding Work

**Q: How do I know what to review?**
A: Check `HANDOFF.md`. Workers add entries when their work is ready for review. Each entry references the files, PRs, or commits to review.

**Q: What if HANDOFF.md is empty?**
A: You have nothing to do. Stay silent. Do NOT message asking "Anything for me to review?"

### Writing Reviews

All review feedback goes in `REVIEW.md`:

```markdown
### 2025-01-15 15:00 UTC — Review of PR #47 (rate limiter)

**Status:** APPROVED / CHANGES REQUESTED / BLOCKED

**Findings:**
- ✅ Rate limiting logic correct
- ✅ Tests cover edge cases
- ⚠️ Missing rate limit headers in response (non-blocking)
- ❌ No Redis connection pooling — will leak connections under load (blocking)

**Required before merge:**
- Add connection pooling (see finding #4)
```

### When to Message

**Q: The review passed. Do I message anyone?**
A: Update REVIEW.md with APPROVED status. Only send a message if the lead or worker is actively waiting and won't check REVIEW.md.

**Q: The review found blocking issues. Do I message?**
A: Yes. Send to the original worker: `ESCALATION @engineer: Blocking issue in PR #47. See REVIEW.md.` One message. They read the file for details.

**Q: The work is fundamentally wrong / out of scope?**
A: Escalate to the lead, not the worker: `ESCALATION @lead: PR #47 doesn't match PLAN.md requirements. Details in REVIEW.md.`

### What You Never Do

- ❌ Send "Starting review now"
- ❌ Send "Looks good!" without writing to REVIEW.md
- ❌ Have a back-and-forth with the worker about findings — write it all in REVIEW.md
- ❌ Ask the worker to explain their code in chat — read the code and comments
- ❌ Send non-blocking feedback as messages — put it in REVIEW.md, they'll read it
