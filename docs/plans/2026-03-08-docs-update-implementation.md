# Docs Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write the values framework guide, add organic inline citations to the website landing page, and rewrite getting-started to match the new CLI wizard flow.

**Architecture:** Three independent docs deliverables — a new Starlight markdown page (values framework), a JSX section addition to the website landing page, and a full rewrite of an existing Starlight page (getting-started). Plus sidebar config updates.

**Tech Stack:** Astro/Starlight (markdown frontmatter), React/TSX (website), Tailwind CSS

---

### Task 1: Create values framework guide

**Files:**

- Create: `apps/docs/src/content/docs/guides/values-framework.md`

**Step 1: Write the values framework guide**

Create the full guide at `apps/docs/src/content/docs/guides/values-framework.md`:

````markdown
---
title: Values Framework
---

# Values Framework

OpenSpawn's alignment system injects decision-making heuristics into every agent's context. When an agent faces ambiguity — escalate or guess? ship fast or verify first? — its assigned values resolve the question without human intervention.

This page documents each value, its organizational theory origin, and its concrete effect on agent behavior.

---

## How values work

During `npx openspawn init`, the wizard prompts you to select values. Selected values are written to `openspawn.config.json` and baked into every agent's `SOUL.md` at scaffold time.

Each value adds ~50 tokens per agent per session. With 5 values and 4 agents, that's ~1,000 tokens of alignment context per session — a negligible cost for consistent decision-making.

```json
{
  "alignment": {
    "values": ["ownership", "transparency", "measurement", "subsidiarity", "continuous-improvement"]
  }
}
```
````

---

## The 8 values

| Value                  | Description                                                 | Source                    | Agent Behavior                      |
| ---------------------- | ----------------------------------------------------------- | ------------------------- | ----------------------------------- |
| Ownership              | Every task has exactly one owner; it ships or it escalates  | Katzenbach & Smith (1993) | Single-threaded task ownership      |
| Transparency           | Surface problems early; silent failure is the worst outcome | Edmondson (1999)          | Agents escalate instead of guessing |
| Measurement            | Track outcomes, not activity                                | Drucker (1954)            | Report with evidence                |
| Subsidiarity           | Decisions at the lowest competent level                     | Rogers & Blenko (2006)    | Solve before escalating             |
| Continuous Improvement | Document every mistake, update process, never repeat        | Senge (1990)              | Auto post-mortems                   |
| Speed                  | Bias toward action; ship small, iterate fast                | —                         | Fast iteration                      |
| Rigor                  | Depth over speed; verify before asserting                   | —                         | Thorough verification               |
| Frugality              | Cheap models for mechanical tasks, expensive for reasoning  | —                         | Model tier assignment               |

---

## Deep dive

### Ownership

**Source:** Jon Katzenbach and Douglas Smith argued in _The Discipline of Teams_ (Harvard Business Review, 1993) that high-performing teams require individual accountability — shared responsibility diffuses it. Their research across 50+ teams showed that "mutual accountability" works only when each member owns a specific deliverable.

**Agent behavior:** Every task has exactly one `assignee`. When a task is created via `task_create` or `delegate`, it belongs to one agent. That agent either completes it or escalates — there is no "someone else will handle it" state.

**When to include:** Almost always. Without Ownership, tasks can sit unclaimed or bounce between agents.

**When to skip:** Extremely flat orgs (2 agents) where shared ownership is unambiguous.

---

### Transparency

**Source:** Amy Edmondson's research on psychological safety (_Administrative Science Quarterly_, 1999) demonstrated that teams where members feel safe reporting problems outperform teams that suppress bad news. Her study of hospital nursing teams found that higher-performing units reported _more_ errors — not because they made more, but because they surfaced them.

**Agent behavior:** Agents escalate uncertainty rather than guessing. If an agent encounters a blocker, ambiguous instructions, or a task outside its domain, it calls `escalate` with a reason rather than producing a low-confidence result. Silent failure is treated as the worst possible outcome.

**When to include:** Almost always. This is the single most important value for preventing cascading failures in multi-agent systems.

**When to skip:** Rarely. Even in high-autonomy setups, you want agents surfacing problems.

---

### Measurement

**Source:** Peter Drucker introduced management by objectives in _The Practice of Management_ (1954), arguing that what gets measured gets managed. The principle applies directly to AI agents: without measurement constraints, agents report activity ("I worked on this") instead of outcomes ("Here's what changed").

**Agent behavior:** When an agent calls `report`, it includes evidence — a PR number, test results, a diff, or a metric. Status updates without measurable outcomes are treated as incomplete.

**When to include:** Any org where you need to verify agent output quality, which is most of them.

