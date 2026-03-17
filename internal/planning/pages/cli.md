# CLI Design

<span class="status status-active">Building</span>

_Updated: Feb 26, 2026_

## Commands

| Command               | Status                   | Description                                           |
| --------------------- | ------------------------ | ----------------------------------------------------- |
| `openspawn init`      | ✅ Shipped               | Generate ORG.md + agent configs from templates        |
| `openspawn preview`   | ✅ Shipped               | Preview org in local sandbox (simulation + dashboard) |
| `openspawn start`     | ✅ Shipped               | Generate OpenClaw gateway patch from configs          |
| `openspawn status`    | ✅ Shipped               | Print agent table (name, role, level, model)          |
| `openspawn validate`  | ✅ Shipped               | Parse and validate ORG.md                             |
| `openspawn dashboard` | ✅ Shipped (via preview) | Serve dashboard locally with live agent data          |
| `openspawn hire`      | 🔲 Planned               | Add agent to running org                              |
| `openspawn fire`      | 🔲 Planned               | Remove agent from org                                 |
| `openspawn promote`   | 🔲 Planned               | Change agent level/permissions                        |
| `openspawn done`      | 🔲 Planned               | Archive org, return results                           |

## Three Usage Tiers

### Tier 1: One command (dumb agents)

```bash
npx openspawn start "Build a landing page for my product"
```

Infers roles, picks template, generates everything, boots agents.

### Tier 2: Template (capable agents)

```bash
npx openspawn init --template engineering-team --yes
openspawn preview     # see it run (simulation)
openspawn start       # real coordinator
```

### Tier 3: Full control (smart agents)

```bash
npx openspawn init  # interactive wizard
# Edit ORG.md manually
openspawn preview --dir ./my-org   # preview first
openspawn start --dir ./my-org     # then run for real
openspawn hire security-auditor --level 7
```

## Key Flags

- `--yes` / `-y` — skip all prompts (alias for `--non-interactive`)
- `--json` — machine-readable output on all commands
- `--dir` — specify org directory
- `--template` / `-t` — template name for init
- `--openclaw` — generate OpenClaw configs (default: true)

## Templates

| Template         | Roles                                     | Best for      |
| ---------------- | ----------------------------------------- | ------------- |
| `assistant-team` | Chief of staff + 7 specialists            | Solo operator |
| `content-agency` | Editor + research + strategy + production | Content work  |
| `dev-shop`       | Tech lead + frontend + backend + QA       | Software      |
| `research-lab`   | PI + analysts + collectors + synthesizer  | Research      |

## Tech Stack

- **Language:** Go
- **CLI framework:** Cobra
- **Interactive UI:** Bubbletea (Charm)
- **Org parser:** Custom remark-based
- **Distribution:** goreleaser + npm wrapper
