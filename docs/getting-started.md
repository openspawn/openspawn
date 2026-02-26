---
purpose: Get a human or agent from zero to a running OpenSpawn org
audience: developers, AI agents
prerequisites: Node.js 18+
time_estimate: 10 minutes
difficulty: beginner
---

# Getting Started with OpenSpawn

**What you'll have in ~10 minutes:** a local org of AI agents, coordinated by a markdown file, visible in a real-time dashboard — with tasks flowing through a hierarchy you define.

## What is OpenSpawn?

OpenSpawn is a **coordination layer for AI agents**. It is not an agent framework — you keep using whatever you're using (OpenClaw, LangGraph, Claude Code, raw API calls). OpenSpawn adds the layer most multi-agent systems are missing: *structure*.

```
ORG.md  →  OpenSpawn parses it  →  agents spawn  →  tasks flow through hierarchy  →  dashboard shows everything
```

> **Q: How is this different from CrewAI / LangGraph / AutoGen?**
> - Those are agent frameworks (they build agents). OpenSpawn is a coordination layer (it organizes agents). Use them together.

> **Q: Do I need to rewrite my agents?**
> - No. OpenSpawn coordinates your existing agents via standard protocols (MCP, A2A).

---

## Do I need OpenSpawn?

```
Do you have multiple agents that need to work together?
├── YES
│   Do they need persistent roles, hierarchy, and budgets?
│   ├── YES → Use OpenSpawn
│   └── NO → Sub-agents (sessions_spawn) may be enough
└── NO → You probably don't need OpenSpawn yet
```

---

## Prerequisites

**Required:**
- Node.js 18+ (`node --version` to check)

**Optional (for real model inference):**
- [Ollama](https://ollama.ai) — free local models (workers use `qwen2.5` at zero cost)
- [Groq](https://groq.com) API key — fast inference for mid-tier agents
- [OpenRouter](https://openrouter.ai) API key — Claude/GPT-4o for executives

> **Q: Do I need API keys to try it?**
> - No. Demo/simulation mode works without any API keys. You see the full coordination flow.

---

## Step 1 — Scaffold your org

```bash
npx openspawn init my-org
cd my-org
```

This creates:

```
my-org/
├── ORG.md                  # Your org definition (the important one)
├── openspawn.config.json   # Server config (port, model providers)
└── .gitignore
```

> **Q: Can I skip the wizard?**
> ```bash
> openspawn init my-org --template=assistant-team --non-interactive
> ```

> **Q: What templates are available?**
> | Template | Best for |
> |----------|----------|
> | `assistant-team` | Solo operator who needs a full team |
> | `content-agency` | Content production pipeline |
> | `dev-shop` | Software development team |
> | `research-lab` | Research & analysis |

---

## Step 2 — Review your ORG.md

Open `ORG.md`. You'll see five sections:

| Section | Purpose | Required? |
|---------|---------|-----------|
| `## Identity` | Name, mission, values | No |
| `## Culture` | Communication norms, preset | No |
| `## Structure` | Agent roles and hierarchy | **Yes** |
| `## Policies` | Budgets, caps, permissions | No |
| `## Playbooks` | Step-by-step procedures | No |

Each agent in Structure looks like:

```markdown
### Oscar — Chief of Staff
The coordinator. Manages priorities, delegates to specialists.
- **Level:** 10
- **Domain:** Operations
- **Reports to:** Human Principal
```

> **Q: What do levels mean?**
> - L1-L5: Workers
> - L6: Can review/approve
> - L7-L9: Can create tasks and spawn agents
> - L10: Executive

> **Q: What's "Reports to"?**
> - The escalation chain. Blocked agents escalate to their manager. Never skip levels.

---

## Step 3 — Validate

```bash
openspawn validate
```

Expected output:
```
✅ ORG.md is valid

  Organization:  My Org
  Agents:        8
  Culture:       startup
```

### Error recovery

| Error | Fix |
|-------|-----|
| `Cannot read ORG.md` | Make sure you're in the right directory: `ls ORG.md` |
| `Missing Structure section` | Add `## Structure` with at least one agent |
| `Agent reports to unknown agent` | Check spelling in `Reports to` — must match an agent name exactly |
| `No top-level agent` | One agent needs `Reports to: Human Principal` |

---

## Step 4 — Preview

```bash
npx openspawn preview
```

Opens the dashboard at http://localhost:3333. You'll see:
- Network graph of your agent hierarchy
- Task timeline
- Agent details and credit balances
- Real-time SSE event stream

> **Q: Port 3333 is in use?**
> ```bash
> # Option 1: Kill the existing process
> lsof -i :3333
> kill <PID>
>
> # Option 2: Change port in openspawn.config.json
> { "port": 3334 }
> ```

---

## Step 5 — Customize

### Change the culture preset

```markdown
## Culture
preset: agency
```

| Preset | Escalation | Progress | Hierarchy depth |
|--------|-----------|----------|-----------------|
| `startup` | Immediate | Frequent | 2-3 levels |
| `enterprise` | Batched | On phase change | 5-8 levels |
| `agency` | Immediate | Every tick | 3-4 levels |
| `research` | Delayed | On request | 2-3 levels |
| `military` | Immediate | Every tick | Strict chain |
| `remote-async` | Delayed | On request | Flat |

### Add an agent

Add under `## Structure`:

```markdown
#### DataBot — Data Analyst
Crunches numbers, builds dashboards, surfaces insights.
- **Level:** 4
- **Domain:** Analytics
- **Reports to:** Oscar
```

### Set budget policies

```markdown
## Policies

### Budget
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
```

### Write a playbook

```markdown
## Playbooks

### New Feature Request
1. Oscar receives request from Human Principal
2. Oscar delegates to Forge (engineering)
3. Forge breaks into sub-tasks, assigns to available agents
4. Each agent ACKs and begins work
5. On completion, results flow back up the chain
```

---

## Step 6 — Connect real models (optional)

Edit `openspawn.config.json`:

```json
{
  "port": 3333,
  "orgFile": "ORG.md",
  "models": {
    "ollama": { "enabled": true, "baseUrl": "http://localhost:11434" },
    "groq": { "apiKey": "gsk_..." },
    "openRouter": { "apiKey": "sk-or-..." }
  }
}
```

> **Q: Which model for which agent?**
> - L1-L5 workers: Ollama (`qwen2.5`) — free, local
> - L6-L8 leads: Groq — fast, cheap
> - L9-L10 executives: OpenRouter (Claude/GPT-4o) — best reasoning

---

## What's next?

- **Full CLI reference:** `openspawn --help`
- **All MCP tools:** See `docs/llms.txt`
- **Templates deep dive:** See `docs/templates-guide.md`
- **Live demo:** https://bikinibottom.ai/app/ (22 agents, 5 departments)
- **ORG.md spec:** https://bikinibottom.ai/org-md
