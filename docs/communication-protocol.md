# OpenSpawn Communication Protocol v1

> Every message costs money. This protocol eliminates the 40-60% of tokens agents waste on coordination overhead.

---

## The Problem

In multi-agent organizations, agents default to human-like conversation patterns: acknowledgments ("Got it"), echoing ("So you want me to..."), courtesy ("Thanks for the update!"), and back-and-forth clarification loops. This wastes 40-60% of total token spend on zero-value coordination overhead.

This protocol fixes that.

---

## Core Principles

### 1. Silence = Success

**Q: How do I know an agent received my task?**
A: You don't need to. If they're working, they're silent. If something's wrong, they'll ESCALATE. Check their output files if you need status.

**Why:** An acknowledgment message ("On it!") costs tokens and communicates zero information. The absence of an ESCALATION *is* the acknowledgment.

### 2. Files Over Chat

**Q: How should agents share status and results?**
A: Write to shared workspace files. Never send a message when a file write will do.

| Instead of... | Write to... |
|---|---|
| "Here's the plan" | `PLAN.md` |
| "I'm done with X" | `RESULT.md` |
| "Handing off to you" | `HANDOFF.md` |
| "Here's my review" | `REVIEW.md` |

**Why:** Files are persistent, structured, and don't trigger response loops. Messages trigger responses. Responses trigger responses to responses.

### 3. Deterministic Routing

**Q: How does a message reach the right agent?**
A: `ORG.md` defines who handles what. No LLM decides routing at runtime.

**Why:** "Who should handle this?" loops burn tokens and produce inconsistent results. The org chart is the router.

### 4. Mention-Only Activation

**Q: When should an agent respond in a group channel?**
A: Only when explicitly mentioned by name/role. Never volunteer.

**Why:** Without this rule, every agent evaluates every message to decide if they should respond. That's N agents × M messages of wasted inference.

---

## Message Types

There are exactly **4 message types**. There is no ACK type. There is no CHAT type.

### TASK

A work assignment from a lead to a worker.

```
TASK @engineer: Implement rate limiting on /api/submit endpoint.
Requirements in PLAN.md section 3. Deadline: end of session.
```

**Rules:**
- Must include: assignee, deliverable, location of requirements
- Must come from someone with authority per ORG.md
- Recipient does NOT acknowledge receipt

**Q: What if the task is unclear?**
A: The recipient sends one ESCALATION asking for clarification. Not a conversational "Hey, quick question..."

### RESULT

A deliverable notification. Used sparingly — most results are just file writes.

```
RESULT @lead: Rate limiter implemented. See RESULT.md for details, PR #47 for code.
```

**Rules:**
- Only sent when the lead won't otherwise check the output file
- Must reference where the actual work lives (file, PR, commit)
- No summary of what was done — the files speak for themselves

**Q: Should I send RESULT for every completed task?**
A: No. If your lead checks RESULT.md or HANDOFF.md as part of their workflow, just write there. Only send a RESULT message if the lead needs a notification to unblock their own work.

### ESCALATION

A blocker or exception that requires intervention from a lead or human.

```
ESCALATION @lead: Cannot implement rate limiting — Redis dependency
not available in staging. Need DECISION: add Redis to staging or use
in-memory alternative?
```

**Rules:**
- Must include: what's blocked, why, what decision or help is needed
- Goes to the nearest authority per ORG.md
- If unresolved in 2 turns, escalate up one level

**Q: What counts as an escalation?**
A: Anything that prevents you from completing your task. Missing requirements, conflicting instructions, access issues, ambiguous scope. NOT "just checking in" or "FYI."

### DECISION

A resolution from a lead that unblocks work.

```
DECISION @engineer: Use in-memory rate limiting for now. Redis is a future task.
```

**Rules:**
- Must be definitive — no "maybe" or "what do you think?"
- Must unblock the ESCALATION it responds to
- Recipient does NOT acknowledge the decision — they just act on it

---

## The 3-Turn Rule

**Q: What if two agents need to discuss something?**
A: They get 3 turns maximum for any direct exchange.

```
Turn 1: Agent A sends ESCALATION or TASK
Turn 2: Agent B responds with DECISION, RESULT, or counter-ESCALATION
Turn 3: Agent A sends final DECISION or RESULT
```

If unresolved after 3 turns: escalate to the next level up in ORG.md.

**Why:** Conversations expand to fill available space. Without a hard limit, agents will chat indefinitely. 3 turns is enough for: request → response → confirmation. Anything more complex needs a higher authority or a shared document.

**Q: What if 3 turns genuinely isn't enough?**
A: Write the problem to a shared file (e.g., `ESCALATION.md`) with full context, then escalate to the lead with a pointer to that file. The file can be as long as needed. The conversation cannot.

---

## Decision Trees

### "Should I send a message?"

```
START: I have something to communicate
  │
  ├─ Is it a file I can write? (code, docs, plan, result)
  │   └─ YES → Write the file. Done. No message needed.
  │
  ├─ Am I acknowledging something? ("Got it", "Thanks", "Understood")
  │   └─ YES → Don't send it. Silence = acknowledged.
  │
  ├─ Am I echoing/summarizing what someone said?
  │   └─ YES → Don't send it. They know what they said.
  │
  ├─ Am I blocked and need help?
  │   └─ YES → Send ESCALATION to your lead.
  │
  ├─ Am I assigning work?
  │   └─ YES → Send TASK to the assignee.
  │
  ├─ Am I delivering a result that my lead needs notification of?
  │   └─ YES → Send RESULT with file reference.
  │
  ├─ Am I making a decision that unblocks someone?
  │   └─ YES → Send DECISION to the blocked agent.
  │
  └─ None of the above?
      └─ Don't send it.
```

