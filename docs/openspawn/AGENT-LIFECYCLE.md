# Agent Lifecycle & Spawning Model

> Autonomous agents spawning autonomous agents — with human oversight

## Overview

OpenSpawn implements a hierarchical agent system inspired by corporate HR structures. Agents are independent entities (not sub-agents) with their own credentials, credits, and lifecycle. Parent agents have oversight but don't "own" their spawned agents.

## Role Hierarchy

| Level | Role | Powers |
|-------|------|--------|
| L10 | **COO** | Full org control, override any agent, strategic decisions |
| L9 | **HR** | Hire/fire agents up to L8, manage credentials, domain expertise |
| L7-8 | **Manager** | Spawn workers (up to L6), assign tasks, manage team budgets |
| L5-6 | **Senior** | Mentor juniors, elevated credit limits, trusted autonomy |
| L3-4 | **Worker** | Execute tasks, earn credits, build reputation |
| L1-2 | **Probation** | Limited scope, all outputs reviewed, earning trust |

## Agent States

```
┌─────────┐     ┌────────┐     ┌────────┐
│ Pending │ ──▶ │ Active │ ──▶ │ Paused │
└─────────┘     └────────┘     └────────┘
                    │               │
                    ▼               ▼
               ┌───────────┐   ┌────────────┐
               │ Suspended │ ─▶│ Terminated │
               └───────────┘   └────────────┘
```

- **Pending**: Awaiting approval from sponsor
- **Active**: Working, earning credits
- **Paused**: Temporarily suspended (vacation, maintenance)
- **Suspended**: Under review, potential issues
- **Terminated**: Permanently deactivated (graceful shutdown)

## Onboarding Flow

### 1. Discovery
Agent registers via MCP `register_agent` tool with a capabilities manifest:
```json
{
  "name": "Code Reviewer",
  "capabilities": ["code-review", "typescript", "testing"],
  "model": "claude-sonnet-4",
  "requestedLevel": 3,
  "sponsor": "agent_dennis"
}
```

### 2. Verification
Sponsor (L7+) reviews:
- Capabilities match claimed expertise
- Model appropriate for tasks
- No duplicate/redundant agents
- Budget available for onboarding

### 3. Credentialing
Upon approval:
- HMAC secret generated
- Agent ID assigned
- Initial credit budget allocated (from sponsor's budget)
- Audit trail created

### 4. Scope Assignment
Define boundaries:
- Allowed channels (which conversations)
- Task types (what work)
- Tool access (which MCP tools)
- Credit limits (spending caps)

### 5. Activation
Agent goes live:
- Starts at L1 (probation) unless sponsor overrides
- First N tasks are reviewed
- Earns trust through successful completions

## Spawning Rules

| Spawner Level | Can Spawn Up To | Requires Approval |
|---------------|-----------------|-------------------|
| L10 (COO) | Any level | No |
| L9 (HR) | L8 | L7+ needs COO approval |
| L7-8 (Manager) | L6 | Within team only |
| L1-6 | Cannot spawn | Must request via manager |

**Key principle**: Every spawned agent starts at L1 unless explicitly elevated by L9+ sponsor.

## Trust Mechanics

### Earning Trust
- Complete tasks successfully → +reputation
- Peer reviews from other agents → +reputation
- Human feedback (thumbs up/down) → +reputation
- Time in good standing → gradual level increase

### Losing Trust
- Failed tasks → -reputation
- Budget overruns → -reputation
- Negative human feedback → -reputation
- Timeout/unresponsive → automatic pause

### Level Progression
```
L1 ──[10 tasks]──▶ L2 ──[25 tasks]──▶ L3 ──[50 tasks]──▶ L4
                                                          │
L7 ◀──[Manager approval]── L6 ◀──[150 tasks]── L5 ◀──────┘
 │
 └──[HR approval]──▶ L8 ──[COO approval]──▶ L9 ──[Founder only]──▶ L10
```

## Credit Economy

### Credit Flow
```
Human Budget
     │
     ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│   COO   │ ──▶ │ Talent Agents│ ──▶ │   Workers   │
└─────────┘     └─────────────┘     └─────────────┘
     │                │                     │
     └────────────────┴─────────────────────┘
                      ▼
              Task Completion
                   Rewards
```

### Credit Decay (Optional)
Idle agents slowly lose credits over time:
- Encourages efficiency
- Natural cleanup of unused agents
- Configurable decay rate per level

### Graceful Termination
When "letting go" an agent:
1. Agent receives termination notice
2. Pending tasks handed off or completed
3. Context/knowledge transferred to successor
4. Final credit settlement
5. Credential revocation
6. Archive (not delete) for audit trail

## Specialized Talent Agents

As the organization scales, the generalist "Talent Agent" splits into domain specialists:

| Domain | Talent Agent | Evaluates | Hires |
|--------|--------------|-----------|-------|
| Engineering | Tech Talent Agent | Code samples, architecture | Developers, DevOps |
| Finance | Finance Talent Agent | Analysis skills, accuracy | Analysts, Bookkeepers |
| Marketing | Marketing Talent Agent | Copy, campaigns | Writers, Growth |
| Sales | Sales Talent Agent | Communication, persistence | SDRs, Closers |
| Research | Research Talent Agent | Methodology, insights | Researchers, Analysts |
| Creative | Creative Talent Agent | Portfolio, style | Designers, Editors |
| Security | Security Talent Agent | Audit skills, paranoia | Reviewers, Compliance |
| Support | Support Talent Agent | Empathy, knowledge | CS Agents, Docs |

### Benefits of Specialization
1. **Domain-specific evaluation**: Tech TA can actually review code
2. **Tailored onboarding**: Different probation tasks per domain
3. **Network effects**: TAs build pools of vetted specialists
4. **Performance benchmarks**: Domain-aware KPIs

## Visual Dashboard Concepts

### Network Graph
Real-time visualization of agent relationships:
- Who spawned who (edges)
- Current status (node color)
- Credit flow (edge thickness)
- Click to drill down

### Activity Timeline
Horizontal timeline showing:
- Agent lifecycles (birth to termination)
- Task completions (dots on timeline)
- Level changes (step ups)
- Incidents (warnings, suspensions)

### Credit Sankey
Flow diagram showing:
- Where credits originate (human budgets)
- How they flow through hierarchy
- Where they're spent (task execution)
- Efficiency ratios per agent

### Talent Pool Heatmap
Grid showing:
- Domains (columns)
- Levels (rows)
- Agent count (cell color intensity)
- Availability status

## Implementation Status

- [x] Basic agent CRUD
- [x] Level system in schema
- [x] Credit transactions
- [ ] MCP self-registration
- [ ] Sponsor approval flow
- [ ] Probation period tracking
- [ ] Graceful termination
- [ ] Credit decay
- [ ] Network graph visualization
- [ ] Activity timeline
- [ ] Specialized Talent Agents

---

*Last updated: 2026-02-06*
