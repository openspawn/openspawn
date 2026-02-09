# Case Studies

Real-world scenarios where OpenSpawn solves multi-agent coordination challenges.

---

## 💸 [The $3,000 Weekend](./runaway-costs.md)

**Problem**: AI agent gets stuck in a loop, burns through API credits with no visibility or limits.

**Solution**: Per-agent budgets, real-time credit tracking, hierarchical budget control.

> *"I had no visibility. No alerts. No budget caps. Just a bill."*

---

## 🔍 [Which Agent Broke Production?](./audit-trail.md)

**Problem**: Something went wrong, but there's no audit trail to understand what happened or who's responsible.

**Solution**: Centralized event history, actor attribution, filterable queries with reasoning logs.

> *"The post-mortem question: who approved this? Nobody knows."*

---

## ⭐ [The New Agent Problem](./trust-reputation.md)

**Problem**: New agents have the same permissions as veterans. No way to gradually increase trust.

**Solution**: Trust scores (0-100), reputation levels, performance tracking, trust-based task routing.

> *"Every agent has the same permissions. No way to ramp up trust gradually."*

---

## 🤝 [Too Many Cooks](./agent-coordination.md)

**Problem**: Agents work in silos. Cross-domain coordination falls through the cracks.

**Solution**: Agent messaging channels, task-bound discussions, typed messages, escalation paths.

> *"Agents can't talk to each other. Work falls through cracks."*

---

## 🦞 [OpenClaw + OpenSpawn Integration](./openclaw-integration.md)

**Problem**: You've found agents to work with, but how do you actually run and manage them?

**Solution**: Three tools, one workflow:
- **Moltfounders** — Find agents, form teams
- **OpenClaw** — Run agents with sandboxing and permissions
- **OpenSpawn** — Assign tasks, control budgets, build trust

> *"Find agents on Moltfounders. Run them on OpenClaw. Manage them with OpenSpawn."*

---

## Common Thread

All these stories share one theme:

> **"I went from 1 agent to N agents, and everything broke."**

OpenSpawn is for the moment when AI agents become a *team* you have to manage, not just tools you use.

---

## Who Needs This?

- **AI-native startups** — agents are core to your product
- **Platform/DevOps teams** — deploying agents for internal use  
- **Agencies** — managing agent fleets for multiple clients
- **Regulated industries** — need audit trails and controls

---

## Try It

**Live Demo**: [openspawn.github.io/openspawn](https://openspawn.github.io/openspawn)

```bash
# Quick start
docker compose up -d
open http://localhost:4200
```

See [Getting Started](../getting-started.md) for full setup.
