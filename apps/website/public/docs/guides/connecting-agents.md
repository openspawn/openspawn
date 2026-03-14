---
source: https://openspawn.ai/docs/guides/connecting-agents
generated: 2026-03-14
---

# Connecting Real Agents

How to add real LLM-powered agents to your OpenSpawn org and watch them work. Your ORG.md describes the org. Real agents are what make it come alive. So far you've written an ORG.md and seen how OpenSpawn parses it into a structure. Now it's time to connect actual LLM-powered agents — the workers that receive tasks, think, delegate, and complete real work.

## What Agents Are in OpenSpawn

This guide covers: An OpenSpawn agent is an

LLM-powered worker with a role. Each agent:

Has a position in the org chart — defined by its level, parent, and domain

Runs on a language model — configurable per-agent (GPT-4o, Claude, Gemini, etc.)

Receives tasks — assigned by its manager or delegated from above

Communicates via ACP — acknowledges, reports progress, escalates blockers, signals completion

```
│ An OpenSpawn Agent │
│ │
│ Role: "Backend Engineer" │
│ Level: L4 (Worker) │
│ Model: claude-haiku │
│ Domain: backend │
│ Trust score: 72 (TRUSTED) │
│ Current task: "Fix auth bug #42" │
│ Status: Working │
```

## Configuring Agents in ORG.md

### Choosing a Model

Earns a trust score — based on task success over time Agents are not scripts. They're not hardcoded workflows. Each agent makes LLM-powered decisions on every tick: what to work on, when to delegate, when to escalate, when to call it done. The agent doesn't know it's a software agent — it just knows it's a backend engineer with a task to complete. That's the power of the role-description approach. Every agent in your org can run on a different model. You configure this in the

```
### Engineering Lead
Triages technical work. Delegates to specialists. Reviews output.
- **Model:** claude-sonnet
- **Domain:** engineering
#### Backend Worker
Owns API and database work.
- **Model:** claude-haiku
```

Structure section of your ORG.md:

Model aliases OpenSpawn understands:

