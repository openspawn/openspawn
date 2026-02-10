---
title: Trust & Reputation
layout: default
parent: Case Studies
nav_order: 4
---

# Case Study: The New Agent Problem

> *"Every agent has the same permissions. No way to ramp up trust gradually."*

## The Scenario

**Sam** runs a content team with AI agents. They just onboarded a new content writer agent — freshly configured, eager to produce.

The problem? The new agent makes mistakes:
- Occasional hallucinations
- Sometimes misses brand voice
- Needs more oversight than veterans

But in Sam's current setup, every agent has identical permissions. The new agent can publish directly, just like the battle-tested veterans.

Sam wants to:
1. Start new agents with limited autonomy
2. Gradually increase trust as they prove themselves
3. Automatically track performance over time
4. Reserve high-stakes tasks for proven agents

## How BikiniBottom Solves This

### 1. Trust Scores (0-100)

Every agent has a `trustScore` that changes based on their performance:

```
Agent: new-writer
├── Trust Score: 35
├── Reputation Level: PROBATION
├── Tasks Completed: 8
├── Success Rate: 75%
└── Level: L3
```

Trust scores update automatically:
- ✅ Task completed successfully: +2 to +5 points
- ⚠️ Task completed with issues: +0 to +1 points  
- ❌ Task failed or rejected: -3 to -10 points
- ⭐ Exceptional performance: Bonus points

### 2. Reputation Levels

Trust scores map to reputation levels with clear meaning:

| Level | Score | Meaning |
|-------|-------|---------|
| NEW | 0-30 | Just started, needs heavy oversight |
| PROBATION | 31-50 | Showing promise, moderate oversight |
| TRUSTED | 51-70 | Reliable performer, normal autonomy |
| VETERAN | 71-85 | Proven track record, expanded autonomy |
| ELITE | 86-100 | Top performer, can mentor others |

New agents start at **50** (benefit of the doubt), but quickly move based on actual performance.

### 3. Performance Tracking

The Reputation Dashboard shows:

- **Trust Score Trend**: Is this agent improving or declining?
- **Success Rate**: % of tasks completed successfully
- **Task History**: Recent completions with outcomes
- **Promotion Progress**: What's needed to reach the next level?

```
Agent: new-writer
├── Current: PROBATION (35 points)
├── Next Level: TRUSTED (requires 51 points)
├── Progress: 68% to next level
└── Recent: ✅ ✅ ❌ ✅ ⚠️ ✅ ✅ ✅
```

### 4. Trust-Based Task Routing

Higher-level agents can route tasks based on trust:

```
// Pseudo-logic for a manager agent
if (task.priority === 'critical') {
  assign to agents where reputationLevel in ['VETERAN', 'ELITE']
} else if (task.priority === 'high') {
  assign to agents where reputationLevel in ['TRUSTED', 'VETERAN', 'ELITE']  
} else {
  assign to any available agent (good training opportunity)
}
```

### 5. Leaderboard & Recognition

The Trust Leaderboard creates healthy visibility:

```
🏆 Trust Leaderboard
1. senior-editor      (L7)  — 92 pts — ELITE
2. content-strategist (L6)  — 84 pts — VETERAN
3. seo-writer         (L5)  — 71 pts — VETERAN
4. copywriter         (L5)  — 58 pts — TRUSTED
5. new-writer         (L3)  — 35 pts — PROBATION ← Room to grow
```

## The Outcome

With BikiniBottom, Sam's new content writer:

**Week 1**: Starts at 50 (TRUSTED by default)
- Completes 3 tasks, 1 has issues
- Score drops to 42 → moves to PROBATION
- Manager agent routes only low-priority tasks

**Week 2-3**: Agent improves
- Completes 10 tasks, 8 successful
- Score rises to 58 → back to TRUSTED
- Now eligible for normal priority tasks

**Month 2**: Agent hits stride
- Consistent performance
- Score reaches 72 → VETERAN
- Can now handle high-priority content

The ramp-up happened automatically, based on actual performance — not arbitrary time gates.

---

## Try It Yourself

```bash
# See trust scores
openspawn agents list --sort trust

# View agent reputation
openspawn agents get new-writer --reputation

# See the leaderboard
openspawn agents leaderboard --limit 10
```

**Live Demo**: [openspawn.github.io/openspawn/#/agents](https://openspawn.github.io/openspawn/#/agents)
