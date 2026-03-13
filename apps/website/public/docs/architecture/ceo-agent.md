---
source: https://openspawn.ai/docs/architecture/ceo-agent
generated: 2026-03-13
---
> A real agent organization running on real infrastructure — the bridge between OpenSpawn's simulation and production multi-agent systems.

## 1. Vision

The CEO Agent is a living proof-of-concept: an AI agent that runs its own organization. It receives goals from a human, plans a team, hires agents, delegates work, monitors progress, and adapts — all using the ORG.md / ACP model that OpenSpawn defines.

Unlike the BikiniBottom demo (simulated agents in a sandbox), the CEO Agent runs **real agents** on real infrastructure. Each agent has persistent identity, memory, tools, and ongoing sessions. This is OpenSpawn's thesis made tangible.

### What it proves

1. **ORG.md works for real orgs** — not just simulations
2. **ACP scales beyond demos** — real agents communicating with structured protocols
3. **Agent lifecycle management is a product** — hiring, firing, restructuring agents needs tooling
4. **The architecture scales** — from local gateway to multi-gateway to cross-platform A2A

---

## 2. Infrastructure

### 2.1 Docker Container (Self-Contained Gateway)

The CEO Agent runs inside a Docker container on the host machine. The container is its own "machine" — running its own OpenClaw gateway with its own config, state, and agents.

```
Host Machine (Mac Mini / VPS)
├── Host OpenClaw Gateway (port 18789)
│   ├── Dennis (COO agent)
│   └── Eve (concierge agent)
│
└── Docker Container (port 18809)
    └── CEO's OpenClaw Gateway
        ├── CEO (main agent, orchestrator)
        ├── Eng Lead (hired by CEO)
        ├── Research Agent (hired by CEO)
        └── ... (org grows over time)
```

**Why Docker, not a second gateway on the host:**

- Respects "one gateway per machine" — the container IS its own machine
- True process/filesystem isolation from the host gateway
- Self-contained and portable — move to any Docker host
- Easy to destroy and rebuild during experimentation
- Resource-limited (memory, CPU caps)

### 2.2 Docker Compose

```yaml
services:
  ceo-gateway:
    image: openclaw:local
    container_name: ceo-org-gateway
    ports:
      - "18809:18789"
    volumes:
      # OpenClaw config + state (persistent)
      - ${HOME}/.openclaw-ceo:/home/node/.openclaw

      # OpenSpawn codebase (git worktree for isolated branch)
      - ${HOME}/github/openspawn/openspawn-ceo:/home/node/openspawn

      # Git credentials for push (read-only)
      - ${HOME}/.ssh:/home/node/.ssh:ro
      - ${HOME}/.gitconfig:/home/node/.gitconfig:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2g
          cpus: "2.0"
```

### 2.3 OpenSpawn Codebase Mount

The CEO has access to the OpenSpawn codebase for two reasons:

1. **To work on it** — the CEO is a developer, not just a manager
2. **To use it** — the ORG.md spec, ACP protocol, and org-parser are reference material

**Approach: Git worktree**

```bash
cd ~/github/openspawn/openspawn
git worktree add ~/github/openspawn/openspawn-ceo ceo-workspace
```

This creates a separate working tree on its own branch (`ceo-workspace`). The CEO can:

- Read and reference all source code
- Make changes on its own branch
- Commit and push without conflicting with other developers
- Open PRs against `main`

If the worktree gets messy: `git worktree remove` and recreate.

**Alternatives considered:**

| Approach                | Verdict                                      |
| ----------------------- | -------------------------------------------- |
| Mount repo rw directly  | Risk of git conflicts with other developers  |
| Mount repo ro           | CEO can't edit or commit                     |
| Clone inside container  | Not live, ephemeral without volume, diverges |
| Mount build output only | CEO can't see source code                    |

---

## 3. Agent Lifecycle

### 3.1 How Hiring Works

