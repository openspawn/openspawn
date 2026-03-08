# CLI Polish Design — `npx openspawn init`

**Issue:** #594
**Date:** 2026-03-08
**Status:** Approved

## Goal

Zero-friction onboarding: `npx openspawn init` creates a working agent org from a template with full customizability and smart defaults.

## Key Decisions

- **npm package (`packages/openspawn/`) is canonical CLI** — Go CLI (`packages/cli/`) becomes legacy
- **Port Go CLI's proven init design** into TypeScript, extend with all 11 templates + full wizard
- **`@clack/prompts`** for interactive wizard UX
- **Two-tier model:** Tier 1 (local, no Docker) + Tier 2 (`--deploy` generates Docker infra for Postgres + Redis)
- **Dashboard bundled with coordinator** — `openspawn start` serves web UI + MCP on same port; `--tui` flag for terminal-only
- **Validation:** parse + preview by default; `--dry-run` simulates agent registration + sample task
- **`-y` flag** skips wizard with sensible defaults (assistant-team template, "My Agent Team" name)
- **Everything is adjustable** — wizard answers are persisted in `openspawn.config.json`, can be re-run or hand-edited

## Wizard Flow (8 steps)

All steps have smart defaults. User can Enter through all of them.

### Step 1 — Template

Select from 11 templates (4 general + 7 industry):

**General:**
- `assistant-team` (default) — Chief of staff + specialists
- `content-agency` — Content production pipeline
- `dev-shop` — Software development team
- `research-lab` — Research & analysis team

**Industry:**
- `saas-onboarding` — Enterprise customer onboarding
- `incident-response` — Production incident management
- `contract-review` — Legal contract analysis
- `compliance-monitoring` — Regulatory compliance
- `game-live-ops` — Game economy & engagement
- `catalog-management` — E-commerce catalog optimization
- `clinical-trial-processing` — Clinical data & regulatory submissions

### Step 2 — Organization Name

Text input, default: "My Agent Team"

### Step 3 — Mission, Vision & Values (Alignment)

**Mission** — text input, default from template or: "Deliver measurable outcomes through autonomous coordination, escalating when uncertain."

**Vision** — text input, default from template or: "Every task owned, every blocker surfaced, every outcome measured."

**Values** — multi-select with conflict warnings:

| Value | Default | Source | Agent Behavior |
|-------|---------|--------|----------------|
| Ownership | Yes | Katzenbach & Smith, "The Discipline of Teams" | Single-threaded task ownership; ships or escalates |
| Transparency | Yes | Amy Edmondson, psychological safety | Escalate instead of silently failing |
| Measurement | Yes | Peter Drucker, management by objectives | Report outcomes with evidence |
| Subsidiarity | Yes | Rogers & Blenko, "Who Has the D?" | Solve at lowest competent level |
| Continuous improvement | Yes | Peter Senge, learning organizations | Auto post-mortems, process updates |
| Speed | No | — | Bias toward action, ship small. Conflicts with: Rigor |
| Rigor | No | — | Depth over speed, verify first. Conflicts with: Speed |
| Frugality | No | — | Cheap models for mechanical tasks |

**Guardrails:**
- Warn if >5 values selected (token cost + ambiguity)
- Flag conflicting pairs (Speed + Rigor)
- ~50 tokens per value per agent per session

### Step 4 — Culture Preset

Select from: agency (default from template), startup, professional, ops, enterprise, research, compliance. Pre-selected based on template.

### Step 5 — LLM Provider & Model

Provider: Anthropic (default), OpenAI, Ollama (local), Groq, OpenRouter.
Default model: `claude-sonnet-4-20250514`. L7+ agents auto-assigned senior model (`claude-opus-4-20250514`).
Threshold configurable.

### Step 6 — Budget

- Per-agent limit: 500/week (default)
- Alert threshold: 80% (default)
- Overage behavior: pause-and-escalate (default), warn-and-continue, hard-stop

### Step 7 — Escalation

Behavior: immediate (default from template), delayed, batched.

### Step 8 — Infrastructure

- Coordinator port: 8787 (default)
- Generate Docker infra: no (default), yes (generates docker-compose.yml + .env with Postgres + Redis)

### Confirm

Summary table of all selections. Y/n to proceed.

## Scaffold Output

```
<target-dir>/
  ORG.md                    # rendered from template + wizard answers
  openspawn.config.json     # all wizard answers persisted
  .gitignore                # node_modules, .env, data/, *.db
  openclaw-agents.json      # agent configs with model assignments
  workspaces/
    <agent-name>/
      SOUL.md               # org alignment + identity + role
      AGENTS.md             # workspace instructions
      memory/               # empty, for agent continuity
  docker-compose.yml        # only if --deploy or wizard Docker = yes
  .env                      # only if Docker infra generated
```

## openspawn.config.json

```json
{
  "orgFile": "ORG.md",
  "coordinator": {
    "port": 8787
  },
  "llm": {
    "provider": "anthropic",
    "models": {
      "default": "claude-sonnet-4-20250514",
      "senior": "claude-opus-4-20250514"
    },
    "seniorThreshold": 7
  },
  "budget": {
    "perAgentLimit": 500,
    "period": "weekly",
    "alertThreshold": 0.8,
    "overageBehavior": "pause-and-escalate"
  },
  "escalation": {
    "behavior": "immediate"
  },
  "alignment": {
    "mission": "Deliver measurable outcomes...",
    "vision": "Every task owned...",
    "values": ["ownership", "transparency", "measurement", "subsidiarity", "continuous-improvement"]
  },
  "culture": {
    "preset": "agency"
  }
}
```

## CLI Flags

| Flag | Short | Default | Effect |
|------|-------|---------|--------|
| `--template <name>` | `-t` | — | Skip template selection step |
| `--yes` | `-y` | `false` | Skip wizard, all defaults (assistant-team) |
| `--non-interactive` | — | `false` | Alias for --yes |
| `--dry-run` | — | `false` | Simulate agent registration + sample task after scaffold |
| `--deploy` | — | `false` | Generate docker-compose.yml + .env |
| `--port <n>` | `-p` | `8787` | Coordinator port |
| `--dir <path>` | `-d` | `.` | Target directory |

## Post-Scaffold Validation

**Default:** Parse ORG.md, display agent hierarchy tree in terminal.

**`--dry-run`:** Additionally simulate registering agents with coordinator, create a sample task, show what would happen. No actual server started.

## `openspawn start` (existing, to be enhanced)

- Serves coordinator (MCP server) + web dashboard on same port
- `localhost:8787` = React dashboard (bundled static assets from `apps/demo/`)
- `localhost:8787/mcp` = MCP protocol endpoint
- `--tui` flag for terminal-only dashboard
- Reads `openspawn.config.json` for port, LLM, budget settings

## Documentation Deliverables (parallel workstream)

- **Website landing page:** "Built on organizational science" section — HBR references, author attributions, links to papers
- **Docs: Values Framework guide** — each value's academic source, agent behavior mapping, tradeoffs
- **Docs: Templates guide** — all 11 templates with descriptions and use cases
- **Docs: Getting Started** — updated to match new wizard flow

## Out of Scope

- Go CLI feature parity (legacy, not actively developed)
- `openspawn deploy` command (future)
- `openspawn validate` command (future, separate issue)
- Template marketplace (future)
- Full production Docker with API container (users add manually if needed)

## Unresolved Questions

None — all decisions made during brainstorming. Everything is adjustable post-ship via `openspawn.config.json`.