Resolves to ["claude-opus", "anthropic/claude-opus-4"], ["claude-sonnet", "anthropic/claude-sonnet-4-5"], ["claude-haiku", "anthropic/claude-haiku-3-5"], ["gpt-4o", "openai/gpt-4o"], ["gpt-4o-mini", "openai/gpt-4o-mini"], ["gemini-pro", "google/gemini-1.5-pro"], ].map(([alias, resolves]) => ( You can also use full provider/model paths:

anthropic/claude-sonnet-4-5,

openai/gpt-4o-mini, etc.

Practical guidance on model selection:

### Giving Agents Capabilities

```
Writes blog posts, social copy, and documentation.
Researches topics using web search before writing.
- **Model:** claude-haiku
- **Domain:** copywriting
```

Role type Recommended model "C-suite / Director", "claude-sonnet or gpt-4o", "High-stakes decisions, complex reasoning", ["Lead / Manager", "claude-sonnet or gpt-4o-mini", "Balance of capability and cost"], "Worker / Engineer", "claude-haiku or gpt-4o-mini", "Fast, cheap, handles scoped tasks well", ["Research / Creative", "claude-sonnet or claude-opus", "Needs depth and nuance"], ].map(([role, model, why]) => ( Capabilities are the tools an agent can use. Configure them in the role description or as a structured field:

Available built-in capabilities:

Capability

What it does ["web-search", "Agent can search the web for information"], ["file-read", "Agent can read files in the workspace"], ["file-write", "Agent can create and edit files"], ["code-exec", "Agent can run code in a sandbox"], ["api-call", "Agent can call external APIs (requires endpoint config)"], ["spawn-agent", "Agent can spawn sub-agents (L6+ only)"], ].map(([cap, desc]) => ( Writing Effective Role Descriptions The prose you write above each role becomes the agent's

```
- **Model:** claude-haiku
```

```
You own the API layer: REST endpoints, GraphQL schema, authentication, and database queries.
When you receive a task, break it down into the smallest safe change. Write tests first.
If a task touches security (auth, permissions, data access), tag it for Security Lead review before marking done.
- **Model:** claude-haiku
```

## How ACP Works in Practice

### The Four Message Types

system prompt context. This is the most powerful configuration you can provide — more than any structured field. Weak description Strong description The second version gives the agent real behavioral guidance. It knows to write tests first. It knows which tasks need review. It knows what "owns the API layer" means. That guidance comes from your description, not from any configuration field. When you deploy a real agent, it doesn't just receive tasks in silence. It communicates through ACP (Agent Communication Protocol) — a structured set of message types that model how effective human organizations actually communicate.

```
Backend Worker → 👍 (immediate, auto-generated)
```

1. Acknowledgment (ACK) — 👍 When your agent receives a task, it immediately sends a 👍 reaction to its delegator. This happens automatically — no LLM call required. It's the system saying "I got it."

2. Progress Updates As the agent works, it writes progress entries to the task's activity log. These are

```
"Reproducing the bug locally. Auth middleware is rejecting valid JWTs."
[30 minutes later]
```

pull-based — the manager checks when they want to, not on every update. Progress updates happen on meaningful phase changes — not on every micro-action. The agent decides when something is worth logging.

```
⚠️ BLOCKED on "Fix auth bug #42"
Reason: BLOCKED
"Need the JWT secret key to test the fix. It's not in the .env file
```

3. Escalation — ⚠️ If the agent hits a blocker it can't resolve, it escalates to its direct manager: The task status changes to BLOCKED. The manager sees it immediately — this is push-based, because blockers need attention now.

4. Completion — ✅

```
✅ Completed: Fix auth bug #42
Result: Fixed JWT expiry check to use UTC timestamps. Added unit tests
for token validation. No security review needed — this is a bug fix,
not a permissions change.
```

When the task is done: The ✅ reaction goes on the task (scannable), the summary message goes to the manager (readable), and the full details live on the task itself (available when needed). What This Looks Like in Your Dashboard

### Step 1: Write the ORG.md

```
## Culture
preset: startup
## Structure
### Editor
You manage the content pipeline. You receive article requests,
brief the writers, review drafts, and approve publication.
- **Model:** claude-sonnet
- **Domain:** editorial
#### Content Writer
You write articles, blog posts, and documentation.
When assigned an article, research the topic first using web search,
then write a complete draft. Aim for clear, engaging prose.
- **Model:** claude-haiku
- **Domain:** copywriting
```

### Step 2: Deploy the Org

```
✓ Created: Editor (L9, claude-sonnet)
✓ Created: Content Writer (L4, claude-haiku, web-search + file-write)
✓ Applied culture: startup
```

### Step 3: Give It a Task

```
[T+1s] Editor 👍 ack
[T+3s] Editor → Content Writer: "Write 500-word article:
benefits of async-first remote work. Research first."
[T+4s] Content Writer 👍 ack
[T+10s] Content Writer (progress): "Researching async-first companies:
Basecamp, GitLab, Doist. Found 4 good sources."
[T+40s] Content Writer (progress): "Draft complete. 523 words."
[T+42s] Content Writer ✅ → Editor:
"Completed: async-first article (523 words).
Covers benefits, 3 company examples, actionable tips.
File saved: articles/async-work.md"
[T+45s] Editor (reviewing draft)...
[T+60s] Editor ✅ → Human:
"Article approved and published.
```

### Step 5: Review the Output

```
openspawn messages # All ACP messages
```

```
openspawn config set ANTHROPIC_API_KEY=sk-ant-...
openspawn config set OPENAI_API_KEY=sk-...
# Set a default model for agents that don't specify one
```

```
### Model Defaults
- **Default model:** claude-haiku
- **Lead model:** claude-sonnet
```

When real agents are working, you'll see: Walkthrough: Adding a Real Agent to Your Org Let's add a content writer agent to a simple org and watch it complete a real task. The whole pipeline — delegation, research, writing, review, completion — runs autonomously. You gave one task; the org handled the rest. API Keys and Model Configuration Real agents need real API keys. Configure them before deploying: The system respects a model hierarchy: explicit role config → policy defaults → system default. Troubleshooting Common Issues Agent Gets Stuck (No Progress)

Symptom: Agent acknowledges a task but never sends progress updates or completes.

Causes and fixes:

Model API key missing or invalid Fix: Check your API key config with

openspawn config show.

```
"Write an article about remote work"
# After
"Write a 500-word article about async-first remote work.
```

Task too vague — Agent doesn't know what "done" looks like.

Agent lacks required capability — If the task requires web search and your agent doesn't have

### Agent Escalates Everything

web-search, it can't proceed. Add the capability to the role in ORG.md and redeploy.

Symptom: Agent keeps escalating with

LOW_CONFIDENCE or

BLOCKED.

```
You write blog posts.
# After
You write blog posts, documentation, social copy, and email drafts.
```

Role description too narrow — Agent sees every task as out of domain.

```
preset: startup
```

Task genuinely requires missing resources Tasks Completing Too Fast (Without Real Work)

Symptom: Agents complete tasks instantly with shallow output.

Cause: Model is pattern-matching "task completion" without doing real work.

```
...
A task is complete ONLY when:
1. The code change has been made
2. Tests have been written and pass
3. The PR description explains what changed and why
```

Fix: Add specificity about what "done" means: Agents Not Talking to Each Other

Symptom: Tasks don't flow down the hierarchy — everything sits with the top-level agent.

Cause: Top-level agent isn't delegating.

```
You are a delegator, not a doer. When you receive a task:
1. Break it into subtasks if needed
2. Assign each subtask to the right worker based on their domain
3. You only do work yourself if no worker has the right domain
```

## Next Steps

Fix: Make delegation explicit in the role description: to="/docs/guides/dashboard-guide"

Dashboard Guide → Read the live feed, network graph, and ACP metrics to="/docs/tutorials/your-first-org-md"

ORG.md Reference →

Full syntax for the org file to="/docs/concepts/acp-vs-a2a"

ACP vs A2A →

Internal protocol vs cross-org communication
