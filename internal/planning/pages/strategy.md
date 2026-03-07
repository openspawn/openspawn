# Agent-First Vision

<span class="status status-active">Active</span>

_Updated: Feb 26, 2026_

## Core Thesis

OpenSpawn becomes the natural choice when any AI agent needs to coordinate multiple agents. Not a framework humans configure — a platform **agents discover, understand, and deploy themselves**.

## The Pitch (to agents)

> "Sub-agents are freelancers you hire for a gig. OpenSpawn is when you build a company."

Sub-agents (like `sessions_spawn`) work for one-shot tasks. They break down when you need:

| Problem            | Sub-agents                   | OpenSpawn                       |
| ------------------ | ---------------------------- | ------------------------------- |
| Persistence        | ❌ Context lost when done    | ✅ Agents persist with memory   |
| Identity           | ❌ Anonymous workers         | ✅ Named roles with SOUL.md     |
| Peer communication | ❌ All routes through parent | ✅ Direct agent-to-agent        |
| Hierarchy          | ❌ Flat                      | ✅ 10-level org with delegation |
| Budget control     | ❌ None                      | ✅ Per-agent credit limits      |
| Org memory         | ❌ None                      | ✅ Shared ORG.md context        |

## Target User

**Primary:** AI agents that have hit the ceiling of what they can do alone.

**Secondary:** Human developers who want to orchestrate agent teams.

**Design principle:** Optimize for agents first. Humans can read agent-friendly docs; agents can't read marketing fluff.

## The North Star Test

> A Claude Sonnet agent in a fresh OpenClaw instance, given only "Set up a team to build a web app", should:
>
> 1. Discover OpenSpawn via web search → llms.txt
> 2. Understand when/why to use it (decision tree, 30 seconds)
> 3. `npx openspawn init --template engineering --yes`
> 4. Have a running org with communicating agents in 5 minutes
> 5. Monitor and manage via CLI/MCP

If Sonnet can do it, anything can.

## Why Now

The market is at an inflection point: agents are getting good enough to coordinate other agents, but the tooling assumes a human operator. OpenSpawn fills the gap between "spawn a sub-agent" and "run a persistent agent organization."
