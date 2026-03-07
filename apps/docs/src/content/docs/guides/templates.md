---
title: Templates Guide
---

# Templates Guide

**What you'll learn:** The seven OpenSpawn industry org templates — what they include, when to use each, how to customize them, and how to combine roles from multiple templates.

> **The key insight:** One file — `ORG.md` — defines your entire agent organization. Templates give you a battle-tested starting point for your industry. Customize from there.

OpenSpawn ships seven industry org templates. Each produces a complete, ready-to-run ORG.md with roles, hierarchy, culture, budget policies, and operating playbooks — modeled on real organizational pain points.

---

## Which template is right for you?

```
What's your primary use case?
│
├── Customer success / SaaS
│   Are you automating customer onboarding?
│   └── YES → saas-onboarding
│
├── Engineering / DevOps
│   Are you managing production incidents?
│   └── YES → incident-response
│
├── Legal
│   Are you reviewing contracts?
│   └── YES → contract-review
│
├── Finance / Compliance
│   Are you monitoring transactions for regulatory compliance?
│   └── YES → compliance-monitoring
│
├── Gaming
│   Are you running a live service game?
│   └── YES → game-live-ops
│
├── E-commerce / Retail
│   Are you managing a large product catalog?
│   └── YES → catalog-management
│
└── Healthcare / Life Sciences
    Are you processing clinical trial data?
    └── YES → clinical-trials
```

> **Q: My use case isn't listed?**
>
> - Pick the closest template and customize. Templates are starting points. The ORG.md format is flexible enough to model any organizational structure.

> **Q: Can I combine roles from multiple templates?**
>
> - Yes. Copy agent definitions from one template's Structure section into another. Validate with `openspawn validate`.

---

## Comparison table

|                    | saas-onboarding      | incident-response          | contract-review      | compliance-monitoring | game-live-ops         | catalog-management   | clinical-trials          |
| ------------------ | -------------------- | -------------------------- | -------------------- | --------------------- | --------------------- | -------------------- | ------------------------ |
| **Industry**       | SaaS                 | DevOps / SRE               | Legal                | Fintech               | Gaming                | E-commerce           | Healthcare               |
| **Culture preset** | `agency`             | `military`                 | `enterprise`         | `enterprise`          | `agency`              | `startup`            | `enterprise`             |
| **Agent count**    | 4                    | 4                          | 4                    | 4                     | 4                     | 4                    | 4                        |
| **Top role**       | Onboarding Lead (L7) | Incident Commander (L8)    | Senior Reviewer (L7) | Compliance Lead (L7)  | Ops Director (L7)     | Catalog Manager (L7) | Study Director (L8)      |
| **Key feature**    | 48-hr SLA playbooks  | MTTR minimization          | Playbook comparison  | SAR/CTR automation    | Economy guardrails    | Margin guardrails    | Regulatory compliance    |
| **Escalation**     | Immediate            | Immediate + mandatory acks | Deliberate           | Immediate for SAR     | Immediate for economy | Immediate for margin | Deliberate + audit trail |

---

## saas-onboarding

**SaaS customer onboarding pipeline.** Takes a new enterprise customer from signed contract to first successful workflow in 48 hours.

```bash
openspawn init my-org --template=saas-onboarding
```

**Pain solved:** Manual onboarding takes 2–3 days per customer across 4 teams, with handoffs that drop context and delay go-live.

### Roles

| Agent                     | Level | Department       | Reports to      |
| ------------------------- | ----- | ---------------- | --------------- |
| Onboarding Lead           | L7    | Customer Success | Human Principal |
| Data Migration Specialist | L5    | Engineering      | Onboarding Lead |
| Integration Engineer      | L5    | Engineering      | Onboarding Lead |
| Success Agent             | L4    | Customer Success | Onboarding Lead |

### Example ORG.md Structure section

```markdown
## Structure

### Onboarding Lead — Customer Onboarding Manager

The quarterback. Receives new customer intake, creates the onboarding plan,
assigns work to specialists, and tracks progress to go-live.

- **Level:** 7
- **Department:** Customer Success
- **Reports to:** Human Principal

#### Data Migration Specialist — Senior Data Engineer

Ingests customer data from source systems, validates schema compatibility,
runs transformation pipelines, and verifies row counts match post-migration.

- **Level:** 5
- **Department:** Engineering
- **Reports to:** Onboarding Lead

#### Integration Engineer — Platform Integration Specialist

Connects the customer's existing tools (CRM, ERP, SSO, webhooks) to the platform.
Validates each integration with smoke tests.

- **Level:** 5
- **Department:** Engineering
- **Reports to:** Onboarding Lead

#### Success Agent — Customer Success Representative

Conducts the go-live check-in, validates the customer can complete their first
workflow end-to-end, closes the onboarding ticket.

- **Level:** 4
- **Department:** Customer Success
- **Reports to:** Onboarding Lead
```

