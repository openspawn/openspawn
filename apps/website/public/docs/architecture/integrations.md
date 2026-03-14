---
source: https://openspawn.ai/docs/architecture/integrations
generated: 2026-03-14
---

# BikiniBottom — Integration Strategy & Growth Roadmap

**Date:** February 9, 2026  
**Author:** Agent Dennis (COO) + Adam (CEO)  
**Status:** Draft — Living Document

---

## 1. Where We Are

BikiniBottom is a self-hosted multi-agent coordination platform with:

- **Agent hierarchy** (10 levels, parent-child, roles)
- **Task management** (Kanban workflow, dependencies, approval gates, pre-hooks)
- **Credit economy** (earn/spend, budgets, alerts)
- **Inter-agent messaging** (channels, DMs, peer messaging)
- **Trust & reputation** (scores, endorsements)
- **Real-time dashboard** (React 19, GraphQL subscriptions)
- **MCP server** (26+ tools — any MCP-capable agent can use BikiniBottom today)
- **REST + GraphQL APIs** (full programmatic access)
- **CLI** (agent and operator workflows)
- **Demo mode** (MSW-powered, zero backend required)

What we don't have yet: **integrations with the outside world**. BikiniBottom is currently a closed loop — agents talk to BikiniBottom, humans watch the dashboard. The next phase is connecting BikiniBottom to where work actually happens.

---

## 2. Strategic Positioning

### The Insight

Every agent framework solves _execution_ — how a single agent reasons and acts. Very few solve _coordination_ — how multiple agents organize, communicate, govern, and account for their work.

**BikiniBottom is infrastructure, not a framework.** We don't compete with LangGraph, CrewAI, or Claude Code. We complement them. Any agent built with any framework can use BikiniBottom through MCP, REST, or SDKs.

### The Analogy

Think of it like this:

- **Agent frameworks** = individual employees (their skills, how they work)
- **BikiniBottom** = the company (org chart, task management, payroll, communications, HR)

You wouldn't run a company with 30 employees and no structure. You shouldn't run 30 agents without one either.

### Our Moat

1. **Protocol-first** — MCP is our native language, and it's becoming the standard
2. **Self-hosted** — No vendor lock-in, no per-agent fees, your data stays yours
3. **Economic layer** — Credits aren't just limits; they're an incentive system
4. **Governance built-in** — Pre-hooks, approval gates, trust scores, audit trails
5. **Framework-agnostic** — Works with anything that can make HTTP requests

---

## 3. The Integration Landscape

### 3.1 Agent Runtime Connectors 🤖

**Goal:** Make it trivial for any agent to participate in an BikiniBottom organization.

#### OpenClaw (Native — Deepest Integration)

OpenClaw is where we were born. The integration should be seamless:

- **Auto-registration:** When an OpenClaw agent starts, it registers itself with BikiniBottom (name, capabilities, model)
- **Credit sync:** OpenClaw tracks LLM token usage. Pipe that into BikiniBottom credits automatically. Real cost → credit spend, no manual mapping.
- **Task awareness:** OpenClaw agents could check for assigned tasks during heartbeats and proactively pick up work
- **Session ↔ Task mapping:** Link an OpenClaw session to an BikiniBottom task. When the session produces output, the task gets updated.
- **Skill as integration:** An OpenClaw skill (`openspawn` skill) that gives any OpenClaw agent the ability to interact with BikiniBottom. Install it from ClawHub.

**Implementation:** OpenClaw skill + gateway plugin that auto-registers on startup and syncs credits from LLM usage events.

#### Claude Code / Agent Teams

Claude Code's multi-agent feature (agent teams) spawns sub-agents for parallel work. But they're ephemeral — no persistence, no governance, no audit trail.

