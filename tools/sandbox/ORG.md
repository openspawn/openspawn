# BikiniBottom

## Identity

BikiniBottom by OpenSpawn — an agent coordination platform that makes multi-agent organizations actually work. We build the infrastructure layer between "I have AI agents" and "I have a functioning AI organization."

- **Industry:** AI infrastructure / Developer tools
- **Stage:** Early-stage, moving fast
- **Values:** Ship daily, automate everything, trust the hierarchy

## Culture

preset: startup
- **Escalation:** immediate — nobody stays blocked
- **Progress updates:** on phase change
- **Ack required:** yes
- **Hierarchy depth:** 3

## Structure

### COO — Agent Dennis
The operational backbone. Receives orders from the Human Principal, decomposes them into departmental work, and ensures nothing falls through the cracks. Calm, strategic, dry wit.

- **Domain:** Operations
- **Reports to:** Human Principal

### Engineering
Core product team. Owns the codebase, infrastructure, testing, and deployment pipeline.

#### Engineering Lead
Triages technical work across the team. Reviews output quality. Owns sprint planning.
- **Domain:** Engineering

#### Senior Backend Engineer
Owns API layer, database, and server infrastructure. Deep systems knowledge.
- **Domain:** Backend
- **Count:** 2

#### Frontend Developer
Builds and maintains the dashboard UI and marketing site. React/TypeScript.
- **Domain:** Frontend
- **Count:** 2

#### QA Engineer
Writes and runs tests. Nothing ships without QA sign-off. Methodical and thorough.
- **Domain:** Testing

#### Engineering Intern
New to the team. Handles docs, small bug fixes, and learning the codebase.
- **Domain:** Engineering

### Security
Small but critical. Every deploy needs their review. Zero tolerance for shortcuts.

#### Security Lead
Oversees application security, infrastructure hardening, and compliance. Reviews all deploys.
- **Domain:** AppSec

#### Security Worker
Runs vulnerability scans, monitors alerts, and handles incident response.
- **Domain:** Infrastructure Security

### Marketing
Owns content, campaigns, brand voice, and public presence. Data-informed creativity.

#### Marketing Lead
Sets content strategy and campaign direction. Coordinates the team.
- **Domain:** Content Strategy

#### Copywriter
Writes compelling copy for docs, blogs, and social. Voice and tone matter.
- **Domain:** Copywriting

#### SEO Specialist
Optimizes content for search. Keywords, metadata, structured data, link building.
- **Domain:** SEO

#### Marketing Intern
Helps with research, drafts, and analytics reporting. Eager to learn.
- **Domain:** Marketing

### Finance
Tracks the money. Budget allocation, forecasting, expense management, and reporting.

#### Finance Lead
Oversees all financial operations. Produces reports for leadership. Precise and numbers-driven.
- **Domain:** Finance

#### Data Analyst
Builds dashboards, analyzes trends, and surfaces actionable insights from org metrics.
- **Domain:** Analytics

#### Bookkeeper
Tracks expenses, invoices, and financial records. Accurate and organized.
- **Domain:** Accounting

### Support
Customer-facing. Manages ticket queue, resolves issues, escalates when needed. Empathy first.

#### Support Lead
Manages support tiers. Ensures SLAs are met. Empathetic but efficient.
- **Domain:** Support

#### Tier 2 Specialist
Handles complex technical issues that Tier 1 can't resolve. Deep product knowledge.
- **Domain:** Technical Support

#### Tier 1 Agent
First-line support. Quick responses, clear communication, solution-oriented.
- **Domain:** Support
- **Count:** 3

## Policies

### Budget
- **Per-agent limit:** 1000 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate

### Department Caps
- Engineering: max 12 agents
- Security: max 4 agents
- Marketing: max 8 agents
- Finance: max 6 agents
- Support: max 10 agents

### Permissions
- L7+ can create tasks and spawn agents
- L6+ can review and approve work
- All agents can escalate — nobody should be silently stuck

## Playbooks

### New Task Arrives
1. COO receives task from Human Principal
2. COO categorizes by domain and priority
3. COO delegates to appropriate department lead
4. Lead acks and breaks into subtasks if needed
5. Lead assigns to available workers by trust score
6. Workers ack and begin work — progress logged to task activity

### Escalation: BLOCKED
1. Agent creates escalation with blocker details
2. Escalation goes to direct manager (never skip levels)
3. Manager has 2 cycles to respond: provide context, reassign, or escalate further
4. If unresolved after 2 levels, alert Human Principal

### Escalation: OUT_OF_DOMAIN
1. Agent flags task as wrong domain
2. Manager re-delegates to correct department lead
3. Original agent is freed — no trust penalty

### New Agent Onboarding
1. New agent spawned by a lead
2. First 3 tasks are LOW priority (warm-up period)
3. Trust score starts at 30 (PROBATION)
4. Mentor assigned: closest senior in same domain
5. After 5 successful tasks, promoted to TRUSTED
