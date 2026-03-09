# OpenSpawn Vision

OpenSpawn is the coordination layer for AI agent organizations.

One markdown file defines your entire agent org — roles, hierarchy, culture, policies, and playbooks. OpenSpawn parses it, spawns agents, routes tasks through the hierarchy, and gives you a real-time dashboard.

This document explains the direction of the project.

## What OpenSpawn Is

OpenSpawn is **infrastructure, not a framework.** It does not replace CrewAI, LangGraph, AutoGen, or OpenClaw — it coordinates agents built with any of them.

Think of it as the org chart, HR department, and operations center for your AI workforce.

### The Core Idea: ORG.md

Everything starts with a single markdown file that defines roles, hierarchy, culture, policies, and playbooks. Everything else — the CLI, the coordinator, the dashboard, the MCP server — exists to execute what is in the ORG.md.

## Current Focus

**Priority:**

- Getting `npx openspawn init` to a polished, zero-friction experience
- Making the coordination engine production-grade (task routing, escalation, delegation)
- Dashboard that lets humans see and control an entire agent organization
- MCP server so any AI tool can manage an OpenSpawn org

**Next priorities:**

- Agent framework adapters (CrewAI, LangGraph, AutoGen integration)
- Plugin system for custom coordination logic
- Economic layer hardening (budgets, trust scores, performance tracking)
- Template marketplace for industry-specific org configurations

## What Makes OpenSpawn Different

- **Org structure** — ORG.md defines hierarchy, culture, policies (not just a list of agents)
- **Coordination** — Built-in task routing, escalation, delegation
- **Protocol-native** — MCP + A2A from day one
- **Economic layer** — Budgets, trust scores, performance tracking
- **Governance** — Policies and playbooks in the org file
- **Visualization** — Real-time dashboard with org-wide view

## What We Will Not Build

- Another agent framework (use whatever you want)
- A hosted SaaS platform (self-hosted first, always)
- A closed ecosystem (standards-based, interoperable)

## What We Will Build

- The best coordination layer for multi-agent systems
- Developer tooling that makes agent orgs as easy to manage as code
- Standards (ORG.md, ACP) that the community can adopt and extend
- A template ecosystem for real-world industry patterns

## Contribution Rules

- One PR = one topic. Do not bundle unrelated changes.
- PRs over 5,000 lines need exceptional justification.
- AI-assisted PRs are welcome — just mark them.
- Start with an issue or discussion before major features.

See CONTRIBUTING.md for full guidelines.

## Links

- Website: https://openspawn.ai
- Live Demo: https://bikinibottom.ai
- Docs: https://openspawn.ai/docs/getting-started
- GitHub: https://github.com/openspawn/openspawn