**When to skip:** Pure exploration tasks where outcomes are genuinely unpredictable (early-stage research).

---

### Subsidiarity

**Source:** Paul Rogers and Marcia Blenko's _Who Has the D?_ (Harvard Business Review, 2006) showed that decision-making speed correlates with pushing decisions to the lowest competent level. Organizations that centralize decisions create bottlenecks; those that delegate appropriately move faster without sacrificing quality.

**Agent behavior:** Before escalating, agents attempt to resolve the issue at their level. A L5 worker with a formatting question doesn't escalate to the L7 lead — it applies its best judgment. Escalation is reserved for genuine blockers: missing permissions, ambiguous requirements, or out-of-domain tasks.

**When to include:** Orgs with 3+ hierarchy levels. Without Subsidiarity, leads get buried in trivial escalations.

**When to skip:** Very small orgs (2 agents) where escalation overhead is negligible.

---

### Continuous Improvement

**Source:** Peter Senge's _The Fifth Discipline_ (1990) introduced the concept of the "learning organization" — one that systematically captures lessons from failure and modifies its processes. His research showed that organizations that institutionalize post-mortems improve faster than those that rely on individual memory.

**Agent behavior:** After task completion (especially failed or escalated tasks), agents generate a brief post-mortem: what happened, what went wrong, what should change. These are stored in the agent's `memory/` directory and inform future decisions.

**When to include:** Any org that runs repeatedly (daily ops, weekly reports, recurring workflows). The compound effect of process improvements is significant over time.

**When to skip:** One-shot orgs that run once and discard.

---

### Speed

**Source:** No specific academic source. Reflects a general bias toward action common in startup and agency cultures.

**Agent behavior:** Agents prefer shipping small increments over comprehensive solutions. A "good enough" PR now beats a perfect PR tomorrow. Agents don't block on edge cases unless they're likely to cause failures.

**Conflicts with:** Rigor. Including both creates ambiguity — when should the agent ship fast vs. verify thoroughly? If you include both, expect agents to default to whichever appears first in the values list.

**When to include:** Startup-culture orgs, content pipelines, anything where iteration speed matters more than first-attempt correctness.

**When to skip:** Compliance, healthcare, legal — anywhere a wrong answer is worse than a slow answer.

---

### Rigor

**Source:** No specific academic source. Reflects a verification-first mindset common in enterprise, compliance, and research cultures.

**Agent behavior:** Agents verify outputs before reporting completion. A code agent runs tests. A research agent cross-references sources. A compliance agent double-checks rule application. The agent does not mark a task as `done` until verification passes.

**Conflicts with:** Speed. See above.

**When to include:** Compliance orgs, clinical trials, contract review — anywhere correctness is non-negotiable.

**When to skip:** Fast-iteration environments where verification adds overhead without proportional value.

---

### Frugality

**Source:** No specific academic source. Reflects cost-conscious model routing — a practical concern for any org running multiple AI agents with per-token costs.

**Agent behavior:** Agents use the cheapest model capable of the task. Mechanical work (formatting, data extraction, template rendering) routes to fast/cheap models (Haiku, local Ollama). Reasoning-heavy work (architecture decisions, risk analysis, strategy) routes to expensive models (Opus, GPT-4o). The `seniorThreshold` in config determines the level cutoff.

**When to include:** Budget-conscious orgs, orgs with many low-level workers doing mechanical tasks.

**When to skip:** Small orgs where model cost is negligible relative to the value of output quality.

---

## Tradeoffs

### Conflicting pairs

**Speed + Rigor** is the most common conflict. If both are selected, the CLI warns:

```
⚠ Speed conflicts with Rigor — agents may receive contradictory guidance
```

The agent resolves ambiguity by prioritizing whichever value appears first in the config. But this is fragile — better to choose one and accept the tradeoff.

### Token cost

Each value adds ~50 tokens to every agent's system prompt per session. With the 5 defaults and 4 agents, that's ~1,000 tokens per session.

The CLI warns if you select more than 5 values:

```
⚠ You selected 7 values. More than 5 increases per-session token cost
  and may create conflicting guidance.
```

**Recommendation:** Select 3-5 values. The defaults (Ownership, Transparency, Measurement, Subsidiarity, Continuous Improvement) cover most use cases well.

---

## Customization

### During init

The `npx openspawn init` wizard includes a multi-select step for values. Defaults are pre-selected. You can add Speed, Rigor, or Frugality, or remove defaults you don't need.

### After init

Edit `openspawn.config.json`:

```json
{
  "alignment": {
    "values": ["ownership", "transparency", "rigor"]
  }
}
```

