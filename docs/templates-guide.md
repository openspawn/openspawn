---
purpose: Choose and customize OpenSpawn org templates
audience: developers, AI agents
prerequisites: openspawn CLI installed
---

# Templates Guide

OpenSpawn ships four org templates. Each produces a complete, ready-to-run ORG.md with roles, hierarchy, culture, policies, and playbooks.

## Which template should I use?

```
What's your primary output?
├── Code / software
│   → dev-shop
├── Content (blogs, social media, docs, marketing)
│   → content-agency
├── Research / analysis / intel
│   → research-lab
├── Mix of everything / solo operator
│   → assistant-team
└── None of these fit
    → Start with assistant-team, then customize
```

> **Q: Can I switch templates later?**
> - You can re-run `openspawn init` with a different template. Or just edit your ORG.md directly — templates are just starting points.

> **Q: Can I combine roles from multiple templates?**
> - Yes. Copy agent definitions from one template's Structure section into another.

---

## Comparison table

| | assistant-team | content-agency | dev-shop | research-lab |
|---|---|---|---|---|
| **Best for** | Solo operator | Content production | Software teams | Research & analysis |
| **Culture preset** | `agency` | `agency` | `startup` | `research` |
| **Agent count** | 8 | ~6 | ~5 | ~4 |
| **Hierarchy depth** | 2 levels | 2-3 levels | 2 levels | 2 levels |
| **Top role** | Chief of Staff | Creative Director | Tech Lead | Research Director |
| **Domains** | Ops, research, content, engineering, security, quality | Research, strategy, writing, design | Frontend, backend, QA | Analysis, exploration |
| **Escalation** | Immediate | Immediate | Immediate | Delayed |
| **Autonomy** | Medium | Medium | Medium | High |

---

## assistant-team

**Personal AI team for a solo operator.** Chief of staff coordinates specialists across research, content, engineering, security, and quality.

```bash
openspawn init my-org --template=assistant-team
```

### Roles

| Agent | Level | Domain | Reports to |
|-------|-------|--------|------------|
| Oscar — Chief of Staff | L10 | Operations | Human Principal |
| Radar — Research Analyst | L7 | Research | Oscar |
| Muse — Creative Strategist | L7 | Content Strategy | Oscar |
| Ink — Content Writer | L4 | Writing | Muse |
| Lens — Visual Designer | L4 | Visual Design | Muse |
| Forge — Engineer | L7 | Engineering | Oscar |
| Shield — Security Auditor | L7 | Security | Oscar |
| Guru — Mentor | L7 | Quality | Oscar |

### When to use
- You're one person who needs a full team
- Your work spans multiple domains (not just code or just content)
- You want a single coordinator (Oscar) managing everything

### Example ORG.md output (abbreviated)

```markdown
# My Team

## Identity
An AI-powered operations team that handles content, research, engineering,
and security autonomously.
- **Mission:** Ship real output with minimal human intervention

## Culture
preset: agency

## Structure

### Oscar — Chief of Staff
The coordinator. Manages priorities, delegates to specialists.
- **Level:** 10
- **Domain:** Operations
- **Reports to:** Human Principal

#### Radar — Research Analyst
Monitors the internet for relevant signals.
- **Level:** 7
- **Domain:** Research
- **Reports to:** Oscar

...

## Policies
### Budget
- **Per-agent limit:** 500 credits/period
```

> **Q: What if I don't need security or quality roles?**
> - Delete Shield and/or Guru from the Structure section. Validate with `openspawn validate`.

---

## content-agency

**Content production pipeline.** Research feeds strategy, strategy directs writing and design.

```bash
openspawn init my-org --template=content-agency
```

### Roles

| Agent | Level | Domain | Reports to |
|-------|-------|--------|------------|
| Director — Creative Director | L10 | Creative | Human Principal |
| Researcher — Content Researcher | L7 | Research | Director |
| Strategist — Content Strategist | L7 | Strategy | Director |
| Writer — Content Writer | L4 | Writing | Strategist |
| Designer — Visual Designer | L4 | Design | Strategist |
| Editor — Quality Editor | L7 | Quality | Director |

### When to use
- Your primary output is content (blogs, social, docs, marketing)
- You want a clear pipeline: research → strategy → production → review
- Content quality matters more than speed

> **Q: What about SEO?**
> - Add an SEO agent under Strategist. Give it L4, domain "SEO", reports to Strategist.

---

## dev-shop

**Software development team.** Tech lead coordinates frontend, backend, and QA.

```bash
openspawn init my-org --template=dev-shop
```

### Roles

| Agent | Level | Domain | Reports to |
|-------|-------|--------|------------|
| Lead — Tech Lead | L10 | Engineering | Human Principal |
| Frontend — Frontend Dev | L7 | Frontend | Lead |
| Backend — Backend Dev | L7 | Backend | Lead |
| QA — Quality Assurance | L7 | Testing | Lead |
| DevOps — Infrastructure | L4 | DevOps | Lead |

### When to use
- Your primary output is software
- You want clear separation between frontend, backend, and QA
- You need a tech lead making architecture decisions

> **Q: What about design?**
> - Add a Designer agent (L4, domain "Design", reports to Lead), or combine with `assistant-team` roles.

---

## research-lab

**Research and analysis team.** High autonomy, exploration-oriented, delayed escalation.

```bash
openspawn init my-org --template=research-lab
```

### Roles

| Agent | Level | Domain | Reports to |
|-------|-------|--------|------------|
| Director — Research Director | L10 | Research | Human Principal |
| Analyst — Senior Analyst | L7 | Analysis | Director |
| Explorer — Research Explorer | L7 | Exploration | Director |
| Synthesizer — Report Writer | L4 | Synthesis | Director |

### When to use
- Your work is exploratory and open-ended
- Agents need high autonomy (delayed escalation, progress on request)
- Long-running tasks are the norm
- Output is reports, analysis, insights

> **Q: What's the exploration budget?**
> - Research-lab template includes a higher per-agent credit limit and delayed escalation. Agents can explore without constant check-ins.

---

## Customizing a template

After `openspawn init`, your ORG.md is just a markdown file. Edit freely:

### Add an agent
```markdown
#### NewAgent — Role Title
Description of what this agent does.
- **Level:** 7
- **Domain:** Whatever
- **Reports to:** ExistingAgent
```

### Remove an agent
Delete the agent's section. Make sure no other agent has `Reports to: DeletedAgent`.

### Change hierarchy
Update the `Reports to` field. Validate: `openspawn validate`.

### Change culture
```markdown
## Culture
preset: military
```
Or override individual settings after the preset.

### Add a playbook
```markdown
## Playbooks

### My Custom Workflow
1. Step one
2. Step two
3. Step three
```

---

## Error recovery

| You see | Fix |
|---------|-----|
| `Unknown template: foo` | Valid names: `assistant-team`, `content-agency`, `dev-shop`, `research-lab` |
| `Agent reports to unknown agent` | Check `Reports to` matches an existing agent name exactly |
| `Validation failed after customization` | Run `openspawn validate` and fix each listed issue |
| `Circular reporting chain` | No agent can report to itself or create a loop. Check hierarchy. |
