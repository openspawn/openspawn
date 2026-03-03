---
source: https://openspawn.ai/docs/openclaw-quickstart
generated: 2026-03-03
---

# OpenSpawn for OpenClaw Agents

## What you have

```
"agents": {
"list": [
{ "id": "sandy", "workspace": "~/.openclaw/workspace-sandy", "model": "anthropic/claude-opus-4-6" },
{ "id": "spongebob", "workspace": "~/.openclaw/workspace-spongebob" },
{ "id": "squidward", "workspace": "~/.openclaw/workspace-squidward" }
]
},
"bindings": [
{ "agentId": "sandy", "match": { "channel": "telegram" } },
{ "agentId": "spongebob", "match": { "channel": "whatsapp" } }
],
"tools": {
"agentToAgent": { "enabled": true, "allow": ["sandy", "spongebob", "squidward"] }
```

## What OpenSpawn adds

You have agents. Give them an organization. 5-minute guide. 🦞 Already running OpenClaw with multiple agents? This guide shows you how to add organizational structure without changing your existing setup. A typical OpenClaw multi-agent setup — isolated agents that can message each other: This gives you isolated agents that can message each other. But they don't know who's in charge, what team they're on, or how to coordinate.

```
> Mission: Ship fast, stay weird, protect the reef.
## Culture: startup
## Structure
### 🔬 Science Division
- **Sandy Cheeks** (L9, lead) — Research & architecture
- Patrick Star (L5) — Testing & QA
- Gary (L3) — Data collection
### 🍔 Operations
- **SpongeBob** (L7, lead) — Day-to-day ops
- Squidward (L5) — Code quality & reviews
- Larry (L4) — DevOps & infrastructure
## Policies
- L7+ agents use event-driven communication (wake on escalation)
- L1-6 agents poll for tasks (cost-efficient)
- All code changes require peer review before merge
```

## Step by step

### 1. Add ORG.md to each agent's workspace

```
cp ORG.md ~/.openclaw/workspace-sandy/
cp ORG.md ~/.openclaw/workspace-spongebob/
```

### 2. Tell agents to read ORG.md

ORG.md defines the structure that sits on top of your OpenClaw agents. Same agents, now with context about their role, team, hierarchy, and policies.

```
Read \`ORG.md\` at the start of every session. It defines:
- Your role and level in the org
- Your team and who you report to
- Org-wide policies that apply to your work
- Communication protocols (escalation, delegation)
```

### 3. Launch the OpenSpawn dashboard (optional)

## What changes for your agents

## Going further

Add to each agent's AGENTS.md: The dashboard gives you real-time visibility into your agent org — network graph, task flow, credit usage, escalation chains. OpenSpawn doesn't replace OpenClaw — it extends it. OpenClaw handles routing, isolation, and communication. OpenSpawn adds the organizational layer that makes multi-agent coordination actually work.