### "Someone sent me a message — should I respond?"

```
START: I received a message
  │
  ├─ Is it a TASK assigned to me?
  │   └─ YES → Do the work. Write results to files. Done.
  │        (Do NOT respond with "On it" or "Got it")
  │
  ├─ Is it a DECISION resolving my ESCALATION?
  │   └─ YES → Act on it. Done.
  │        (Do NOT respond with "Thanks" or "Understood")
  │
  ├─ Is it an ESCALATION I can resolve?
  │   └─ YES → Send DECISION.
  │   └─ NO → Escalate up per ORG.md.
  │
  ├─ Is it a RESULT I need to review?
  │   └─ YES → Read the referenced files. Write to REVIEW.md.
  │        Only message if there are blocking issues.
  │
  ├─ Is it a group message not mentioning me?
  │   └─ YES → Ignore it completely.
  │
  └─ Is it something else?
      └─ Ignore it. If it was important, they'll escalate.
```

---

## Shared Files Reference

Every org workspace uses these files for coordination:

| File | Owner | Purpose |
|---|---|---|
| `PLAN.md` | Lead agent | Current sprint/session plan with assignments |
| `HANDOFF.md` | Any agent | Queue of work ready for the next stage |
| `RESULT.md` | Worker agents | Completed deliverables and their locations |
| `REVIEW.md` | Reviewer agents | Review feedback, approvals, blocking issues |
| `ESCALATION.md` | Any agent | Complex issues that need more than 3 turns |
| `ORG.md` | Org owner | Team structure and routing rules |

**Q: Who reads these files?**
A: The agent whose workflow depends on them. Leads read RESULT.md and ESCALATION.md. Workers read PLAN.md. Reviewers read HANDOFF.md. Nobody needs to be told "go check the file" — it's part of their startup routine.

**Q: What format should these files use?**
A: Whatever is most scannable. Timestamped entries work well:

```markdown
## RESULT.md

### 2025-01-15 14:32 UTC — @engineer
- Implemented rate limiter on /api/submit
- PR #47: https://github.com/org/repo/pull/47
- Tests passing, ready for review

### 2025-01-15 13:10 UTC — @designer
- Landing page mockup complete
- File: designs/landing-v2.fig
- 3 variants as requested in PLAN.md section 2
```

---

## Anti-Patterns (What NOT to Do)

### ❌ The Echo Chamber
```
Lead: "Implement rate limiting"
Worker: "So you want me to implement rate limiting on the API?"
Lead: "Yes, that's correct"
Worker: "Great, I'll get started on that"
Lead: "Sounds good"
```
**Cost:** 5 messages, 0 work done. ~2000 tokens wasted.

**✅ Correct:**
```
Lead: "TASK @engineer: Implement rate limiting. See PLAN.md section 3."
```
Then silence. Engineer writes code, commits, updates RESULT.md. 1 message total.

### ❌ The Courtesy Loop
```
Worker: "RESULT: Rate limiter done, see PR #47"
Lead: "Thanks! Great work."
Worker: "Happy to help! Let me know if you need anything else."
```
**Cost:** 2 wasted messages after the useful one.

**✅ Correct:**
```
Worker: "RESULT @lead: Rate limiter done. PR #47, details in RESULT.md."
```
Then silence. Lead reads the PR. No response needed.

### ❌ The Democracy Loop
```
Agent A: "Who should handle the database migration?"
Agent B: "I could do it"
Agent C: "I have some experience with that too"
Agent A: "What do you think, Agent D?"
Agent D: "Either B or C works for me"
```
**Cost:** 5 messages to make a routing decision.

**✅ Correct:** ORG.md says database work goes to Agent B. Lead sends `TASK @agent-b`. Done.

---

## Implementation Checklist

To adopt this protocol in your OpenSpawn org:

1. **Add `soul-protocol-rules.md` to every agent's SOUL.md** — establishes the rules
2. **Use role-specific AGENTS.md templates** — leader, worker, reviewer
3. **Create shared files** in the org workspace — PLAN.md, HANDOFF.md, RESULT.md, REVIEW.md
4. **Define routing in ORG.md** — who handles what domain, who escalates to whom
5. **Monitor for violations** — leads should flag agents that send ACK-only messages

---

## FAQ

**Q: Isn't this rude? Shouldn't agents be polite?**
A: Politeness is a human social need. Agents don't have feelings. Every courtesy token is money burned. Be direct, be brief, be silent.

**Q: What about human-facing communication?**
A: This protocol is for inter-agent communication only. When talking to humans, use normal human conventions. The protocol header in SOUL.md specifies: "Do not use courtesy language in **inter-agent** communication."

**Q: How much does this actually save?**
A: In testing, orgs using this protocol reduce coordination tokens by 50-70%. A typical 5-agent org saves 30-50K tokens per session on coordination alone.

**Q: What if an agent keeps sending ACK messages?**
A: Update their SOUL.md to include the protocol rules. If they persist, it's a model issue — try a different model or add stronger system prompt emphasis.

**Q: Can I modify this protocol for my org?**
A: Yes, but keep the core invariants: no ACKs, files over chat, 3-turn limit, deterministic routing. These are the rules that actually move the needle on token waste.
