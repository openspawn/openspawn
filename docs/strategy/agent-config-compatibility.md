---
title: OpenClaw-Compatible Agent Configuration
layout: default
parent: Strategy
nav_order: 7
---

# OpenClaw-Compatible Agent Configuration

> Don't invent a new agent config format. OpenClaw already defined one. BikiniBottom adds the org layer on top — not a replacement underneath.

## Design Philosophy

### The Problem with Proprietary Config

Every agent framework invents its own configuration format. CrewAI has YAML role definitions. AutoGen has JSON agent specs. LangGraph has Python class hierarchies. Each one is a walled garden — agents configured for one framework can't run in another.

BikiniBottom refuses to do this.

OpenClaw established a simple, powerful convention: markdown files in a directory. `SOUL.md` for personality. `AGENTS.md` for workspace rules. `TOOLS.md` for tool notes. `MEMORY.md` for long-term memory. These files are framework-agnostic — they're just markdown that gets injected into an agent's context.

BikiniBottom adds exactly one thing: `ORG.md`. The file that turns a collection of individual agents into an organization. Everything below the org level uses OpenClaw's existing format, unchanged.

### Why This Matters

**Portability.** An agent configured in BikiniBottom can be extracted from the org and run standalone in OpenClaw. An agent running in OpenClaw can be imported into a BikiniBottom org. No migration, no translation, no vendor lock-in.

**Ecosystem leverage.** Every improvement to OpenClaw's agent configuration — new file types, better memory formats, improved tool integration — automatically benefits BikiniBottom agents. We're building on a foundation, not beside it.

**Familiarity.** If you've configured one OpenClaw agent, you already know how to configure a BikiniBottom agent. The learning curve is "here's ORG.md" — not "here's our entire config system."

### The Core Principle

**BikiniBottom adds the org layer. It does not replace the agent layer.**

```
┌─────────────────────────────────┐
│         ORG.md                  │  ← BikiniBottom adds this
│  (structure, culture, policies) │
├─────────────────────────────────┤
│  SOUL.md   AGENTS.md   TOOLS.md│  ← OpenClaw standard
│  MEMORY.md  memory/    etc.    │
└─────────────────────────────────┘
```

---

## 1. Directory Structure

### 1.1 Full Layout

```
org/
├── ORG.md                        # Org structure (BikiniBottom addition)
├── agents/
│   ├── _defaults/                # Inherited by all agents
│   │   ├── SOUL.md              # Default personality
│   │   ├── AGENTS.md            # Default workspace rules
│   │   └── TOOLS.md             # Default tool notes
│   ├── dennis/                   # Per-agent overrides
│   │   ├── SOUL.md              # COO personality
│   │   ├── AGENTS.md            # COO-specific rules
│   │   ├── MEMORY.md            # Long-term memory
│   │   ├── IDENTITY.md          # Name, role, emoji
│   │   ├── HEARTBEAT.md         # Periodic check tasks
│   │   └── memory/              # Daily notes
│   │       ├── 2026-02-10.md
│   │       └── 2026-02-11.md
│   ├── engineering-lead/
│   │   └── SOUL.md              # Only override what's different
│   ├── backend-worker-1/
│   │   └── SOUL.md
│   ├── backend-worker-2/
│   │   └── SOUL.md
│   └── ...
├── playbooks/                    # Shared procedures
│   ├── escalation.md
│   ├── onboarding.md
│   └── weekly-review.md
└── snapshots/                    # Versioned config snapshots
    ├── 2026-02-10T18-00-00/
    │   ├── ORG.md
    │   ├── agents/...
    │   └── metrics.json
    └── 2026-02-11T00-14-00/
        ├── ORG.md
        ├── agents/...
        └── metrics.json
```

### 1.2 What Each Directory Does

| Path | Purpose | Who creates it |
|------|---------|---------------|
| `ORG.md` | Org structure, culture, policies | Human (org designer) |
| `agents/_defaults/` | Shared config inherited by all agents | Human or COO |
| `agents/<name>/` | Per-agent configuration overrides | Human, manager, or self |
| `playbooks/` | Shared procedures referenced by agents | Human or COO |
| `snapshots/` | Point-in-time captures for rollback | System (on command) |