### When to use

- You onboard enterprise customers and handoffs between teams lose context
- You want to run parallel workstreams (migration + integration simultaneously) with a coordinator
- You need a paper trail of each onboarding phase for compliance or QBRs

> **Q: What if my onboarding is simpler / more complex?**
>
> - Simpler: remove Integration Engineer; the Onboarding Lead handles integration directly
> - More complex: add a Configuration Agent (L4) and a QA Validator (L4) between migration and go-live

---

## incident-response

**DevOps incident response team.** Detects, diagnoses, and remediates production incidents with a military-grade command structure.

```bash
openspawn init my-org --template=incident-response
```

**Pain solved:** 3am pages with 45-minute MTTR, context switching between 6 monitoring tools, and no single source of truth during an incident.

### Roles

| Agent              | Level | Department       | Reports to         |
| ------------------ | ----- | ---------------- | ------------------ |
| Incident Commander | L8    | SRE              | Human Principal    |
| Diagnostics Agent  | L6    | SRE              | Incident Commander |
| Remediation Agent  | L6    | Engineering      | Incident Commander |
| Comms Agent        | L4    | Customer Success | Incident Commander |

### Example ORG.md Structure section

```markdown
## Structure

### Incident Commander — Senior SRE / On-Call Lead

Owns the incident from page to post-mortem. Makes go/no-go decisions on rollback.

- **Level:** 8
- **Department:** SRE
- **Reports to:** Human Principal

#### Diagnostics Agent — Systems Reliability Engineer

Rapid root-cause analysis. Pulls metrics, traces, and logs to identify the failure domain.

- **Level:** 6
- **Department:** SRE
- **Reports to:** Incident Commander

#### Remediation Agent — Platform Engineer

Executes the fix. Implements hotfix, coordinates rollback, verifies recovery.

- **Level:** 6
- **Department:** Engineering
- **Reports to:** Incident Commander

#### Comms Agent — Incident Communications Specialist

Manages all stakeholder communications. Status page, customer notifications, Slack updates.

- **Level:** 4
- **Department:** Customer Success
- **Reports to:** Incident Commander
```

### When to use

- You're on call and need structured coordination during incidents
- Your MTTR is above 30 minutes and context-switching is the main cause
- You need post-mortem documentation generated automatically from the incident timeline

> **Q: What about runbook automation?**
>
> - Add a Runbook Agent (L5, Engineering, reports to Remediation Agent) that executes pre-approved runbook steps automatically

---

## contract-review

**Legal contract review pipeline.** Extracts clauses, compares against the company playbook, flags risks, and produces attorney-ready summaries.

```bash
openspawn init my-org --template=contract-review
```

**Pain solved:** Junior associates spend 80+ hours per week on contract review — reading, extracting, comparing against playbook, and writing summaries that senior attorneys then re-read.

### Roles

| Agent            | Level | Department | Reports to      |
| ---------------- | ----- | ---------- | --------------- |
| Senior Reviewer  | L7    | Legal      | Human Principal |
| Clause Extractor | L5    | Legal      | Senior Reviewer |
| Risk Analyst     | L5    | Legal      | Senior Reviewer |
| Summary Writer   | L4    | Legal      | Senior Reviewer |

### Example ORG.md Structure section

```markdown
## Structure

### Senior Reviewer — Senior Legal Analyst

Owns the review queue. Assigns contracts, reviews and approves final summaries,
and escalates material risks to legal counsel.

- **Level:** 7
- **Department:** Legal
- **Reports to:** Human Principal

#### Clause Extractor — Contract Analysis Specialist

Reads the full contract and extracts all key clauses into a structured inventory.

- **Level:** 5
- **Department:** Legal
- **Reports to:** Senior Reviewer

#### Risk Analyst — Legal Risk Specialist

Compares extracted clauses against the company playbook. Assigns risk level
to each deviation with recommended redline.

- **Level:** 5
- **Department:** Legal
- **Reports to:** Senior Reviewer

#### Summary Writer — Legal Communications Specialist

Produces the attorney-ready review package: executive summary, clause comparison
table, risk register, and suggested redlines.

- **Level:** 4
- **Department:** Legal
- **Reports to:** Senior Reviewer
```

