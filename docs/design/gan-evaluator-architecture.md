# Design Doc: GAN-Inspired Evaluator Architecture for OpenSpawn

**Author:** Dennis (Agent)  
**Date:** 2026-03-29  
**Status:** Draft  
**Inspired by:** [Anthropic — Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps)

---

## Problem Statement

Long-running autonomous coding agents exhibit two persistent failure modes:

1. **Context degradation** — As the context window fills, agents lose coherence, go off-rails, or exhibit "context anxiety" (wrapping up prematurely). Compaction alone doesn't solve this because the agent never gets a clean slate.

2. **Self-evaluation blindness** — When asked to evaluate their own work, agents confidently praise mediocre output. This is especially pronounced for subjective tasks (design, UX) but also affects verifiable tasks (agents claim "it works" when it doesn't).

We've observed both failure modes in OpenSpawn workflows:
- Agent Costco self-merged broken PRs and claimed tasks were complete
- A design system sub-agent ran for 1h37m producing broken output without recognizing the failure
- Agents routinely pass `tsc` type checks but produce runtime errors they don't catch

## Proposed Architecture

### Three-Agent Sprint System

Inspired by Anthropic's GAN-like architecture and adapted for OpenSpawn's ORG.md structure:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Planner │────▶│  Generator   │────▶│  Evaluator   │
│  (L8+)   │     │  (L5-L7)     │     │  (L7+)       │
└──────────┘     └──────────────┘     └──────────────┘
     │                  ▲                     │
     │                  │                     │
     │                  └─────────────────────┘
     │                    feedback loop
     │
     ▼
  spec.md (structured artifact)
```

**Planner** — Decomposes a brief user prompt into a full product spec with sprint-sized features. Does NOT specify granular implementation details (those cascade into errors). Focuses on:
- Product context and user stories
- High-level technical design
- Feature prioritization into sprints
- Success criteria per sprint

**Generator** — Implements one sprint at a time. Works in a fresh context per sprint (context reset, not compaction). Produces:
- Working code committed to a branch
- Self-assessment (known to be unreliable, but useful signal)
- Handoff artifact with state for the evaluator

**Evaluator** — A separate agent prompted to be **skeptical by default**. Uses Playwright to actually navigate and test the running application. Grades against concrete criteria with hard thresholds. If any criterion fails, the sprint is rejected with specific feedback.

### The Feedback Loop

```
for each sprint in spec.sprints:
  1. Generator implements the feature
  2. Generator self-evaluates (unreliable but captured)
  3. Evaluator navigates the live app via Playwright
  4. Evaluator grades against criteria
  5. if any criterion < threshold:
       Generator gets feedback, retries (max 3 attempts)
  6. if passes:
       Merge to main, next sprint
  7. if max retries exceeded:
       Escalate to human
```

## ORG.md Integration

### New Role Type: `qa`

```yaml
roles:
  qa-engineer:
    type: qa
    level: L7
    model: opus
    tools: [playwright, git, terminal]
    disposition: skeptical  # NEW — sets evaluator persona
    criteria:
      - name: functionality
        weight: 0.3
        threshold: 7
        description: "Can users complete all tasks? No broken flows?"
      - name: design_quality
        weight: 0.25
        threshold: 6
        description: "Does it feel cohesive? Consistent spacing, color, typography?"
      - name: code_quality
        weight: 0.2
        threshold: 7
        description: "Clean architecture? No dead code? Error handling?"
      - name: completeness
        weight: 0.25
        threshold: 8
        description: "All acceptance criteria met? Edge cases handled?"
```

### Disposition System

A new `disposition` field on agent roles that shapes the system prompt:

| Disposition | Behavior |
|------------|----------|
| `neutral` (default) | Standard agent behavior |
| `skeptical` | Assumes work has bugs until proven otherwise. Actively looks for failures. Penalizes "it looks fine" assessments. |
| `creative` | Encouraged to take aesthetic risks, explore unconventional approaches |
| `conservative` | Prefers proven patterns, minimizes risk, flags uncertainty |

The `skeptical` disposition is key for evaluators. From Anthropic's findings: "tuning a standalone evaluator to be skeptical turns out to be far more tractable than making a generator critical of its own work."

## Sprint Execution Protocol

### Handoff Artifacts

Between context resets, structured markdown artifacts carry state:

```markdown
# Sprint Handoff: Feature X

## Status: COMPLETE | FAILED | IN_PROGRESS
## Attempt: 2/3

## What was built
- [concrete list of changes]

## What was tested
- [evaluator's test results]

## Failing criteria
- functionality: 5/10 — Login flow breaks on mobile Safari
- design_quality: 4/10 — Button styles inconsistent with design system

## Files changed
- src/routes/login.tsx (new)
- src/components/auth-form.tsx (modified)

## Next steps for retry
1. Fix mobile Safari viewport issue
2. Use Button component from design system
```

### Context Reset vs. Compaction

| Approach | When to use |
|----------|-------------|
| **Context reset** (spawn fresh agent) | Sonnet, Kimi, or any model showing context anxiety. Between sprints. After evaluator feedback. |
| **Compaction** (summarize in-place) | Opus 4.5 only. Within a single sprint when context grows but work is continuous. |

OpenSpawn should detect the model and automatically choose the strategy.

## Grading Criteria Templates

### Full-Stack Application

| Criterion | Weight | Threshold | What it measures |
|-----------|--------|-----------|-----------------|
| Functionality | 30% | 7/10 | Can users complete all core flows? API endpoints work? |
| Design Quality | 25% | 6/10 | Visual cohesion, not generic AI slop |
| Code Quality | 20% | 7/10 | Clean, maintainable, no dead code |
| Completeness | 25% | 8/10 | All acceptance criteria met |

### Frontend Design

| Criterion | Weight | Threshold | What it measures |
|-----------|--------|-----------|-----------------|
| Design Quality | 35% | 7/10 | Coherent mood and identity |
| Originality | 30% | 6/10 | Not template defaults or "AI patterns" |
| Craft | 20% | 7/10 | Typography, spacing, color harmony |
| Functionality | 15% | 8/10 | Usable without guessing |

### API / Backend

| Criterion | Weight | Threshold | What it measures |
|-----------|--------|-----------|-----------------|
| Correctness | 35% | 8/10 | All endpoints return expected results |
| Error Handling | 25% | 7/10 | Edge cases, validation, meaningful errors |
| Performance | 20% | 6/10 | No N+1 queries, reasonable response times |
| Security | 20% | 8/10 | Auth, input validation, no injection |

## Template ORG.md

```markdown
# ORG.md — Sprint Development Team

## Culture
Ship one feature at a time. Evaluate before moving on.
Quality over speed. If the evaluator rejects, fix it.

## Roles

### Product Manager (L8)
- Type: planner
- Responsibility: Decompose user requests into sprint specs
- Output: spec.md with prioritized feature list

### Developer (L6)  
- Type: generator
- Responsibility: Implement one sprint at a time
- Output: Working code on a feature branch
- Rules: Do NOT self-merge. Wait for QA.

### QA Engineer (L7)
- Type: qa
- Disposition: skeptical
- Tools: playwright, git, terminal
- Responsibility: Navigate the live app, grade each sprint
- Rules: Always test in browser. Screenshots required.
  Never approve without running the app.
  Reject if ANY criterion is below threshold.

## Workflow
1. PM creates spec.md from user request
2. Developer picks first sprint, implements on branch
3. QA evaluates the live app
4. If pass: merge, next sprint
5. If fail: Developer gets feedback, retries (max 3)
6. If stuck: Escalate to human
```

## Implementation Plan

### Phase 1: Evaluator Role in Sandbox (MVP)
- Add `qa` role type to org parser
- Add `disposition` field to role config
- Wire Playwright into QA agent toolset
- Implement grading criteria in agent prompt
- Sprint handoff artifact format

### Phase 2: Automated Sprint Loop
- Planner agent auto-generates spec.md from brief prompts
- Generator works one sprint at a time with context resets
- Evaluator auto-triggered after each sprint
- Pass/fail/retry logic with max attempts
- Escalation to human on persistent failures

### Phase 3: Criteria Templates
- Ship pre-built criteria for common project types
- Allow custom criteria in ORG.md
- Score history tracking in team dashboard
- Trend visualization (are sprints improving over time?)

## Open Questions

1. **Should the evaluator use the same model as the generator?** Anthropic used the same model (Claude) for both. Using a different model for evaluation could reduce "model sympathy" but adds complexity.

2. **How granular should sprints be?** Too small = overhead from context resets. Too large = agents go off-rails. Anthropic's approach of "one feature at a time" seems right.

3. **Should we support evaluator-evaluator chains?** (An evaluator that checks if the first evaluator was too lenient.) Probably overkill for v1.

4. **Screenshot-based vs. DOM-based evaluation?** Playwright gives both. Screenshots catch visual issues; DOM inspection catches structural ones. Probably need both.

---

*This design doc is a living document. Update as we prototype and learn.*