The CEO creates full, persistent agents — not ephemeral sub-agents. Each agent has its own workspace, identity, memory, and ongoing sessions.

**Phase 1: Planning (CEO alone, no disruption risk)**

```
Adam: "Build an engineering team to improve the org-parser"
  ↓
CEO plans the org:
  - Engineering Lead (L7, delegates, reviews)
  - 2x Senior Devs (L6, implements)
  - QA Agent (L4, tests)

CEO writes ORG.md with planned structure
CEO presents hiring plan to Adam for approval
```

**Phase 2: Hiring Event (CEO is only agent, restart is safe)**

The CEO executes the hiring event — a batch operation:

1. **Create workspaces** for each new agent:

   ```bash
   mkdir -p ~/.openclaw/workspace-eng-lead
   # Write SOUL.md, AGENTS.md, TOOLS.md, USER.md
   ```

2. **Update gateway config** to register the agents:

   ```json
   {
     "agents": {
       "list": [
         { "id": "main", "default": true },
         { "id": "eng-lead", "workspace": "~/.openclaw/workspace-eng-lead" },
         { "id": "senior-dev-1", "workspace": "..." },
         { "id": "senior-dev-2", "workspace": "..." },
         { "id": "qa-agent", "workspace": "..." }
       ]
     }
   }
   ```

3. **Restart gateway** to activate new agents

4. **Onboard** each agent via `sessions_send`:
   ```
   CEO → eng-lead: "Welcome. You are the Engineering Lead.
   Your first task: review the org-parser codebase and identify
   areas for improvement. Report back with a plan."
   ```

**Phase 3: Team Working (restarts are disruptive)**

Once agents are working, restarts disrupt in-flight work. Growth requires coordination:

1. CEO tells the team: "Wrap up current tasks — new hires incoming"
2. CEO waits for a natural break (tasks completed, no in-flight work)
3. CEO does the hiring event (config update + restart)
4. CEO onboards new agents
5. Work resumes

This mirrors real orgs: you don't hire mid-sprint. You plan headcount, onboard in batches, and coordinate timing.

### 3.2 How Agents Communicate

All agent communication uses OpenClaw's `sessions_send` tool, structured according to ACP:

| Action                   | Tool               | ACP Message Type       |
| ------------------------ | ------------------ | ---------------------- |
| CEO assigns task to lead | `sessions_send`    | `delegation`           |
| Lead acknowledges        | `sessions_send`    | `ack`                  |
| Worker reports progress  | `sessions_send`    | `progress`             |
| Worker is blocked        | `sessions_send`    | `escalation`           |
| Worker finishes task     | `sessions_send`    | `completion`           |
| CEO checks on agent      | `sessions_history` | (read-only)            |
| CEO redirects agent      | `sessions_send`    | `delegation` (updated) |

The CEO's SOUL.md teaches it to use ACP message formats. Each agent's SOUL.md teaches it to respond with ACP-structured messages. The protocol is enforced by convention (agent instructions), not by code — initially.

### 3.3 How the CEO Monitors

```
sessions_list     → See all active agents and their session status
sessions_history  → Read an agent's recent conversation/work
sessions_send     → Send a message or redirect an agent
```

The CEO can build a mental model of org health by periodically checking:

- Which agents are active/idle
- What each agent is working on (via history)
- Whether any agents are stuck (no recent activity)
- Task completion status (via agent reports)

### 3.4 Sub-Agents Still Have a Role

Full agents handle persistent, ongoing responsibilities. Sub-agents (`sessions_spawn`) handle burst work:

| Use Case                                    | Full Agent | Sub-Agent |
| ------------------------------------------- | ---------- | --------- |
| Engineering Lead (ongoing role)             | ✅         | ❌        |
| "Research competitor X" (one-off)           | ❌         | ✅        |
| QA Agent (ongoing testing)                  | ✅         | ❌        |
| "Run 5 parallel benchmarks" (burst)         | ❌         | ✅        |
| Senior Dev (accumulates codebase knowledge) | ✅         | ❌        |
| "Summarize this 100-page doc" (one-off)     | ❌         | ✅        |