### When to use

- Your legal team reviews high volumes of NDAs, MSAs, or vendor agreements
- You want consistent playbook application across all reviewers
- You need to reduce time-to-review from weeks to hours for routine contracts

> **Q: Can I use this for M&A due diligence?**
>
> - The template can be extended with a Due Diligence Coordinator (L8) above the Senior Reviewer. Add a Data Room Analyst (L5) for document management.

---

## compliance-monitoring

**Fintech transaction monitoring and regulatory reporting.** Applies AML/BSA rules, screens OFAC, and generates SAR/CTR filings.

```bash
openspawn init my-org --template=compliance-monitoring
```

**Pain solved:** Manual transaction monitoring misses 15% of anomalies, creates 48-hour reporting lag, and requires analysts running the same queries every morning.

### Roles

| Agent               | Level | Department | Reports to      |
| ------------------- | ----- | ---------- | --------------- |
| Compliance Lead     | L7    | Compliance | Human Principal |
| Transaction Analyst | L5    | Compliance | Compliance Lead |
| Rule Engine Agent   | L5    | Compliance | Compliance Lead |
| Report Generator    | L4    | Compliance | Compliance Lead |

### Example ORG.md Structure section

```markdown
## Structure

### Compliance Lead — Chief Compliance Officer (Agent)

Owns the monitoring program. Reviews flagged activity, approves SAR submissions,
and escalates material findings to Human Principal.

- **Level:** 7
- **Department:** Compliance
- **Reports to:** Human Principal

#### Transaction Analyst — Compliance Data Analyst

Ingests and normalizes transaction data from all payment rails.
Enriches with counterparty risk scores and geolocation.

- **Level:** 5
- **Department:** Compliance
- **Reports to:** Compliance Lead

#### Rule Engine Agent — Regulatory Rules Specialist

Applies AML/BSA rules, OFAC screening, velocity checks,
and structuring detection against the enriched transaction stream.

- **Level:** 5
- **Department:** Compliance
- **Reports to:** Compliance Lead

#### Report Generator — Compliance Reporting Specialist

Produces SAR drafts, CTR filings, and daily/weekly compliance reports
formatted for regulatory submission.

- **Level:** 4
- **Department:** Compliance
- **Reports to:** Compliance Lead
```

### When to use

- You process financial transactions and have regulatory monitoring obligations
- You need automated SAR/CTR detection and drafting
- Your analysts spend most of their time on mechanical rule application, not judgment calls

> **Q: Can I use this for SEC/FINRA compliance instead of FinCEN?**
>
> - Yes. Update the Rule Engine Agent's playbook section with SEC/FINRA rules. The hierarchy and workflow are framework-agnostic.

---

## game-live-ops

**Gaming live operations team.** Monitors game economy, generates content, tunes balance parameters, and manages player sentiment.

```bash
openspawn init my-org --template=game-live-ops
```

**Pain solved:** Player churn from stale content and unbalanced economies. Live ops teams can't manually track every economy metric, generate fresh event content, and handle player support simultaneously.

### Roles

| Agent                | Level | Department      | Reports to      |
| -------------------- | ----- | --------------- | --------------- |
| Ops Director         | L7    | Live Operations | Human Principal |
| Economy Tuner        | L6    | Live Operations | Ops Director    |
| Content Generator    | L5    | Live Operations | Ops Director    |
| Player Support Agent | L4    | Live Operations | Ops Director    |

### Example ORG.md Structure section

```markdown
## Structure

### Ops Director — Live Operations Director

Sets weekly content calendar, approves economy parameter changes,
monitors overall game health, and owns the player experience.

- **Level:** 7
- **Department:** Live Operations
- **Reports to:** Human Principal

#### Economy Tuner — Game Economy Analyst

Monitors economy metrics continuously. Detects anomalies, proposes balance
adjustments, implements approved changes within guardrail thresholds.

- **Level:** 6
- **Department:** Live Operations
- **Reports to:** Ops Director

#### Content Generator — Live Content Specialist

Produces event descriptions, challenge text, reward messaging, and push
notification copy per the weekly content calendar.

- **Level:** 5
- **Department:** Live Operations
- **Reports to:** Ops Director

#### Player Support Agent — Community & Support Specialist

Monitors app store reviews and social sentiment. Drafts response templates
and escalates critical player issues to Ops Director.

- **Level:** 4
- **Department:** Live Operations
- **Reports to:** Ops Director
```