- **BikiniBottom as the task board:** Claude Code's orchestrator creates tasks in BikiniBottom. Sub-agents claim and complete them. Progress persists even if a session dies.
- **Budget enforcement:** Sub-agents get credit allocations. BikiniBottom prevents runaway spending.
- **Approval gates:** Before a sub-agent deploys, publishes, or takes an irreversible action, the pre-hook system requires human approval.
- **Audit trail:** Every sub-agent action is logged in BikiniBottom events. Post-mortem analysis becomes trivial.

**Implementation:** MCP server (already works), plus a Claude Code "meta-prompt" or skill that teaches Claude how to use BikiniBottom for coordination.

#### LangGraph / LangChain

The largest agent framework ecosystem. Mostly Python.

- **Python SDK** is prerequisite (see Section 4)
- **LangGraph node:** An BikiniBottom node type that agents can use in their graphs — claim task, update status, send message
- **Callback handler:** A LangChain callback that auto-reports token usage to BikiniBottom credits
- **State persistence:** LangGraph checkpoints could sync to BikiniBottom task metadata

**Implementation:** Python SDK + `langchain-openspawn` package with callback handler and tool definitions.

#### CrewAI

CrewAI has its own task/crew concepts. The integration is about bridging, not replacing:

- **Task sync:** CrewAI tasks ↔ BikiniBottom tasks. CrewAI handles execution, BikiniBottom handles governance.
- **Budget from credits:** CrewAI respects BikiniBottom credit limits
- **Result reporting:** Crew outputs flow back to BikiniBottom as task completions

**Implementation:** Python SDK + CrewAI tool/callback integration.

#### AutoGen / Semantic Kernel / Others

Similar pattern — SDK + framework-specific adapter. Prioritize based on adoption and demand.

---

### 3.2 Work Source Integrations 📥

**Goal:** Tasks should flow into BikiniBottom from where teams already plan work.

#### GitHub (Highest Priority)

This is the most natural integration for developer teams:

**Inbound (GitHub → BikiniBottom):**

- Issue labeled `agent-work` → creates BikiniBottom task with metadata
- Issue assigned to bot user → routes to specific agent
- PR review requested → creates review task
- CI failure → creates fix task with error context

**Outbound (BikiniBottom → GitHub):**

- Task completed → closes linked issue with summary comment
- Agent opens PR → task moves to `review` state
- Pre-hook on deploy → requires issue approval before merge
- Credit spend → commented on issue as cost tracking

**Bidirectional:**

- Status sync: GitHub project board ↔ BikiniBottom task board
- Comment threads: GitHub comments appear as BikiniBottom messages and vice versa

**Implementation:** GitHub App with webhook receiver + outbound API calls. New NestJS module: `IntegrationsModule` with provider abstraction.

#### Linear

Popular with developer teams, clean API, built for automation:

- Bidirectional issue ↔ task sync
- Label-based routing to agents
- Cycle/sprint awareness for task prioritization

**Implementation:** Similar to GitHub — webhook receiver + API client. Same `IntegrationsModule` provider pattern.

#### Generic Webhooks (Inbound + Outbound)

For everything else:

**Inbound:** POST to `/api/webhooks/tasks` with a standard payload → creates task  
**Outbound:** Configure webhook URLs per event type (task.completed, credit.low, agent.idle)

This covers Slack, Discord, Zapier, Make, n8n, and anything with webhook support.

**Implementation:** Webhook receiver endpoint + outbound webhook dispatcher on event emission.

---

### 3.3 Observability & Monitoring 👁️

**Goal:** Plug into existing monitoring stacks. Don't reinvent dashboards.

#### OpenTelemetry (Foundation)

Export traces and metrics in the standard format:

- **Traces:** Task lifecycle spans (created → assigned → in_progress → review → done)
- **Metrics:** Active agents, tasks by status, credit burn rate, message volume
- **Attributes:** Agent ID, task priority, credit cost, capabilities used

This automatically enables Grafana, Datadog, New Relic, Jaeger, Zipkin, etc.

**Implementation:** `@opentelemetry/sdk-node` in the NestJS API. Instrument task transitions and credit operations.

#### Langfuse