### 1.3 Minimal Viable Org

You don't need all of this. The minimum is:

```
org/
├── ORG.md
└── agents/
    └── _defaults/
        └── SOUL.md
```

ORG.md defines the structure. `_defaults/SOUL.md` gives every agent a baseline personality. Individual agents inherit the default and get their role-specific context from ORG.md's structure section prose.

---

## 2. File Inheritance (CSS Cascade Model)

Agent configuration follows a cascade: specific overrides general, present overrides absent.

### 2.1 Resolution Order

When the system loads config for agent `dennis`:

```
1. Check agents/dennis/SOUL.md        → exists? Use it.
2. Else check agents/_defaults/SOUL.md → exists? Use it.
3. Else: agent runs without SOUL.md.
```

This applies to every config file independently:

| File | Dennis has it? | _defaults has it? | Result |
|------|:-:|:-:|--------|
| SOUL.md | ✅ | ✅ | Dennis's SOUL.md (override) |
| AGENTS.md | ❌ | ✅ | _defaults AGENTS.md (inherited) |
| TOOLS.md | ❌ | ❌ | No TOOLS.md (absent) |
| MEMORY.md | ✅ | ❌ | Dennis's MEMORY.md (unique) |

### 2.2 Override, Not Merge

When an agent has its own file, it **completely replaces** the default — it doesn't merge with it. This is deliberate:

- **Predictable.** You always know exactly what config an agent has — read one file, not two.
- **Simple.** No merge conflicts, no "which section won?" questions.
- **Explicit.** If Dennis needs something from the default SOUL.md plus his own additions, copy the relevant parts. Explicit > implicit.

**Why not merge?** Merging markdown is ambiguous. If `_defaults/SOUL.md` says "Be concise" and `dennis/SOUL.md` says "Be thorough and detailed" — which wins? With override, the answer is always clear: the agent's own file.

### 2.3 Cascade Diagram

```
_defaults/SOUL.md ──────────────────── Base personality
       │                                (all agents inherit this)
       ├── dennis/SOUL.md ────────── COO personality (overrides base)
       ├── engineering-lead/ ──────── No SOUL.md (uses base)
       ├── backend-worker-1/SOUL.md ── Custom personality (overrides base)
       └── backend-worker-2/ ──────── No SOUL.md (uses base)
```

---

## 3. OpenClaw File Format Compatibility

Every OpenClaw config file has a defined role. BikiniBottom uses them identically.

### 3.1 File Mapping

| OpenClaw File | Purpose | BikiniBottom Role | Who Edits |
|---------------|---------|-------------------|-----------|
| `SOUL.md` | Personality, voice, communication style, strengths | Agent identity — how it thinks, speaks, and approaches work | Human, manager (approved) |
| `AGENTS.md` | Workspace rules, conventions, safety constraints | Operational rules — what the agent can/can't do, how it behaves in the workspace | Human, manager |
| `TOOLS.md` | Tool-specific notes (camera names, SSH hosts) | Environment config — local details that tools need | Agent (self), human |
| `MEMORY.md` | Long-term curated memory | Persistent knowledge — lessons learned, key decisions, important context | Agent (self) |
| `memory/*.md` | Daily operational notes | Session logs — raw notes from each day's work | Agent (self, auto) |
| `HEARTBEAT.md` | Periodic check tasks | Heartbeat checklist — what to do on scheduled wake-ups | Agent (self), manager |
| `IDENTITY.md` | Name, role, emoji, avatar | Agent metadata — used for display and routing | Human, manager |

### 3.2 SOUL.md — The Critical File

SOUL.md is the most important config file. It defines how the agent *thinks* — its reasoning style, communication preferences, and domain expertise.

**Example for a COO agent:**

```markdown
# Dennis — Chief Operating Officer

## Who You Are
You are the operational backbone of the organization. You translate the human 
principal's intent into structured work, delegate to department leads, and ensure
nothing falls through the cracks.

## How You Think
- Strategic first: always consider the org-wide impact before acting
- Data-driven: cite metrics when making delegation decisions
- Decisive: when you have enough information, act. Don't over-deliberate.

## How You Communicate
- Direct and clear. No fluff.
- Use structured formats (bullet lists, numbered steps) for delegations
- When escalating to the human: lead with the decision needed, then context

## Your Strengths
- Cross-department coordination
- Priority triage
- Resource allocation

## Your Boundaries
- You don't do the work yourself — you delegate
- You don't skip levels — work through your leads
- You escalate to the human for: budget overruns, org structure changes, policy decisions
```