### When to use

- You run a live service game and need 24/7 economy and sentiment monitoring
- Your live ops team is small relative to your player base
- You want to automate routine content generation while keeping creative direction human

> **Q: What about player bans and support tickets?**
>
> - Add a Trust & Safety Agent (L5, Live Operations, reports to Ops Director) for moderation decisions

---

## catalog-management

**E-commerce product catalog.** Monitors competitors, optimizes pricing, and generates product descriptions across thousands of SKUs.

```bash
openspawn init my-org --template=catalog-management
```

**Pain solved:** Competitors change prices daily, product descriptions go stale, and a team of copywriters and pricing analysts can't manually keep up with a catalog of 10,000+ SKUs.

### Roles

| Agent              | Level | Department | Reports to      |
| ------------------ | ----- | ---------- | --------------- |
| Catalog Manager    | L7    | E-commerce | Human Principal |
| Price Optimizer    | L6    | E-commerce | Catalog Manager |
| Content Writer     | L5    | Marketing  | Catalog Manager |
| Competitor Monitor | L4    | E-commerce | Catalog Manager |

### Example ORG.md Structure section

```markdown
## Structure

### Catalog Manager — Head of Catalog Operations

Sets pricing strategy and content quality standards. Approves major pricing
moves and ensures catalog health metrics trend in the right direction.

- **Level:** 7
- **Department:** E-commerce
- **Reports to:** Human Principal

#### Price Optimizer — Pricing Analyst

Applies dynamic pricing rules within margin floor and MAP policy guardrails.
Reads competitor prices and demand signals to calculate optimal price points.

- **Level:** 6
- **Department:** E-commerce
- **Reports to:** Catalog Manager

#### Content Writer — Product Content Specialist

Writes and rewrites product descriptions, titles, bullet points, and meta
content for SEO. Prioritizes high-traffic or low-conversion products.

- **Level:** 5
- **Department:** Marketing
- **Reports to:** Catalog Manager

#### Competitor Monitor — Market Intelligence Analyst

Monitors competitor catalogs, pricing, and promotions. Tracks assortment gaps
and delivers daily intelligence briefings to Catalog Manager.

- **Level:** 4
- **Department:** E-commerce
- **Reports to:** Catalog Manager
```

### When to use

- You sell thousands of SKUs and competitors reprice daily
- Your product descriptions are stale or inconsistent across categories
- You want to enforce margin floors and MAP compliance automatically

> **Q: What about inventory-based pricing?**
>
> - Add an Inventory Analyst (L5, Operations, reports to Catalog Manager) that feeds stock levels into the Price Optimizer's decision logic

---

## clinical-trials

**Healthcare clinical trial processing.** Processes study data from raw EDC export to regulatory submission package.

```bash
openspawn init my-org --template=clinical-trials
```

**Pain solved:** Regulatory submissions take months of manual data processing — normalization, protocol validation, statistical analysis, and document preparation. Most of that work is mechanical, not scientific.

### Roles

| Agent              | Level | Department          | Reports to      |
| ------------------ | ----- | ------------------- | --------------- |
| Study Director     | L8    | Clinical Operations | Human Principal |
| Data Analyst       | L6    | Biostatistics       | Study Director  |
| Protocol Validator | L5    | Regulatory Affairs  | Study Director  |
| Regulatory Writer  | L5    | Regulatory Affairs  | Study Director  |

### Example ORG.md Structure section

```markdown
## Structure

### Study Director — Clinical Data Director

Owns the submission. Reviews all outputs for scientific validity and
approves regulatory documents before submission.

- **Level:** 8
- **Department:** Clinical Operations
- **Reports to:** Human Principal

#### Data Analyst — Clinical Data Scientist

Processes raw clinical data to CDISC SDTM/ADaM standards.
Produces statistical output tables and listings.

- **Level:** 6
- **Department:** Biostatistics
- **Reports to:** Study Director

#### Protocol Validator — Regulatory Compliance Analyst

Validates study procedures and data against the approved protocol.
Documents all deviations with root cause and impact assessment.

- **Level:** 5
- **Department:** Regulatory Affairs
- **Reports to:** Study Director

#### Regulatory Writer — Medical Writer

Produces submission-ready documents: Clinical Study Report, adverse event
narratives, and module content formatted to ICH E3.

- **Level:** 5
- **Department:** Regulatory Affairs
- **Reports to:** Study Director
```