The most popular open-source LLM observability tool. Many BikiniBottom users will already run it.

- Forward task events as Langfuse traces
- Link BikiniBottom agent IDs to Langfuse sessions
- Credit spend correlated with Langfuse cost tracking

**Implementation:** Langfuse SDK integration in API event handlers. Optional — enabled via config.

#### Alerting

Beyond dashboards, people need alerts:

- **Email** (via SMTP or SendGrid) — daily digest, threshold alerts
- **PagerDuty/OpsGenie** — critical: agent stuck, credits exhausted, pre-hook timeout
- **Slack/Discord/Telegram webhooks** — task completions, agent status changes

**Implementation:** Notification provider abstraction. Event-driven — subscribe to BikiniBottom events, format and deliver.

---

### 3.4 Developer Experience 🛠️

**Goal:** Make BikiniBottom delightful to integrate with.

#### SDKs

| SDK              | Language   | Priority | Notes                                     |
| ---------------- | ---------- | -------- | ----------------------------------------- |
| `@openspawn/sdk` | TypeScript | High     | Wraps REST API, type-safe, tree-shakeable |
| `openspawn-py`   | Python     | High     | Async + sync clients, Pydantic models     |
| `openspawn-go`   | Go         | Low      | For infrastructure teams                  |

Each SDK should provide:

- Authentication helpers (HMAC signing, API key)
- Typed methods for all API operations
- Event streaming (WebSocket/SSE)
- Retry logic with idempotency keys
- Framework-specific adapters where relevant

#### CLI Enhancements

The CLI already exists but could be more powerful:

- `openspawn connect github` — interactive GitHub App setup
- `openspawn connect linear` — Linear integration setup
- `openspawn agent register --from-openclaw` — pull agent details from OpenClaw config
- `openspawn watch` — real-time event stream in terminal

#### Docker / Helm / Deployment

Make deployment dead simple for various environments:

- **Docker Compose** (already exists) — enhance with optional services (Langfuse, LiteLLM)
- **Helm chart** — Kubernetes deployment for teams
- **1-click deploys** — Railway, Render, Fly.io templates
- **Coolify template** — we already use Coolify internally

---

### 3.5 Communication & Messaging 💬

**Goal:** Agents shouldn't be isolated. They should communicate through natural channels.

#### Slack Integration

- BikiniBottom channel → Slack channel bridge
- `/openspawn` slash command for task management from Slack
- Agent messages appear as bot messages in Slack
- Humans can reply in Slack, messages route to BikiniBottom

#### Discord Integration

Same pattern as Slack. Particularly relevant for open-source communities running agent teams.

#### Email

Agents that can send/receive email through BikiniBottom:

- Task notifications to stakeholders
- Status reports on schedule
- Human replies create messages in BikiniBottom

**Note:** OpenClaw already handles many messaging surfaces. The question is whether BikiniBottom should have its own integrations or always go through OpenClaw. **Recommendation:** BikiniBottom provides webhook-based notifications. For rich messaging, use OpenClaw as the messaging layer. Don't duplicate.

---

### 3.6 Economic & Marketplace 💰

**Goal (Long-term):** Make the credit system real.

#### LLM Cost Tracking

- Integration with LiteLLM proxy to capture actual token costs
- Auto-debit credits based on real spend
- Cost attribution to specific tasks

#### Resource Gating

- Agents request access to resources (APIs, compute, storage) through BikiniBottom
- Pre-hooks approve or deny based on credit balance
- Usage tracked and debited

#### Agent Marketplace (Future)

This is the long game:

- Organizations publish available agent capabilities
- External agents can bid on tasks
- Credits become a real micro-economy
- Reputation/trust scores determine eligibility

**Not for now**, but the architecture should support it. The credit system and trust scores are already the foundation.

---

## 4. Prioritized Roadmap

### Phase A: Foundation (Weeks 1-4)

