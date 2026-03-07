# Positioning

<span class="status status-active">Active</span>

_Updated: Feb 26, 2026_

## One-liner

**"Graduate from sub-agents when your work outgrows them."**

## Competitive Landscape

| Framework                              | What it does                   | Our relationship                                       |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **CrewAI**                             | Role-based task crews (Python) | Complementary — we orchestrate CrewAI crews            |
| **LangGraph**                          | Stateful agent graphs (Python) | Complementary — we wrap LangGraph pipelines            |
| **AutoGen**                            | Free-form group chat           | Cautionary tale — 40-60% coordination overhead         |
| **MetaGPT**                            | SOP pipeline + pub/sub         | Good ideas, we borrow the structured artifact approach |
| **Sub-agents** (OpenClaw, Claude Code) | Spawn-and-forget workers       | Our direct predecessor — we're the upgrade path        |

## Key Differentiators

1. **ORG.md** — org definition in markdown. Every LLM can parse it natively. No SDK needed.
2. **Agent-first** — primary user is an agent, not a human. CLI, docs, discovery all optimized for agents.
3. **OpenClaw as runtime** — zero new infrastructure. Agents are real OpenClaw sessions with full tooling.
4. **Transactional coordination** — SQLite + MCP tools, not chat loops. No token waste.

## What We're NOT

- Not a framework (we're infrastructure)
- Not replacing CrewAI/LangGraph (we wrap them)
- Not competing with sub-agents for simple tasks (we're the upgrade path)
- Not a hosted platform (self-hosted, MIT license)

## Honest Weaknesses

- Demo-stage maturity (competitors are production-ready)
- TypeScript only (Python SDK planned)
- Small community (no ecosystem yet)
- No external validation (zero public adopters)