### When to use

- You're a CRO or sponsor preparing FDA/EMA regulatory submissions
- Your statistical programmers spend most of their time on CDISC mapping instead of analysis
- You need a fully auditable processing pipeline for regulatory inspection

> **Q: What about safety data (SUSAR/CIOMS)?**
>
> - Add a Safety Reporting Agent (L5, Pharmacovigilance, reports to Study Director) for expedited safety reporting

---

## Boot Sequence Templates

In addition to industry templates, OpenSpawn ships agent SOUL.md templates and a boot sequence spec. These define how agents behave when an org starts.

| Template                           | Purpose                            | Use for                                     |
| ---------------------------------- | ---------------------------------- | ------------------------------------------- |
| `templates/boot-sequence.md`       | Step-by-step startup protocol      | Reference — how the lead agent boots an org |
| `templates/SOUL-lead.md`           | Complete SOUL.md for lead agents   | Lead/coordinator agent workspaces           |
| `templates/SOUL-worker.md`         | Complete SOUL.md for worker agents | Any worker/specialist agent workspace       |
| `templates/AGENTS-leader.md`       | AGENTS.md for leaders              | Leader workspace operational instructions   |
| `templates/AGENTS-worker.md`       | AGENTS.md for workers              | Worker workspace operational instructions   |
| `templates/AGENTS-reviewer.md`     | AGENTS.md for reviewers            | Reviewer workspace operational instructions |
| `templates/soul-protocol-rules.md` | Communication rules snippet        | Append to any agent's SOUL.md               |

> **Q: What's the boot sequence?**
> When an org starts, the lead agent reads ORG.md, writes PLAN.md (breaking the mission into phased tasks), registers agents, creates tasks via MCP, then monitors. Workers read PLAN.md and claim their tasks. See `templates/boot-sequence.md` for the full protocol.

---

## Customizing a template

After `openspawn init`, your ORG.md is just a markdown file. Edit freely:

### Add an agent

```markdown
#### QA Validator — Onboarding Quality Analyst

Reviews completed onboarding configurations for errors before go-live.

- **Level:** 4
- **Department:** Engineering
- **Reports to:** Onboarding Lead
```

### Remove an agent

Delete the agent's section. Make sure no other agent has `Reports to: DeletedAgent`.

### Change hierarchy

Update the `Reports to` field. Validate: `openspawn validate`.

### Change culture

```markdown
## Culture

preset: enterprise
```

Or override individual settings after the preset.

### Add a playbook

```markdown
## Playbooks

### Custom Escalation Workflow

1. Specialist encounters blocker
2. Writes blocker details to ESCALATION.md
3. Escalates to lead via escalation_create with severity: high
4. Lead responds within 1 hour with resolution or timeline
```

### Add policy guardrails

```markdown
## Policies

### Budget

- **Per-agent limit:** 800 credits/customer
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate

### Permissions

- **Human approval required for:** Any action with > $10K business impact
```

---

## Error recovery

| You see                                 | Fix                                                                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unknown template: foo`                 | Valid names: `saas-onboarding`, `incident-response`, `contract-review`, `compliance-monitoring`, `game-live-ops`, `catalog-management`, `clinical-trials` |
| `Agent reports to unknown agent`        | Check `Reports to` matches an existing agent name exactly                                                                                                 |
| `Validation failed after customization` | Run `openspawn validate` and fix each listed issue                                                                                                        |
| `Circular reporting chain`              | No agent can report to itself or create a loop. Check hierarchy.                                                                                          |

---

## Next steps

- **Full ORG.md format:** [`docs/org-md-reference.md`](./org-md-reference.md) — every field and example
- **MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md) — how agents interact with the org
- **Communication rules:** [`docs/communication-protocol.md`](./communication-protocol.md) — how agents talk to each other
- **Troubleshooting:** [`docs/troubleshooting.md`](./troubleshooting.md) — fix common errors
- **Live demo:** https://openspawn.dev/app/