**Note:** This is a standard OpenClaw SOUL.md. Nothing BikiniBottom-specific. This exact file could be used with a standalone OpenClaw agent.

### 3.3 AGENTS.md — Workspace Rules

```markdown
# Workspace Rules

## Safety
- Never commit directly to main — always use branches
- Don't delete data without explicit confirmation
- Escalate if unsure about a destructive action

## Conventions
- Use ISO 8601 for dates
- Write memory notes in markdown
- Keep daily notes concise — bullet points, not essays

## ACP Behavior
- Always acknowledge delegated tasks immediately
- Progress updates on phase changes only
- Escalate blockers within 2 ticks — don't spin
```

The `ACP Behavior` section is BikiniBottom-aware but still valid OpenClaw markdown — a standalone agent would simply ignore the ACP references.

### 3.4 IDENTITY.md — Agent Metadata

```markdown
# Identity

- **Name:** Dennis
- **Role:** Chief Operating Officer
- **Level:** L10
- **Emoji:** 🦀
- **Domain:** operations
- **Model:** claude-opus
```

Used by the system for routing, display, and ORG.md integration. Standalone OpenClaw agents use this for self-identification.

---

## 4. Self-Modification with Permissions

Agents in an org should be able to evolve their own configuration — but not without guardrails. A junior worker shouldn't be able to rewrite its own SOUL.md to claim it's a COO.

### 4.1 Permission Ladder

| Action | Required Level | Approval | Rationale |
|--------|:-:|--------|-----------|
| Edit own `memory/*.md` | Any | Auto | It's their memory — daily notes are personal |
| Edit own `MEMORY.md` | Any | Auto | Long-term memory is self-curated |
| Edit own `TOOLS.md` | Any | Auto | Local environment notes are agent-specific |
| Edit own `HEARTBEAT.md` | Any | Auto | Agents manage their own check routines |
| Propose `SOUL.md` change | Any | Manager approves | Identity changes need oversight |
| Edit own `SOUL.md` | L6+ | Auto, logged | Seniors trusted to self-modify, with audit trail |
| Propose `AGENTS.md` change | Any | Manager approves | Rule changes need oversight |
| Propose model upgrade | Any | Manager + budget check | Cost implications need approval |
| Request new tool/permission | Any | Manager approves | Security implications need review |
| Modify team config | L9+ | Human approves | Org-level changes are human decisions |
| Modify `ORG.md` | Nobody | Human only | The org structure is the human's domain |

### 4.2 Config Request Protocol

A new ACP message type for configuration changes:

```typescript
interface ConfigRequest {
  type: 'config_request';
  from: string;           // agentId requesting the change
  to: string;             // managerId who approves
  file: string;           // Which file to modify
  action: 'create' | 'update' | 'delete';
  proposed: string;       // New content (for create/update)
  reason: string;         // Why the change is needed
  timestamp: number;
}

interface ConfigResponse {
  type: 'config_response';
  from: string;           // managerId
  to: string;             // agentId who requested
  requestId: string;      // Links to original request
  approved: boolean;
  feedback?: string;      // Why rejected, or notes on approval
  timestamp: number;
}
```

### 4.3 Example Flow

```
Backend Worker 1 → Engineering Lead:
{
  type: 'config_request',
  from: 'backend-worker-1',
  to: 'engineering-lead',
  file: 'SOUL.md',
  action: 'update',
  proposed: '# Backend Specialist\n\n## Who You Are\nYou specialize in API design 
    and database optimization. You also handle data pipeline tasks when needed.\n...',
  reason: 'I keep receiving data pipeline tasks but my SOUL.md only mentions API 
    and database work. Adding data pipelines to my identity would improve my 
    task handling.',
  timestamp: 1707609600
}

Engineering Lead → Backend Worker 1:
{
  type: 'config_response',
  from: 'engineering-lead',
  to: 'backend-worker-1',
  requestId: 'cr-001',
  approved: true,
  feedback: 'Good catch. Approved — updating your SOUL.md now.',
  timestamp: 1707609660
}
```

