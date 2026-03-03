---
source: https://openspawn.ai/docs/templates
generated: 2026-03-03
---

Templates Guide OpenSpawn ships four org templates. Each produces a complete, ready-to-run

```
What's your primary output?
├── Code / software → dev-shop
├── Content (blogs, social media, docs, marketing) → content-agency
├── Research / analysis / intel → research-lab
├── Mix of everything / solo operator → assistant-team
└── None of these fit → Start with assistant-team, then customize
```

ORG.md with roles, hierarchy, culture, policies, and playbooks. Which template should I use?

Q: Can I switch templates later? A: Yes, re-run init or edit

ORG.md directly.

Q: Can I combine roles from multiple templates? A: Yes, copy agent definitions between Structure sections. Comparison table

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

```
openspawn init my-org --template=assistant-team
```

### Roles

High assistant-team Personal AI team for a solo operator. Chief of staff coordinates specialists.

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

When to use: solo person needing a full team, work spans multiple domains, want a single coordinator.

Q: What if I don't need security or quality roles? A: Delete them from the Structure section, then validate with

```
openspawn init my-org --template=content-agency
```

### Roles

openspawn validate. content-agency Content production pipeline. Research feeds strategy, strategy directs writing and design.

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

Q: What about SEO? A: Add an SEO agent under Strategist, L4, domain

```
openspawn init my-org --template=dev-shop
```

### Roles

"SEO". dev-shop Software development team. Tech lead coordinates frontend, backend, QA.

Domain

Engineering

Frontend

Frontend

Backend

Backend

Testing

DevOps

Infrastructure

Q: What about design? A: Add a Designer agent or combine with

```
openspawn init my-org --template=research-lab
```

### Roles

assistant-team. research-lab Research and analysis team. High autonomy, delayed escalation.

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

Q: What's the exploration budget? A: Higher per-agent credit limit and delayed escalation allow deeper exploration. Customizing a template Delete the agent's line from the Structure section. Re-assign or remove any agents that reported to it. Run openspawn validate to confirm. Move agent lines to different indentation levels or under different parents. Validate after changes. Edit the preset value in the Culture section. Valid presets: agency,

startup,

### Add a playbook

research. Add a new section under Playbooks in your

ORG.md with step-by-step instructions for recurring workflows. Error recovery

Unknown template Use one of: assistant-team,

content-agency,

dev-shop,

research-lab

Agent reports to unknown

Check spelling of parent agent name in Structure

Validation failed Run openspawn validate for detailed errors

Circular reporting chain

Check hierarchy for loops — agents cannot report to their own descendants
