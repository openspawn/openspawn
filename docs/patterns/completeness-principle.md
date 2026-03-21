# The Completeness Principle

> "Always recommend the complete option. The marginal cost of completeness is near-zero with AI assistance."

*Adapted from [gstack](https://github.com/garrytan/gstack)'s "Boil the Lake" principle (MIT license), reframed for multi-agent organizations.*

---

## The Core Insight

AI-assisted development has compressed the cost of "doing the complete thing" to near-zero. The last 10% of completeness — full test coverage, every edge case, complete error handling — used to be expensive enough to justify cutting corners. It isn't anymore.

In a multi-agent org, this principle is even more powerful: agents don't get tired, don't cut corners out of laziness, and can be instructed to always choose completeness by default.

## The Compression Table

| Task type | Human team | AI-assisted | Compression |
|-----------|-----------|-------------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

This table changes the calculus for every build-vs-skip decision. When the delta between "good enough" and "complete" is measured in minutes, always choose complete.

## Lake vs. Ocean

Not everything should be completed to 100%. The distinction:

- **A lake is boilable** — 100% test coverage for a module, full feature implementation, all edge cases handled, complete error paths. These are finite, bounded tasks. Boil them.
- **An ocean is not** — rewriting an entire system from scratch, multi-quarter platform migrations, adding features to dependencies you don't control. Flag these as out of scope.

The skill is knowing the difference.

## For Multi-Agent Organizations

In an OpenSpawn org, the completeness principle applies at every level:

### Agent-Level
When an agent presents options to a human or supervisor agent, it should:
- Always recommend the complete implementation
- Show both time estimates: human-team time and AI-assisted time
- Flag when a "shortcut" option exists but completeness costs minimal extra effort

### Org-Level
When designing agent workflows:
- Don't skip review steps to "save tokens" — reviews catch real issues
- Don't defer testing to "later" — test agents are cheap to run
- Don't settle for 80% automation — the last 20% is where the value compounds

### Decision Framework
When evaluating "approach A (complete, ~150 LOC) vs approach B (90% coverage, ~80 LOC)":
1. Is approach A a lake? (bounded, achievable) → Choose A
2. Is approach A an ocean? (unbounded, multi-quarter) → Flag as out of scope, choose B for now
3. When in doubt, choose complete

## Anti-Patterns

- ❌ "Choose B — it covers 90% of the value with less code." (If A is only 70 lines more, choose A.)
- ❌ "We can skip edge case handling to save time." (Edge case handling costs minutes with AI.)
- ❌ "Let's defer test coverage to a follow-up PR." (Tests are the cheapest lake to boil.)
- ❌ Quoting only human-team effort: "This would take 2 weeks." (Say: "2 weeks human / ~1 hour AI-assisted.")

## How to Add to Your ORG.md

```yaml
culture:
  completeness_principle: "Always recommend the complete option. The marginal cost of completeness is near-zero with AI assistance."
```

This injects the principle into every agent's decision-making. When agents present options, they will default to recommending completeness.

---

*Based on the "Boil the Lake" essay by Garry Tan. Original source: [gstack](https://github.com/garrytan/gstack) (MIT License).*
