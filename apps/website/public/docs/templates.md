---
source: https://openspawn.ai/docs/templates
generated: 2026-03-14
---

# Templates Guide

OpenSpawn ships four org templates. Each produces a complete, ready-to-run

## Which template should I use?

```
What's your primary output?
├── Code / software → dev-shop
├── Content (blogs, social media, docs, marketing) → content-agency
├── Research / analysis / intel → research-lab
├── Mix of everything / solo operator → assistant-team
└── None of these fit → Start with assistant-team, then customize
```

ORG.md with roles, hierarchy, culture, policies, and playbooks.

Q: Can I switch templates later? A: Yes, re-run init or edit

ORG.md directly.

## Comparison table

Q: Can I combine roles from multiple templates? A: Yes, copy agent definitions between Structure sections.

assistant-team

content-agency

dev-shop

research-lab

Best for

Solo operator

Content production

Software teams

Research & analysis

Culture preset

agency

agency

startup

research

Agent count

Hierarchy depth

2 levels

2-3 levels

2 levels

2 levels

Top role

Chief of Staff

Creative Director

Tech Lead

Research Director

Domains

Ops, research, content, engineering, security, quality

Research, strategy, writing, design

Frontend, backend, QA

Analysis, exploration

Escalation

Immediate

Immediate

Immediate

Delayed

Autonomy

Medium

Medium

Medium

## assistant-team

```
openspawn init my-org --template=assistant-team
```

### Roles

High Personal AI team for a solo operator. Chief of staff coordinates specialists.

Domain

Reports to

Operations

Research

Content Strategy

Writing

Visual Design

Engineering

Shield

Security

Quality

```
# ORG.md — assistant-team
## Culture
preset: agency
## Structure
- Oscar L10 Operations
- Radar L7 Research
- Muse L7 Content Strategy
- Ink L4 Writing
- Lens L4 Visual Design
- Forge L7 Engineering
- Shield L7 Security
- Guru L7 Quality
## Policies
escalation: immediate
autonomy: medium
```

When to use: solo person needing a full team, work spans multiple domains, want a single coordinator. Q: What if I don't need security or quality roles? A: Delete them from the Structure section, then validate with

## content-agency

```
openspawn init my-org --template=content-agency
```

### Roles

openspawn validate. Content production pipeline. Research feeds strategy, strategy directs writing and design.

Domain

Reports to

Director

Creative

Researcher

Research

Director

Strategist

Strategy

Director

Writer

Writing

Strategist

Designer

Design

Strategist

Editor

Quality

Director

When to use: primary output is content, want a clear pipeline, quality over speed.

## dev-shop

```
openspawn init my-org --template=dev-shop
```

### Roles

Q: What about SEO? A: Add an SEO agent under Strategist, L4, domain "SEO". Software development team. Tech lead coordinates frontend, backend, QA.

Domain

Engineering

Frontend

Frontend

Backend

Backend

Testing

DevOps

Infrastructure

## research-lab

```
openspawn init my-org --template=research-lab
```

### Roles

Q: What about design? A: Add a Designer agent or combine with assistant-team. Research and analysis team. High autonomy, delayed escalation.

Domain

Director

Research

Analyst

Analysis

Explorer

Exploration

Synthesizer

Synthesis

When to use: exploratory or open-ended work, high autonomy needed, long-running tasks.

## Industry templates

Q: What's the exploration budget? A: Higher per-agent credit limit and delayed escalation allow deeper exploration. 7 industry-specific templates for common operational patterns. Each includes specialized roles, domain-tuned policies, and ready-to-use playbooks.

Template

```
# Incident Response Team
## Identity
- **Industry:** SaaS / Infrastructure
- **Stage:** Production operations
## Culture
preset: military
- **Escalation:** immediate — production incidents can't wait
## Structure
### Incident Commander
Coordinates all agents, owns runbook execution, drives MTTR down.
- **Model:** claude-opus
- **Domain:** incident-management
- **Level:** 8
#### Diagnostics Agent
Reads logs, traces, metrics. Identifies root cause.
- **Model:** claude-sonnet
- **Domain:** observability
#### Remediator
Applies fixes, rolls back deployments, validates recovery.
- **Model:** claude-sonnet
- **Domain:** infrastructure
#### Comms Agent
Posts status updates, notifies stakeholders, writes postmortems.
- **Model:** claude-haiku
- **Domain:** communications
## Policies
- All production changes require Incident Commander approval
- Comms Agent posts update every 5 minutes during active incident
```

## Boot sequence templates

Culture "saas-onboarding", "Onboarding Lead, Data Migration, Integration Engineer, Success Agent", "agency", "incident-response", "Incident Commander, Diagnostics, Remediator, Comms Agent", "military", "contract-review", "Legal Lead, Clause Analyzer, Risk Assessor, Summary Writer", "enterprise", "compliance-monitoring", "Compliance Officer, Auditor, Policy Checker, Report Generator", "enterprise", "game-live-ops", "Live Ops Director, Event Manager, Balance Analyst, QA Tester", "startup", "catalog-management", "Catalog Manager, Data Entry, Image Processor, Price Optimizer", "agency", "clinical-trials", "Trial Coordinator, Data Monitor, Adverse Event Tracker, Regulatory Agent", "enterprise", ].map(([template, roles, culture]) => ( Example: incident-response ORG.md Every template includes boot sequence instructions in its generated

```
1. Read ORG.md — understand your role, hierarchy, and reporting chain
2. Read SOUL.md — internalize org values and communication norms
3. Read AGENTS.md — understand workspace rules and tool access
4. Write PLAN.md — plan your approach before executing
5. Execute — follow plan, write RESULT.md when done
```

## Policy guardrails

SOUL.md. Agents read these files at startup to understand the org before they begin work. Templates include sensible default policies. Override any of these in the

## Policies section of your ORG.md.

Guardrail

Default

## Customizing a template

### Add an agent

```
## Structure
- Oscar L10 Operations
- Radar L7 Research
- NewAgent L7 Analytics # ← add a new line under the parent
```

### Remove an agent

### Change hierarchy

### Change culture

Override with ["Budget per agent", "500 credits/day", "Per-agent limit in Policies > Budget"], ["Department cap", "10 agents max", "Department Caps in Policies"], ["Spawn permissions", "L7+ only", "Permissions section"], ["Overage behavior", "pause and escalate", "Overage behavior in Budget"], ["Review required", "L6+ for code changes", "Permissions section"], ].map(([guardrail, def_, override]) => ( Delete the agent's line from the Structure section. Re-assign or remove any agents that reported to it. Run openspawn validate to confirm. Move agent lines to different indentation levels or under different parents. Validate after changes. Edit the preset value in the Culture section. Valid presets: agency,

### Add a playbook

## Error recovery

startup, research. Add a new section under Playbooks in your ORG.md with step-by-step instructions for recurring workflows.

Unknown template Use one of: assistant-team,

content-agency,

dev-shop,

research-lab

Agent reports to unknown

Check spelling of parent agent name in Structure

Validation failed Run openspawn validate for detailed errors

Circular reporting chain Check hierarchy for loops — agents cannot report to their own descendants