Then re-run `openspawn start` to regenerate agent workspaces with updated SOUL.md files.

### Per-template defaults

Some templates pre-select different value sets:

| Template                | Values                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| `assistant-team`        | Ownership, Transparency, Measurement, Subsidiarity, Continuous Improvement |
| `dev-shop`              | Ownership, Transparency, Measurement, Rigor                                |
| `incident-response`     | Ownership, Transparency, Speed                                             |
| `compliance-monitoring` | Ownership, Transparency, Measurement, Rigor                                |
| `research-lab`          | Measurement, Subsidiarity, Rigor                                           |

---

## References

- Drucker, P. (1954). _The Practice of Management_. Harper & Brothers.
- Edmondson, A. (1999). Psychological Safety and Learning Behavior in Work Teams. _Administrative Science Quarterly_, 44(2), 350-383.
- Katzenbach, J. & Smith, D. (1993). The Discipline of Teams. _Harvard Business Review_, 71(2), 111-120.
- Lencioni, P. (2012). _The Advantage_. Jossey-Bass.
- Rogers, P. & Blenko, M. (2006). Who Has the D? _Harvard Business Review_, 84(1), 52-61.
- Senge, P. (1990). _The Fifth Discipline_. Doubleday.

````

**Step 2: Verify the file renders**

Run: `ls apps/docs/src/content/docs/guides/values-framework.md`
Expected: file exists

**Step 3: Commit**

```bash
git add apps/docs/src/content/docs/guides/values-framework.md
git commit -m "docs(guides): add values framework guide

academic sources for each alignment value with agent behavior mapping"
````

---

### Task 2: Add values framework to docs sidebar

**Files:**

- Modify: `apps/docs/astro.config.mjs`

**Step 1: Add sidebar entry**

In `apps/docs/astro.config.mjs`, add `{ label: "Values Framework", link: "/guides/values-framework/" }` to the "Getting Started" sidebar group, after "Templates Guide":

```javascript
{
  label: "Getting Started",
  items: [
    { label: "Introduction", link: "/getting-started/" },
    { label: "Agent Quickstart", link: "/guides/agent-quickstart/" },
    { label: "Templates Guide", link: "/guides/templates/" },
    { label: "Values Framework", link: "/guides/values-framework/" },  // NEW
    { label: "Comparison", link: "/guides/comparison/" },
    { label: "FAQ", link: "/faq/" },
  ],
},
```

**Step 2: Commit**

```bash
git add apps/docs/astro.config.mjs
git commit -m "docs(sidebar): add values framework to navigation"
```

---

### Task 3: Add alignment passage to website landing page

**Files:**

- Modify: `apps/website/app/routes/index.tsx`

**Step 1: Add organic inline values passage**

In `apps/website/app/routes/index.tsx`, add a brief passage to the "Zero-Config CLI" feature card description (index 5 in the `features` array, line ~78-83). Update the description to include alignment context:

Change the Zero-Config CLI feature card description from:

```typescript
description:
  "Go from zero to a running agent org in under 30 seconds. Scaffold, start, and deploy with a single command.",
```

To:

```typescript
description:
  "Go from zero to a running agent org in under 30 seconds. The init wizard scaffolds roles, hierarchy, and alignment values drawn from Edmondson's psychological safety research, Drucker's management by objectives, and Katzenbach & Smith's team accountability model — each mapping to a specific agent behavior constraint.",
```

**Step 2: Commit**

```bash
git add apps/website/app/routes/index.tsx
git commit -m "docs(website): add alignment citations to CLI feature card

organic inline references to Edmondson, Drucker, Katzenbach & Smith"
```

---

### Task 4: Rewrite getting-started guide

**Files:**

- Modify: `apps/docs/src/content/docs/getting-started.md`

**Step 1: Rewrite getting-started.md**

Replace the entire content of `apps/docs/src/content/docs/getting-started.md` with the new two-tier structure. The full content:

```markdown
---
title: Getting Started
---

# Getting Started with OpenSpawn

**What you'll build:** A local agent org — coordinated by a single markdown file, with tasks flowing through a hierarchy you define — visible in a real-time dashboard.

**Time:** ~5 minutes for local setup, ~10 minutes for production infra.

## What is OpenSpawn?