Full agents and sub-agents coexist. The CEO uses full agents for its team and sub-agents for ad-hoc work — just like a real CEO has permanent reports AND hires consultants.

---

## 4. Scaling: Local → Remote → External

The CEO's "hiring" model naturally extends beyond a single gateway.

### 4.1 Tier 1: Local Agents (Same Gateway)

```
CEO → sessions_send → Eng Lead
      (internal, instant, shared state)
```

- Created via gateway config + restart
- Communication via `sessions_send`
- Shared filesystem, shared LLM credentials
- Lowest latency, simplest setup

### 4.2 Tier 2: Remote Agents (Different OpenClaw Gateway)

```
CEO → A2A HTTP → Remote Gateway → Remote Agent
      (cross-machine, structured protocol)
```

- Agent runs on a different OpenClaw instance (another VPS, another container)
- Communication via A2A protocol (JSON-RPC over HTTP)
- Each gateway exposes `/.well-known/agent.json` describing its agents
- CEO discovers available agents via Agent Cards
- Independent scaling — own resources, own LLM keys

**When to use Tier 2:**

- Team is too large for one gateway (resource limits)
- Want geographic distribution (agents closer to data/services)
- Want cost isolation (separate LLM billing per team)
- Want fault isolation (engineering team going down doesn't affect research)

### 4.3 Tier 3: External Agents (Non-OpenClaw Platforms)

```
CEO → A2A HTTP → External Platform → External Agent
      (cross-platform, vendor-agnostic)
```

- Agent runs on CrewAI, LangGraph, AutoGen, or any A2A-compatible service
- Communication via the same A2A protocol
- CEO doesn't know or care what platform it runs on
- Discovered via public Agent Card registries or explicit URLs

**When to use Tier 3:**

- Specialized capability not available on OpenClaw (e.g., a vision model pipeline on a GPU platform)
- Third-party agent services (code review, security scanning, compliance)
- Multi-vendor strategy

### 4.4 The CEO's Unified Interface

The CEO's ORG.md describes agents regardless of where they run:

```markdown
## Structure

### Engineering

#### Alice — Engineering Lead

- **Location:** local
- **Communication:** sessions_send (agent id: eng-lead)

#### Bob — Senior Dev

- **Location:** remote
- **Communication:** A2A (https://eng-cluster.example.com)
- **Agent Card:** /.well-known/agent.json#bob

#### CodeReview Service

- **Location:** external
- **Communication:** A2A (https://codereview.ai)
- **Agent Card:** /.well-known/agent.json
```

**What OpenSpawn builds:** A unified communication layer that wraps `sessions_send` (local) and A2A HTTP (remote/external) behind a single interface. The CEO says "send task to eng-lead" and OpenSpawn routes it — the CEO doesn't manage transport.

### 4.5 Scaling Phases

| Phase          | Real Company Analogy   | Agent Org                                           |
| -------------- | ---------------------- | --------------------------------------------------- |
| **Seed**       | Founder alone          | CEO agent, no team yet                              |
| **Startup**    | Everyone in one room   | Single gateway, 3-5 local agents                    |
| **Growth**     | Multiple offices       | Multiple gateways, A2A between them                 |
| **Scale**      | Contractors + agencies | External A2A agents from other platforms            |
| **Enterprise** | Global org + partners  | Hundreds of agents across many gateways + platforms |

The architecture doesn't change between phases — only the transport layer expands. ORG.md, ACP, and the CEO's delegation patterns stay identical.

---

## 5. CEO Agent Design

### 5.1 Gateway Config

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2,
        maxChildrenPerAgent: 5,
        maxConcurrent: 8,
        model: "sonnet",
        thinking: "low",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        tools: { profile: "full" },
        // CEO runs on Opus for strategic reasoning
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "<CEO bot token from BotFather>",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

### 5.2 Workspace Structure

```
~/.openclaw-ceo/
├── openclaw.json
├── workspace/
│   ├── SOUL.md              # CEO personality, delegation philosophy
│   ├── AGENTS.md            # Operational instructions
│   ├── IDENTITY.md          # "I am the CEO Agent"
│   ├── USER.md              # About Adam
│   ├── TOOLS.md             # Local notes, paths, SSH details
│   ├── MEMORY.md            # Long-term memory
│   ├── HEARTBEAT.md         # Periodic checks (agent health, progress)
│   ├── ORG.md               # Living org chart (updated as team grows)
│   └── memory/              # Daily logs
└── agents/
    └── main/
        └── agent/
            └── auth-profiles.json
```

### 5.3 SOUL.md (CEO)

The CEO's SOUL.md teaches it to:

1. Think strategically about team composition
2. Plan before hiring (write ORG.md first)
3. Use ACP message formats for all communication
4. Batch hiring events to minimize disruption
5. Monitor agent health via `sessions_list` / `sessions_history`
6. Use sub-agents for one-off tasks, full agents for persistent roles
7. Manage the gateway config for hiring/firing
8. Report progress to Adam via Telegram

### 5.4 ORG.md (Living Document)

Starts empty. CEO builds it through planning:

```markdown
# CEO Agent Org

## Identity

An experimental agent organization testing the OpenSpawn model
with real infrastructure.

## Culture

preset: startup

- **Escalation:** immediate
- **Progress updates:** on phase change

## Structure

### CEO (main)

Receives goals from Adam. Plans the org. Delegates work.
Monitors progress. Adapts the team as needed.

## Policies

### Headcount

- Current: 1 (CEO only)
- Approved: 0 (pending first planning session)
- Max: 10

### Hiring Process

1. CEO identifies need and writes job description
2. CEO presents hiring plan to Adam
3. Adam approves headcount
4. CEO executes hiring event (config + restart + onboarding)
```

This evolves as the CEO hires:

```markdown
## Structure

### CEO (main) — active

...

### Engineering

#### Eng Lead — active

Triages engineering tasks. Delegates to devs. Reviews output.

- **Level:** 7
- **Agent ID:** eng-lead

#### Senior Dev 1 — active

Backend implementation. API design. Database work.

- **Level:** 6
- **Agent ID:** senior-dev-1

### Research

#### Research Agent — active

Market research, competitive analysis, technical exploration.

- **Level:** 6
- **Agent ID:** research-agent
```

---

## 6. What OpenSpawn Builds

This architecture exposes gaps that become OpenSpawn features:

### 6.1 Agent Lifecycle Manager

**The gap:** Creating an agent requires mkdir + write 5 files + config.patch + restart. This is manual and error-prone.

**The feature:** `openspawn start` handles agent lifecycle automatically. The API seeder parses ORG.md, provisions workspaces, and spawns Claude Code CLI subprocesses with a configurable concurrency cap.

```python
# Seeder reads ORG.md → creates agent records in SQLite/PostgreSQL
# Spawner manages Claude Code subprocesses per agent
# Concurrency cap prevents resource exhaustion
# Asyncio scheduler handles SLA monitoring, escalation, status sync
```

Agent lifecycle is managed through ORG.md edits + restart — no separate hire/fire commands needed.

### 6.2 Hot-Reload Agent Management

**The gap:** Gateway restart disrupts all agents when adding new ones.

**The feature:** Hot-add agents without restarting. The gateway picks up new agent entries dynamically.

Priority: **Critical** — this is the single biggest friction point.

### 6.3 Unified Communication Router

**The gap:** Local agents use `sessions_send`, remote agents use A2A HTTP. The CEO has to know which transport to use.

**The feature:** A single `send` interface that routes based on agent location.

```typescript
// CEO just says "send to eng-lead" — router handles transport
await orgRouter.send("eng-lead", {
  type: "delegation",
  taskId: "TASK-0042",
  body: "Review the org-parser tests",
});
// Router checks: is eng-lead local? → sessions_send
//                 is eng-lead remote? → A2A HTTP
//                 is eng-lead external? → A2A HTTP to external endpoint
```

### 6.4 ORG.md Deployer

**The gap:** ORG.md is a spec, not a runtime. There's no tool that reads an ORG.md and provisions real agents from it.

**The feature:** `openspawn start` reads the org chart via the Python API seeder and:

- Parses ORG.md structure, hierarchy, and policies
- Creates agent records in SQLite (or PostgreSQL in production)
- Provisions per-agent workspaces with SOUL.md and AGENTS.md
- Spawns Claude Code CLI subprocesses for each agent
- Starts the asyncio scheduler for background coordination jobs

### 6.5 Org Health Dashboard

**The gap:** CEO manually checks `sessions_list` and `sessions_history`. No aggregate view.

**The feature:** A dashboard showing:

- Agent status (active/idle/stuck)
- Task pipeline (queued → in progress → done)
- Communication flow (ACP message visualization)
- Escalation rate and bottlenecks
- Cost per agent/team

---

## 7. Implementation Roadmap

### Phase 1: Docker + CEO (Week 1)

- [ ] Build OpenClaw Docker image
- [ ] Create docker-compose.yml
- [ ] Create CEO workspace (SOUL.md, AGENTS.md, ORG.md, etc.)
- [ ] Create Telegram bot for CEO
- [ ] Run onboarding, start gateway
- [ ] Test: Adam ↔ CEO conversation via Telegram

### Phase 2: First Hire (Week 1-2)

- [ ] CEO plans org with Adam
- [ ] CEO executes first hiring event (1-2 agents)
- [ ] CEO onboards agents via sessions_send
- [ ] Test: CEO delegates task → agent works → reports back
- [ ] Iterate on ACP message format

### Phase 3: Working Org (Week 2-3)

- [ ] Team of 3-5 agents working on real tasks (OpenSpawn improvements)
- [ ] CEO monitors via sessions_list / sessions_history
- [ ] Test escalation flow (agent gets stuck → CEO helps)
- [ ] CEO uses sub-agents for ad-hoc tasks alongside full agents

### Phase 4: OpenSpawn Tooling (Week 3-4)

- [ ] Refine agent spawning (concurrency cap tuning, graceful shutdown)
- [ ] Build unified communication router (local + A2A)
- [ ] Prototype hot-reload agent management
- [ ] Build org health monitoring

### Phase 5: Multi-Gateway (Future)

- [ ] Spin up second gateway (VPS or another container)
- [ ] CEO hires remote agents via A2A
- [ ] Test cross-gateway communication
- [ ] Validate ORG.md with mixed local/remote agents

### Phase 6: External A2A (Future)

- [ ] Integrate with external A2A-compatible agent services
- [ ] CEO discovers and hires external agents
- [ ] Test cross-platform delegation

---

## 8. Key Decisions

| Decision        | Choice                            | Rationale                                           |
| --------------- | --------------------------------- | --------------------------------------------------- |
| Runtime         | Docker container                  | Isolation, portability, self-contained              |
| Codebase access | Git worktree (rw)                 | Separate branch, no conflicts, can commit/push      |
| Agent type      | Full agents (not sub-agents)      | Persistent identity, memory, expertise accumulation |
| Communication   | ACP over sessions_send            | Structured protocol, matches OpenSpawn spec         |
| Hiring model    | Planned batches with restart      | Mirrors real orgs, minimizes disruption             |
| Scaling model   | Local → A2A remote → A2A external | Same interface at every scale                       |
| CEO model       | Opus                              | Strategic reasoning needs highest capability        |
| Worker model    | Sonnet                            | Cost-effective for execution tasks                  |

---

_The CEO Agent is not a demo. It's the first real deployment of the OpenSpawn model — and every friction point it hits becomes a feature to build._