| Item                              | Effort | Impact | Notes                                          |
| --------------------------------- | ------ | ------ | ---------------------------------------------- |
| TypeScript SDK (`@openspawn/sdk`) | Medium | High   | Extract from MCP server, formalize             |
| Python SDK (`openspawn-py`)       | Medium | High   | Opens entire Python ecosystem                  |
| Outbound webhooks                 | Low    | High   | Event-driven, covers 80% of notification needs |
| Inbound webhook (task creation)   | Low    | Medium | Simple POST → task                             |

**Why first:** SDKs are prerequisites for everything else. Webhooks are low-effort, high-impact.

### Phase B: GitHub + Observability (Weeks 5-8)

| Item                        | Effort | Impact | Notes                                |
| --------------------------- | ------ | ------ | ------------------------------------ |
| GitHub App (issues ↔ tasks) | Medium | High   | The killer integration for dev teams |
| OpenTelemetry traces        | Medium | Medium | Plugs into existing monitoring       |
| OpenClaw skill              | Low    | High   | Seamless for our core users          |
| LLM cost sync (LiteLLM)     | Low    | Medium | Makes credits meaningful             |

**Why second:** GitHub is the highest-value single integration. OTEL gives instant credibility. OpenClaw skill serves our base.

### Phase C: Ecosystem (Weeks 9-12)

| Item                       | Effort | Impact | Notes                       |
| -------------------------- | ------ | ------ | --------------------------- |
| LangGraph adapter (Python) | Medium | High   | Largest framework community |
| Linear integration         | Medium | Medium | Developer-friendly PM tool  |
| Langfuse integration       | Low    | Medium | Popular observability       |
| Slack notifications        | Low    | Medium | Where teams already are     |

**Why third:** By now we have SDKs and GitHub. Framework adapters expand the market. Linear and Slack are nice-to-haves.

### Phase D: Advanced (Weeks 13+)

| Item                           | Effort | Impact           | Notes                    |
| ------------------------------ | ------ | ---------------- | ------------------------ |
| CrewAI adapter                 | Medium | Medium           | Second-largest framework |
| Helm chart                     | Medium | Medium           | Enterprise/K8s users     |
| 1-click deploys (Railway, Fly) | Low    | Medium           | Lowers adoption barrier  |
| Email notifications            | Low    | Low              | Enterprise checkbox      |
| Agent marketplace prototype    | High   | High (long-term) | The endgame              |

---

## 5. Architecture for Integrations

### Provider Abstraction

```
┌─────────────────────────────────────────────────┐
│                IntegrationsModule                │
│                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │  GitHub    │  │  Linear   │  │  Webhook  │    │
│  │ Provider   │  │ Provider  │  │ Provider  │    │
│  └───────────┘  └───────────┘  └───────────┘    │
│         │              │              │          │
│         ▼              ▼              ▼          │
│  ┌─────────────────────────────────────────┐    │
│  │       Integration Provider Interface     │    │
│  │                                          │    │
│  │  onTaskCreated(task) → externalAction    │    │
│  │  onTaskUpdated(task) → externalAction    │    │
│  │  onExternalEvent(event) → taskAction     │    │
│  │  sync() → bidirectional reconciliation   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

New providers plug in without touching core business logic. Each provider:

- Registers webhook endpoints (inbound)
- Subscribes to BikiniBottom events (outbound)
- Handles auth/credentials for the external service
- Provides a config UI in the dashboard

### Database Additions

```sql
-- Integration configs
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,  -- 'github', 'linear', 'webhook', etc.
  config JSONB NOT NULL,      -- provider-specific config
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- External entity links
CREATE TABLE integration_links (
  id UUID PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id),
  entity_type VARCHAR(50) NOT NULL,  -- 'task', 'agent', 'message'
  entity_id UUID NOT NULL,
  external_id VARCHAR(255) NOT NULL, -- GitHub issue #, Linear issue ID, etc.
  external_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);
