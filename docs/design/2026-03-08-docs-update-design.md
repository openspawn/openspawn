# Docs Update Design — Values Framework + Getting Started Rewrite

**Date:** 2026-03-08
**Status:** Approved

## Goal

Two docs deliverables: (1) values framework guide explaining the organizational theory behind alignment defaults, (2) full getting-started rewrite structured around the two-tier deployment model.

## Deliverable 1: Values Framework Guide

**Location:** `apps/docs/src/content/docs/guides/values-framework.md`

### Structure

1. **Why alignment matters for AI agents** — values are decision-making heuristics, not aspirational posters. When an agent is uncertain, "Transparency" tells it to escalate rather than guess. "Subsidiarity" tells it to solve what it can before escalating. Cite Lencioni's distinction between core and aspirational values (_The Advantage_).

2. **The 8 values** — reference table:

| Value                  | Description                                                 | Source                                        | Agent Behavior                               |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| Ownership              | Every task has exactly one owner; it ships or it escalates  | Katzenbach & Smith, _The Discipline of Teams_ | Single-threaded task ownership               |
| Transparency           | Surface problems early; silent failure is the worst outcome | Amy Edmondson, psychological safety research  | Agents escalate instead of guessing          |
| Measurement            | Track outcomes, not activity                                | Peter Drucker, management by objectives       | Report with evidence                         |
| Subsidiarity           | Decisions at the lowest competent level                     | Rogers & Blenko, _Who Has the D?_             | Solve before escalating                      |
| Continuous Improvement | Document every mistake, update process, never repeat        | Peter Senge, learning organizations           | Auto post-mortems                            |
| Speed                  | Bias toward action; ship small, iterate fast                | —                                             | Fast iteration (conflicts with Rigor)        |
| Rigor                  | Depth over speed; verify before asserting                   | —                                             | Thorough verification (conflicts with Speed) |
| Frugality              | Cheap models for mechanical tasks, expensive for reasoning  | —                                             | Model tier assignment                        |

3. **Deep dive per value** — subsection for each with:
   - Academic source, publication, key insight (1-2 sentences)
   - Concrete agent behavior example
   - When to include / when to skip

4. **Tradeoffs** — conflicting pairs (Speed vs Rigor), token cost (~50 tokens/value/agent/session), recommendation to select 3-5

5. **Customization** — edit `openspawn.config.json` alignment section, or re-run `npx openspawn init`

6. **References** — full bibliography:
   - Lencioni, P. (2012). _The Advantage_. Jossey-Bass.
   - Edmondson, A. (1999). Psychological Safety and Learning Behavior in Work Teams. _Administrative Science Quarterly_, 44(2).
   - Drucker, P. (1954). _The Practice of Management_. Harper & Brothers.
   - Katzenbach, J. & Smith, D. (1993). _The Discipline of Teams_. Harvard Business Review.
   - Rogers, P. & Blenko, M. (2006). _Who Has the D?_ Harvard Business Review.
   - Senge, P. (1990). _The Fifth Discipline_. Doubleday.

### Tone

Competent, not promotional. Citations appear inline as natural context. No "science-backed" or "research-proven" language. Let the substance speak.

## Deliverable 2: Website Landing Page Section

**Location:** Add to existing landing page content in `apps/website/`

Brief passage (3-4 sentences) under alignment/values feature description:

> OpenSpawn's default values draw from established organizational research — Edmondson's work on psychological safety, Drucker's management by objectives, Lencioni's core values framework. Each value maps to a specific agent behavior constraint: Transparency means agents escalate instead of guessing. Subsidiarity means decisions stay at the lowest competent level.
> [→ Full framework guide](https://docs.openspawn.ai/guides/values-framework)

No dedicated section or fanfare. Inline credibility.

## Deliverable 3: Getting Started Rewrite

**Location:** `apps/docs/src/content/docs/getting-started.md`

### New Structure

1. **Install** — `npm install -g openspawn` or use via `npx`

2. **Initialize your org** — `npx openspawn init` wizard walkthrough
   - Show each wizard step with example output
   - Explain what each step does and why it matters
   - Show the scaffold output (files created)
   - Mention `-y` for quick start with defaults

3. **Start the coordinator** — `npx openspawn start`
   - What it launches (MCP server + dashboard on same port)
   - How agents connect

4. **Go to production** — `npx openspawn init --deploy`
   - Docker infra generation (Postgres + Redis)
   - `docker compose up`
   - Connect the full API

5. **CLI reference** — all commands and flags
   - `init` with `-t`, `-y`, `--dry-run`, `--deploy`, `-p`, `--dir`
   - `start` with `--port`, `--stdio`
   - `status`, `org`, `hire`, `fire`, `task`, `delegate`, `escalate`, `report`, `budget`

6. **Customize your org** — edit ORG.md, adjust config, change alignment values

7. **Next steps** — links to templates guide, values framework, API docs

## Out of Scope

- CLI reference as a separate page (inline in getting-started for now)
- Templates guide update (separate PR)
- FAQ updates