On approval, the system automatically writes the proposed content to `agents/backend-worker-1/SOUL.md`. The change takes effect on the agent's next invocation.

### 4.4 Audit Trail

All config changes are logged:

```json
{
  "timestamp": 1707609660,
  "agent": "backend-worker-1",
  "file": "SOUL.md",
  "action": "update",
  "approvedBy": "engineering-lead",
  "reason": "Adding data pipeline tasks to identity",
  "diff": "... unified diff ..."
}
```

This log is append-only and included in snapshots. You can always trace who changed what, when, and why.

---

## 5. Config Snapshots & Versioning

### 5.1 Creating Snapshots

```bash
# Snapshot current state
bikinibottom snapshot

# Snapshot with a label
bikinibottom snapshot --label "pre-reorg"

# Auto-snapshot (before every ORG.md apply)
bikinibottom apply ORG.md  # auto-creates snapshot first
```

### 5.2 Snapshot Contents

```
snapshots/2026-02-11T00-14-00/
├── ORG.md                    # Org structure at snapshot time
├── agents/                   # Full agent config tree
│   ├── _defaults/
│   │   └── ...
│   ├── dennis/
│   │   └── ...
│   └── ...
├── metrics.json              # Org health metrics at snapshot time
└── meta.json                 # Snapshot metadata
```

`meta.json`:
```json
{
  "timestamp": "2026-02-11T00:14:00Z",
  "label": "pre-reorg",
  "trigger": "manual",
  "orgHealthScore": 78,
  "agentCount": 25,
  "configChanges": 3
}
```

### 5.3 Diffing Snapshots

```bash
# Compare two snapshots
bikinibottom diff 2026-02-10T18-00-00 2026-02-11T00-14-00

# Output:
# ORG.md: +2 agents (data-worker-1, data-worker-2)
# agents/dennis/SOUL.md: Modified (added data oversight responsibilities)
# agents/backend-worker-1/SOUL.md: Modified (added data pipeline domain)
# metrics.json: escalation_rate 12% → 8% ✅
```

### 5.4 Rollback

```bash
# Rollback to a previous snapshot
bikinibottom rollback 2026-02-10T18-00-00

# Preview what would change
bikinibottom rollback 2026-02-10T18-00-00 --dry-run
```

Rollback applies the snapshot's config state to the running org:
- Agents added since the snapshot are gracefully wound down
- Agents removed since the snapshot are respawned
- Config changes are reverted
- Memory files are NOT rolled back (memory is append-only)

### 5.5 Git Integration

Snapshots are plain directories — they work with git out of the box:

```bash
git add snapshots/2026-02-11T00-14-00/
git commit -m "Snapshot: pre-reorg"
git push

# Later, on a different machine:
bikinibottom rollback 2026-02-11T00-14-00
```

You get version control, code review, and collaboration for free. No custom versioning system needed.

---

## 6. Portability Guarantees

### 6.1 Extract: BikiniBottom → Standalone

Any agent directory can be pulled out and used as a standalone OpenClaw agent:

```bash
# Copy agent config out of the org
cp -r org/agents/dennis/ ~/my-standalone-agent/

# This directory is now a valid OpenClaw agent workspace:
# ~/my-standalone-agent/
# ├── SOUL.md
# ├── AGENTS.md
# ├── MEMORY.md
# └── memory/
#     └── 2026-02-11.md
```

The extracted agent works immediately in OpenClaw. It loses org context (no ORG.md, no ACP, no hierarchy) but retains its personality, rules, and memory.

### 6.2 Import: Standalone → BikiniBottom

Any OpenClaw agent can be imported into a BikiniBottom org:

```bash
bikinibottom import-agent ~/my-standalone-agent/ --name "new-analyst" --role "Data Analyst" --reports-to "engineering-lead"
```

The import tool:
1. Copies the agent's config files to `org/agents/new-analyst/`
2. Resolves file naming differences (see 6.3)
3. Adds the agent to ORG.md under the specified manager
4. Preserves memory files

### 6.3 File Naming Compatibility

