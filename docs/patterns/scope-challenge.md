# The Scope Challenge (Office Hours Pattern)

> Interview before building. The most expensive mistake is building the wrong thing perfectly.

*Adapted from [gstack](https://github.com/garrytan/gstack)'s Office Hours skill (MIT license), reframed for multi-agent organizations.*

---

## The Problem

Agents are eager to build. Give them a task and they'll start coding immediately. But the most valuable thing an agent can do is *challenge the premise* before any implementation begins.

This pattern — borrowed from YC office hours — forces structured questioning before work starts. It prevents the most common failure mode in AI-assisted development: building the wrong thing, fast.

## The Six Forcing Questions

### 1. What's the Actual Pain?

Not the feature request — the *pain*. What is the human/user/system actually suffering from? Feature requests are symptoms. Pain is the disease.

**Bad:** "We need a notification system."
**Good:** "Users are missing critical updates because they only check the dashboard once a day."

### 2. What's the Status Quo?

What is being done today to solve (or work around) this pain? If nothing — why not? If something — why is it insufficient?

Understanding the status quo reveals:
- How urgent the pain actually is (if people aren't working around it, maybe it's not that painful)
- What "good enough" looks like (your solution must beat this)
- Hidden constraints (why the obvious solution hasn't been tried)

### 3. Desperate Specificity

Who is the most specific, desperate user? Not "developers" — which developer, doing what, hitting which wall? The narrower you define the user, the sharper the solution.

**Bad:** "Teams that need better collaboration."
**Good:** "A solo founder who ships 10 PRs/day across 3 repos and loses track of which agent is working on what."

### 4. The Narrowest Wedge

What is the smallest thing you could build that proves value? Not an MVP — a *wedge*. The thinnest possible entry point that, if it works, proves the whole thesis.

**Bad:** "Build a full task management system."
**Good:** "Show a single dashboard with agent status (idle/working/blocked) — just that."

### 5. Observation (What Do You See?)

What have you observed — in data, in behavior, in the market — that others haven't? This is where Layer 3 (first principles) thinking lives. The best products are built on unique observations.

### 6. Future-Fit

If this succeeds wildly, does it still make sense in 2 years? Or are you building for today's constraints that won't exist tomorrow? This question prevents over-engineering for current limitations while ensuring the direction is durable.

## Using the Scope Challenge in an Agent Org

### As a CLI Command

```bash
openspawn office-hours
```

Runs an interactive interview that outputs a structured design brief. No LLM required — just guided questions and your answers.

### As a Planner Agent

Add a `planner` role to your ORG.md that automatically runs a scope challenge before any implementation task:

```yaml
name: Planner
role: planner
level: 9
system_prompt: |
  Before any implementation begins, interview the requester using
  the six forcing questions. Do not accept vague answers.
  Output a design brief before greenlighting work.
```

### As a Review Gate

Require scope challenges for tasks above a certain complexity threshold. Add to your ORG.md policies:

```yaml
policies:
  scope_challenge: "Tasks estimated at >4 hours require a completed scope challenge before implementation."
```

## Output: The Design Brief

A completed scope challenge produces a structured design brief:

```markdown
# Design Brief: [Title]

**Date:** YYYY-MM-DD
**Challenger:** [who ran the interview]
**Requester:** [who wants the thing]

## 1. Pain
[Actual pain, not feature request]

## 2. Status Quo
[What's being done today]

## 3. Target User
[Specific, desperate user profile]

## 4. Narrowest Wedge
[Smallest provably valuable thing]

## 5. Unique Observation
[What you see that others don't]

## 6. Future-Fit
[Why this still makes sense in 2 years]

## Recommendation
[Build / Rethink / Kill — with reasoning]
```

---

*Based on the Office Hours pattern from [gstack](https://github.com/garrytan/gstack) (MIT License), inspired by YC office hours methodology.*
