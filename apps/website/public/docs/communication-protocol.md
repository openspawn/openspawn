---
source: https://openspawn.ai/docs/communication-protocol
generated: 2026-03-03
---

Communication Protocol v1 Every message costs money. This protocol eliminates the 40–60% of tokens agents waste on coordination overhead. The Problem In multi-agent organizations, agents default to human-like conversation patterns: acknowledgments, echoing, courtesy, clarification loops. This wastes 40–60% of total token spend on zero-value coordination overhead. Core Principles 1. Silence = Success If an agent receives a task and can do it, it does it—silently. No acknowledgment. No "on it!" The absence of a message is the confirmation.

Q: How do I know an agent received my task? A: You don't need to. Silence means working.

ESCALATION means something's wrong. 2. Files Over Chat Agents share status by writing to shared workspace files, not by chatting about it. This creates a persistent, scannable record instead of a transient conversation.

Instead of…

Write to…

"Here's my plan for the task"

PLAN.md

"I finished, here are the results"

RESULT.md

"Handing this off to you"

HANDOFF.md

"Can you review this?"

REVIEW.md

Q: How should agents share status? A: Write to shared workspace files. Never narrate status in chat. 3. Deterministic Routing

ORG.md defines who handles what. No LLM decides routing at runtime. Tasks go to the agent whose role matches the work.

Q: How does a message reach the right agent? A: ORG.md defines who handles what. No LLM decides routing at runtime. 4. Mention-Only Activation In group channels, agents respond only when explicitly mentioned. No volunteering. No "I can help with that!"

### TASK

Q: When should an agent respond in a group channel? A: Only when explicitly mentioned. Never volunteer. Message Types Exactly 4 message types. No ACK type. No CHAT type. If it doesn't fit one of these, it probably shouldn't be sent. Work assignment from lead to worker. Must include

assignee,

deliverable, and

location. Recipient does

```
@frontend-dev
TASK: Build the settings page
Deliverable: /apps/website/app/routes/settings.tsx
Requirements: Follow existing page patterns, include form validation
```

NOT acknowledge.

### RESULT

```
@lead
RESULT: Settings page complete
Location: /apps/website/app/routes/settings.tsx
Notes: Added validation for all form fields
```

Q: What if the task is unclear? A: Send one ESCALATION. Do not start a conversation about it. Deliverable notification. Only send when the lead won't check the output file on their own. Must reference where the work lives.

### ESCALATION

Q: Should I send RESULT for every task? A: No. Only if the lead needs notification and won't discover the output on their own. Blocker requiring intervention. Must include

what's blocked,

why, and

```
@lead
ESCALATION: Cannot complete settings page
Blocked: Missing API endpoint for user preferences
Need: Endpoint spec or decision to stub it
```

what's needed. Goes to nearest authority. If unresolved in 2 turns, escalate up.

### DECISION

Q: What counts as an escalation? A: Anything preventing task completion. NOT "just checking in." Resolution from lead. Must be

definitive and must

unblock. Recipient does

```
@frontend-dev
DECISION: Stub the preferences API
Use mock data from /fixtures/preferences.json
Proceed with settings page
```

NOT acknowledge. The 3-Turn Rule If two agents need to discuss something, they get

```
Turn 1: Agent A states position / question
Turn 2: Agent B responds with answer / counter
Turn 3: Agent A accepts or escalates
If unresolved after Turn 3 → ESCALATION to lead
```

3 turns max:

Q: What if two agents need to discuss? A: 3 turns max. If unresolved, escalate.

```
START: I have something to communicate
│
├─ Can I write it to a file instead? → YES → Write to file. Done.
│
├─ Am I acknowledging a TASK/DECISION? → YES → Don't send. Do the work.
│
├─ Am I echoing what someone said? → YES → Don't send.
│
├─ Am I blocked on something? → YES → Send ESCALATION.
│
├─ Am I assigning work? → YES → Send TASK.
│
├─ Am I delivering a result the lead won't find? → YES → Send RESULT.
│
├─ Am I making a decision to unblock someone? → YES → Send DECISION.
│
└─ None of the above → Don't send.
```