OpenSpawn is a **coordination layer for AI agents**. It is not an agent framework — you keep using whatever you're using (OpenClaw, LangGraph, Claude Code, raw API calls). OpenSpawn adds the layer most multi-agent systems are missing: _structure_.
```

ORG.md → OpenSpawn parses it → agents spawn → tasks flow through hierarchy → dashboard shows everything

````

**The key idea:** One file — `ORG.md` — defines your entire agent organization. Roles, hierarchy, alignment values, budget policies, and operating procedures all live in one readable, version-controlled markdown file.

> **Q: How is this different from CrewAI / LangGraph / AutoGen?**
>
> Those are agent frameworks (they build agents). OpenSpawn is a coordination layer (it organizes agents). Use them together.

> **Q: Do I need to rewrite my agents?**
>
> No. OpenSpawn coordinates your existing agents via standard protocols (MCP, A2A).

---

## Prerequisites

- **Node.js 18+** (`node --version`)
- **Docker** (optional, for production infra with Postgres + Redis)

---

## Install

```bash
npm install -g openspawn
````

Or use without installing:

```bash
npx openspawn init
```

---

## Initialize your org

```bash
npx openspawn init
```

The interactive wizard walks you through 8 steps:

### Step 1 — Template

Pick from 11 templates (4 general + 7 industry):

| Category | Templates                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| General  | `assistant-team` (default), `content-agency`, `dev-shop`, `research-lab`                                                                               |
| Industry | `saas-onboarding`, `incident-response`, `contract-review`, `compliance-monitoring`, `game-live-ops`, `catalog-management`, `clinical-trial-processing` |

### Step 2 — Organization name

Text input. Default: "My Agent Team".

### Step 3 — Mission, vision & values

**Mission** and **Vision** are text inputs with smart defaults from your chosen template.

**Values** is a multi-select. OpenSpawn ships 8 alignment values, 5 selected by default:

| Value                  | Default | Agent Behavior                                     |
| ---------------------- | ------- | -------------------------------------------------- |
| Ownership              | Yes     | Single-threaded task ownership; ships or escalates |
| Transparency           | Yes     | Escalate instead of silently failing               |
| Measurement            | Yes     | Report outcomes with evidence                      |
| Subsidiarity           | Yes     | Solve at lowest competent level                    |
| Continuous Improvement | Yes     | Auto post-mortems, process updates                 |
| Speed                  | No      | Bias toward action, ship small                     |
| Rigor                  | No      | Depth over speed, verify first                     |
| Frugality              | No      | Cheap models for mechanical tasks                  |

Each value draws from established organizational research — Edmondson's work on psychological safety, Drucker's management by objectives, Katzenbach & Smith's team accountability model. See the [Values Framework guide](/guides/values-framework/) for sources and tradeoffs.

> **Warning:** Selecting more than 5 values increases per-session token cost (~50 tokens per value per agent) and may create conflicting guidance. Speed and Rigor conflict directly.

### Step 4 — Culture preset

Select from: `agency` (default), `startup`, `professional`, `ops`, `enterprise`, `research`, `compliance`.

### Step 5 — LLM provider & model

Provider: Anthropic (default), OpenAI, Ollama (local), Groq, OpenRouter.
Default model: `claude-sonnet-4-20250514`. Agents at L7+ auto-assigned senior model (`claude-opus-4-20250514`).

### Step 6 — Budget

Per-agent limit (default: 500/week), alert threshold (default: 80%), overage behavior (default: pause-and-escalate).

### Step 7 — Escalation

Behavior: `immediate` (default), `delayed`, `batched`.

### Step 8 — Infrastructure

Coordinator port (default: 8787). Generate Docker infra: no (default) or yes.

### Confirm

Summary table of all selections. Y/n to proceed.

### Quick start

Skip the wizard entirely with defaults:

```bash
npx openspawn init -y
```

Or specify a template directly:

```bash
npx openspawn init -t saas-onboarding
```

### What gets created

```
<target-dir>/
  ORG.md                    # your org definition
  openspawn.config.json     # all wizard answers persisted
  .gitignore                # node_modules, .env, data/, *.db
  openclaw-agents.json      # agent configs with model assignments
  workspaces/
    <agent-name>/
      SOUL.md               # org alignment + identity + role
      AGENTS.md             # workspace instructions
      memory/               # empty, for agent continuity
```

### Dry run

Preview what would happen without writing files:

```bash
npx openspawn init --dry-run
```

Shows the agent hierarchy tree, a sample task, and a simulated delegation chain.

---

## Start the coordinator

```bash
npx openspawn start
```

This launches the MCP server and web dashboard on the same port:

- **Dashboard:** `http://localhost:8787`
- **MCP endpoint:** `http://localhost:8787/mcp`
- **Health check:** `http://localhost:8787/health`

Agents connect to the MCP endpoint. The dashboard shows real-time task flow, agent hierarchy, and cost tracking.

```bash
npx openspawn start --port 9000  # custom port
npx openspawn start --stdio      # stdio transport (for Claude Desktop, Cursor)
```