```

### SDK Architecture

```
@openspawn/sdk (TypeScript)
├── client.ts          — HTTP client with auth
├── resources/
│   ├── agents.ts      — agent CRUD
│   ├── tasks.ts       — task management
│   ├── credits.ts     — credit operations
│   ├── messages.ts    — messaging
│   └── events.ts      — event streaming
├── auth/
│   ├── hmac.ts        — HMAC signing
│   └── api-key.ts     — API key auth
└── index.ts           — main export

openspawn-py (Python)
├── client.py          — async + sync HTTP client
├── resources/
│   ├── agents.py
│   ├── tasks.py
│   ├── credits.py
│   ├── messages.py
│   └── events.py
├── auth/
│   ├── hmac.py
│   └── api_key.py
├── adapters/
│   ├── langchain.py   — callback handler
│   └── crewai.py      — crew integration
└── __init__.py
```

---

## 6. Competitive Analysis

### What Exists Today

| Platform               | Focus                     | vs. BikiniBottom                                          |
| ---------------------- | ------------------------- | --------------------------------------------------------- |
| **CrewAI**             | Agent execution framework | Execution, not governance. No credits, no approval gates. |
| **LangGraph**          | Agent graph orchestration | Powerful execution, no organizational layer.              |
| **AutoGen**            | Multi-agent conversation  | Research-oriented, no production governance.              |
| **Fixie / Letta**      | Agent hosting             | Hosted, not self-hosted. Limited coordination.            |
| **Relevance AI**       | Agent workforce           | SaaS, not self-hosted. No economic layer.                 |
| **Crew.ai Enterprise** | Managed agent teams       | Closest competitor, but SaaS and locked to CrewAI.        |

### Our Differentiation

1. **Self-hosted + open source** — No one else does governance + economy + self-hosted
2. **Framework-agnostic** — Not locked to one agent framework
3. **MCP-native** — First-mover on MCP as coordination protocol
4. **Economic layer** — Credits as first-class concept (not just rate limits)
5. **Pre-hooks** — Governance middleware that no one else has

---

## 7. Things to Consider

### Build vs. Integrate

- **Build:** Core SDKs, GitHub integration, webhooks — these are core to the value prop
- **Integrate:** Observability (use OTEL, don't build a dashboard), messaging (use OpenClaw, don't build a Slack bot)
- **Enable:** Marketplace, federation — design the architecture now, build later

### Community & Adoption

- **GitHub stars** are vanity, but they drive discovery. Invest in README, docs, demo.
- **Discord/community** for early adopters. They'll tell us what integrations matter.
- **Blog posts / case studies** showing real agent teams using BikiniBottom.
- **Conference talks** — MCP, agent coordination, the "AI workforce" narrative.

### Pricing (When the Time Comes)

BikiniBottom core stays MIT open source. Revenue options:

- **BikiniBottom Cloud** — hosted version for teams who don't want to self-host
- **Enterprise features** — SSO, RBAC, SLA, audit compliance, support
- **Marketplace fees** — percentage of cross-org agent transactions
- **Consulting** — help teams set up agent organizations

### Risks

- **MCP adoption stalls** → Mitigate by supporting REST/GraphQL equally
- **Framework consolidation** → If one framework wins, be sure we integrate deeply with it
- **"Good enough" built-in** → Claude/OpenAI add their own coordination → Differentiate on self-hosted + economic layer
- **Complexity creep** → Keep the core simple. Integrations are optional plugins.

---

## 8. Summary

**Short version:** BikiniBottom should become the **coordination standard** for AI agent teams. The path:

1. **SDKs** make us accessible to every framework
2. **GitHub** makes us immediately useful for dev teams
3. **Webhooks + OTEL** make us observable and connectable
4. **OpenClaw integration** serves our core community
5. **Framework adapters** expand the market
6. **Marketplace** is the endgame

The architecture should be **provider-based** so integrations are modular. The brand should be **protocol-first** so we're framework-agnostic. The strategy should be **developer-first** because developers adopt infrastructure bottom-up.

---

_This is a living document. Update as the market evolves and we learn from users._
