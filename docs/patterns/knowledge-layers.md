# The Three Knowledge Layers

> Search before building. Prize first-principles reasoning above all.

*Adapted from [gstack](https://github.com/garrytan/gstack)'s "Search Before Building" principle (MIT license), extended for multi-agent decision-making.*

---

## Overview

Every decision an agent makes draws from one of three knowledge layers. Understanding which layer you're operating in determines how much to trust your reasoning — and when to search, question, or invent.

## The Three Layers

### Layer 1: Tried and True (In-Distribution)

Standard patterns, battle-tested approaches, things that have been done a thousand times before. You probably already know these.

**Risk:** Not that you don't know — it's that you assume the obvious answer is right when occasionally it isn't. The cost of checking is near-zero.

**Agent instruction:** "Use established patterns. Don't reinvent the wheel. But verify — sometimes the tried-and-true is wrong."

### Layer 2: New and Popular (Search-Required)

Current best practices, recent blog posts, ecosystem trends, new libraries. These require active search.

**Risk:** Humans are subject to mania. The crowd can be wrong about new things just as easily as old things. Search results are *inputs to your thinking*, not answers.

**Agent instruction:** "Search for current approaches. But scrutinize what you find — popularity ≠ correctness."

### Layer 3: First Principles (Prize Above All)

Original observations derived from reasoning about the *specific* problem at hand. These are the most valuable of all. The best projects both avoid mistakes (don't reinvent the wheel — Layer 1) while also making brilliant observations that are out of distribution.

**Agent instruction:** "When you reason from first principles and arrive at something novel, name it. Celebrate it. These are the breakthroughs."

## The Eureka Moment

The most valuable outcome of researching a problem is not finding a solution to copy. It is:

1. Understanding what everyone is doing and **why** (Layers 1 + 2)
2. Applying first-principles reasoning to their assumptions (Layer 3)
3. Discovering a clear reason why the conventional approach is **wrong**

This is the 11 out of 10. When you find one:

```
EUREKA: Everyone does X because [assumption].
But [evidence] shows this is wrong.
Y is better because [reasoning].
```

### Eureka in Multi-Agent Orgs

In an OpenSpawn org, eureka moments should be:
- **Logged** as a special memory type for future reference
- **Shared** across agents so the entire org benefits from the insight
- **Challenged** — another agent should review the eureka claim to prevent false positives

## Decision Matrix for Agents

| Situation | Layer | Action |
|-----------|-------|--------|
| Standard CRUD endpoint | 1 (Tried and true) | Use the pattern. Don't overthink it. |
| New auth library vs. established one | 2 (New and popular) | Search, compare, scrutinize hype. |
| "Why does everyone use polling here?" | 3 (First principles) | Reason about it. Maybe SSE is better for this case. |
| You realize the standard approach has a flaw | 3 → Eureka | Name it. Log it. Share it. |

## How to Add to Your ORG.md

```yaml
culture:
  knowledge_layers:
    - "Layer 1: Tried and true (don't reinvent)"
    - "Layer 2: New and popular (search, but scrutinize)"
    - "Layer 3: First principles (prize above all)"
```

## For Research Agents

Research agents should explicitly categorize their findings:

```markdown
## Research: [Topic]

### Layer 1 (Established)
- Standard approach is X (used by Y, Z)
- Known tradeoffs: ...

### Layer 2 (Current Trends)
- New library A is gaining traction (searched: [sources])
- Scrutiny: claims of 10x performance are unverified

### Layer 3 (First Principles)
- Given our specific constraints, neither approach fits because...
- EUREKA: [insight if applicable]

### Recommendation
Use [approach] because [reasoning from appropriate layer]
```

---

*Based on the "Three Layers of Knowledge" framework from [gstack](https://github.com/garrytan/gstack) (MIT License).*