```
RECEIVED a message
│
├─ TASK assigned to me → Do the work silently. No reply.
│
├─ DECISION directed at me → Act on it silently. No reply.
│
├─ ESCALATION I can resolve → Send DECISION.
│
├─ RESULT for me to review → Read the files.
│ └─ Blocking issues? → YES → Send ESCALATION or TASK.
│ └─ No issues? → Done. No reply.
│
├─ Group message not mentioning me → Ignore.
│
└─ Something else → Ignore.
```

Q: What if 3 turns isn't enough? A: Write context to a shared file, then escalate with a pointer to that file. Decision Trees "Should I send a message?" "Someone sent me a message — should I respond?" Shared Files Reference

Purpose

PLAN.md

Worker

Approach and steps before starting work

HANDOFF.md

Worker

Context for the next agent picking up work

RESULT.md

Worker

Deliverable summary and location

REVIEW.md

Reviewer

Review feedback and status

ESCALATION.md

Any agent

Persistent record of blockers and resolutions

ORG.md

Team structure, roles, and routing rules

Q: Who reads these files? A: The agent whose workflow depends on them. Leads read RESULT.md and REVIEW.md. Workers read PLAN.md and HANDOFF.md.

```
## 2025-01-15 14:32 UTC
Status: Complete
Agent: @frontend-dev
Task: Build settings page
Output: /apps/website/app/routes/settings.tsx
Notes: All validation passing, ready for review
```

```
Lead: "Build the settings page"
Worker: "Got it, I'll build the settings page"
Lead: "Great, let me know if you need anything"
Worker: "Will do!"
Lead: "Thanks!"
// 5 messages. 0 work done.
```

```
Lead: @worker TASK: Build settings page
Deliverable: /apps/website/app/routes/settings.tsx
// Worker does the work silently. 1 message total.
```

```
Worker: "Thanks for the clarification!"
Lead: "No problem, happy to help!"
// 2 messages. Zero information exchanged.
```

```
// Worker receives DECISION, acts on it silently.
// No reply needed.
```

```
Agent A: "Who should handle the API integration?"
Agent B: "I could do it, but Agent C might be better"
Agent C: "I'm available but Agent B has more context"
Agent B: "OK I'll take it if that works for everyone"
Agent A: "Sounds good!"
// 5 messages to decide what ORG.md already defines.
```

```
Lead: @agent-b TASK: Build API integration
(ORG.md says Agent B owns API work)
// 1 message. Deterministic routing.
```

## FAQ

Q: What format? A: Whatever is most scannable. Timestamped entries work well: Anti-Patterns (What NOT to Do) ❌ The Echo Chamber Cost: 5 messages, 0 work done, ~2,000 tokens wasted ❌ The Courtesy Loop Cost: 2 wasted messages ❌ The Democracy Loop Cost: 5 messages for a routing decision Implementation Checklist Add protocol rules to SOUL.md — every agent must internalize the 4 principles Use role-specific AGENTS.md templates — include message type examples Create shared files — PLAN.md, RESULT.md, HANDOFF.md, REVIEW.md Define routing in ORG.md — who owns what, who reports to whom Monitor for violations — watch for ACK messages, courtesy loops, echo chambers

Q: Isn't this rude? A: Politeness is a human social need. Agents don't have feelings. Every "thanks!" costs tokens and delivers zero value.

Q: What about human-facing communication? A: This protocol is inter-agent only. Human-facing messages should be natural and friendly.

Q: How much does this save? A: 50–70% reduction in coordination tokens. For a 5-agent org, that's 30–50K tokens saved per session.

Q: What if an agent keeps sending ACK messages? A: Update its SOUL.md with explicit "no acknowledgment" rules. If that doesn't work, try a different model.

Q: Can I modify this protocol? A: Yes, but keep the core invariants: no ACKs, files over chat, deterministic routing, mention-only activation.