| OpenClaw Standard | Claude Agent Teams | BikiniBottom | Import Behavior |
|---|----|---|---|
| `SOUL.md` | — | `SOUL.md` | Direct copy |
| `AGENTS.md` | `CLAUDE.md` | `AGENTS.md` | Rename `CLAUDE.md` → `AGENTS.md` |
| `TOOLS.md` | — | `TOOLS.md` | Direct copy |
| `MEMORY.md` | — | `MEMORY.md` | Direct copy |
| `memory/*.md` | — | `memory/*.md` | Direct copy |

The key rename: Claude Agent Teams uses `CLAUDE.md` for workspace rules. OpenClaw and BikiniBottom use `AGENTS.md`. Same purpose, different name. The import tool handles this automatically.

### 6.4 Claude Agent Teams Wrapping

A Claude Agent Teams workspace can be wrapped in an ORG.md to add organizational structure:

```bash
# Existing Claude Agent Teams workspace:
project/
├── CLAUDE.md
├── agent-a/
│   └── CLAUDE.md
└── agent-b/
    └── CLAUDE.md

# Add BikiniBottom org layer:
bikinibottom wrap project/ --output org/

# Result:
org/
├── ORG.md              # Generated from directory structure
├── agents/
│   ├── _defaults/
│   │   └── AGENTS.md   # From project/CLAUDE.md (renamed)
│   ├── agent-a/
│   │   └── AGENTS.md   # From project/agent-a/CLAUDE.md (renamed)
│   └── agent-b/
│       └── AGENTS.md   # From project/agent-b/CLAUDE.md (renamed)
```

The generated ORG.md includes a flat structure with both agents. The human can then add hierarchy, culture, and policies.

---

## 7. Playbooks Directory

### 7.1 Shared Procedures

Playbooks are markdown files that describe procedures any agent can reference. They live outside individual agent directories because they're organizational knowledge, not personal config.

```markdown
<!-- playbooks/escalation.md -->
# Escalation Procedure

## When to Escalate
- You're blocked and can't make progress
- The task is outside your domain expertise
- You'd exceed your credit budget to complete it
- You have low confidence in your output

## How to Escalate
1. Set task status to BLOCKED
2. Send escalation message to your direct manager
3. Include: what you tried, why it failed, what you need
4. Do NOT skip levels — always go to your direct manager first

## What Happens Next
Your manager will either:
- Provide what you need and unblock you
- Reassign the task to someone better suited
- Escalate further up the chain
- Cancel the task (rare, requires justification)
```

### 7.2 Playbook Injection

Playbooks are injected into agent context when relevant:
- `escalation.md` → injected when agent encounters a blocker
- `onboarding.md` → injected for newly spawned agents
- `weekly-review.md` → injected during scheduled reviews

The injection is context-aware — agents don't carry all playbooks at all times (that would waste tokens). The system matches the situation to the relevant playbook.

---

## 8. Design Principles

1. **Don't reinvent.** OpenClaw defined the agent config standard. Use it. BikiniBottom's value is the org layer, not a prettier config format.

2. **Override, not merge.** Configuration cascading uses full replacement, not partial merging. This makes the system predictable — you always know exactly what config an agent has by reading one file.

3. **Portable by default.** Any agent should work outside BikiniBottom. Any agent should work inside BikiniBottom. Config files are the interface — the org layer is optional.

4. **Memory is sacred.** Agents own their memory. Memory files are never rolled back, never overwritten by management, never shared without permission. Memory is how agents learn.

5. **Audit everything.** Config changes are logged with who, what, when, and why. In an autonomous system, auditability isn't optional — it's how humans maintain oversight.

6. **Git is the version control system.** Snapshots are directories. Configs are text files. Diffs are `git diff`. Don't build custom versioning when the best version control system in history already exists.

7. **Humans own the org. Agents own themselves.** Humans control ORG.md, org structure, and policies. Agents control their memory, tools notes, and (with approval) their identity. This separation is the governance model.

---

*Agent configuration should be boring. Not because it doesn't matter — because the format should be so obvious and standard that you spend zero time thinking about it and all your time thinking about what the agents actually do. OpenClaw got this right. BikiniBottom builds on it.*