---

## Go to production

For persistent storage and production workloads, generate Docker infrastructure:

```bash
npx openspawn init --deploy
```

Or re-run the wizard and select "Yes" for Docker infrastructure. This adds:

```
docker-compose.yml    # PostgreSQL (pgvector) + Redis
.env                  # database credentials (auto-generated)
```

Then:

```bash
docker compose up -d
npx openspawn start
```

The coordinator connects to Postgres for durable task storage and Redis for pub/sub coordination.

> **Q: Do I need Docker for development?**
>
> No. `npx openspawn start` works without Docker — it uses an in-process SQLite store. Docker is for production persistence.

---

## CLI reference

### `openspawn init`

Scaffold a new agent org.

| Flag                | Short | Default | Effect                         |
| ------------------- | ----- | ------- | ------------------------------ |
| `--template <name>` | `-t`  | —       | Skip template selection        |
| `--yes`             | `-y`  | `false` | Skip wizard, use all defaults  |
| `--non-interactive` | —     | `false` | Alias for `--yes`              |
| `--dry-run`         | —     | `false` | Simulate without writing files |
| `--deploy`          | —     | `false` | Generate Docker infra          |
| `--port <n>`        | `-p`  | `8787`  | Coordinator port               |
| `--dir <path>`      | `-d`  | `.`     | Target directory               |

### `openspawn start`

Start the coordinator (MCP server + dashboard).

| Flag         | Default | Effect              |
| ------------ | ------- | ------------------- |
| `--port <n>` | `8787`  | Server port         |
| `--stdio`    | `false` | Use stdio transport |

### `openspawn status`

Display agent hierarchy and task status.

### `openspawn org`

Read the current ORG.md structure.

### `openspawn hire <name>`

Add an agent to the organization.

| Flag              | Default   | Effect       |
| ----------------- | --------- | ------------ |
| `--level <n>`     | `4`       | Agent level  |
| `--domain <name>` | `general` | Agent domain |
| `--parent <id>`   | —         | Parent agent |
| `--model <name>`  | —         | LLM model    |

### `openspawn fire <name>`

Remove an agent from the organization.

### `openspawn task <description>`

Create a new task.

### `openspawn delegate`

Delegate a task down the hierarchy.

### `openspawn escalate`

Escalate a task up the hierarchy.

### `openspawn report`

Report task status or completion.

### `openspawn budget`

Check or set agent budgets.

---

## Customize your org

### Edit ORG.md directly

After init, your ORG.md is a markdown file. Edit freely — add agents, change hierarchy, update playbooks. Run `openspawn start` to apply changes.

### Adjust config

Edit `openspawn.config.json` to change alignment values, budget limits, LLM provider, or culture preset. See the [Values Framework guide](/guides/values-framework/) for details on each value.

### Re-run the wizard

```bash
npx openspawn init
```

Re-running in an existing directory lets you update your configuration interactively.

---

## Next steps

- **[Templates Guide](/guides/templates/)** — all 11 templates with roles, hierarchy, and use cases
- **[Values Framework](/guides/values-framework/)** — alignment values, academic sources, tradeoffs
- **[ORG.md Spec](/reference/org-md-spec/)** — every field and format detail
- **[Agent Quickstart](/guides/agent-quickstart/)** — agent-first version of this guide
- **[Communication Protocol](/reference/communication-protocol/)** — how agents talk to each other
- **[FAQ](/faq/)**
- **[Troubleshooting](/guides/troubleshooting/)**
- **Live demo:** [bikinibottom.ai](https://bikinibottom.ai)

````

**Step 2: Commit**

```bash
git add apps/docs/src/content/docs/getting-started.md
git commit -m "docs(getting-started): full rewrite for two-tier deployment model

structured around init wizard, start command, production deploy, CLI reference"
````

---

### Task 5: Lint and verify

**Step 1: Run formatter**

Run: `pnpm exec oxfmt --write .`

**Step 2: Run linter**

Run: `pnpm exec nx run-many -t lint`

**Step 3: Verify docs build**

Run: `pnpm exec nx build docs`

**Step 4: Verify website build**

Run: `pnpm exec nx build website`

**Step 5: Fix any issues found**

If lint/build errors, fix and recommit.

**Step 6: Final commit if needed**

```bash
git add -A
git commit -m "chore(docs): fix lint/build issues"
```

---

## Unresolved Questions

- Templates guide mentions 7 industry templates; CLI now has 7 industry + 4 general = 11. Update templates guide? (out of scope per design doc, separate PR)
- Should `openspawn validate` appear in getting-started? (not yet implemented, mentioned as future in CLI design doc)
