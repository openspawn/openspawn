# Roadmap

*Updated: Feb 26, 2026*

## Phase 1: Foundation <span class="status status-done">Done</span>

- [x] CLI scaffolding (Go, Cobra, Bubbletea)
- [x] ORG.md parser
- [x] 4 org templates
- [x] `openspawn init` with interactive + headless modes
- [x] OpenClaw config generation from ORG.md
- [x] `openspawn start` (gateway patch generation)
- [x] `openspawn status`
- [x] Agent-first docs (llms.txt, quickstart, templates guide)
- [x] Website: comparison page, MCP ref, ORG.md ref
- [x] Full SEO on openspawn.ai

## Phase 2: Coordination Layer <span class="status status-active">Next</span>

- [ ] SQLite schema (agents, tasks, events, messages)
- [ ] MCP tools: `task_create`, `task_claim`, `task_complete`, `escalate`, `org_status`
- [ ] Anti-ping-pong rules baked into SOUL.md templates
- [ ] Planning phase: CEO writes PLAN.md before agents execute
- [ ] Wire MCP server into `openspawn start`
- [ ] Token budget enforcement per agent

## Phase 3: Dashboard <span class="status status-planned">Planned</span>

- [ ] `openspawn dashboard` command (serve locally)
- [ ] Dashboard reads real agent state from SQLite
- [ ] Task board view (open, claimed, done, blocked)
- [ ] Live event stream (SSE)
- [ ] Controls: hire/fire/promote/assign buttons
- [ ] Budget and token usage visualization

## Phase 4: Agent Lifecycle <span class="status status-planned">Planned</span>

- [ ] `openspawn hire` — add agent to running org
- [ ] `openspawn fire` — remove agent
- [ ] `openspawn promote` / `demote`
- [ ] `openspawn done` — archive org, return results
- [ ] Hot-reload: config changes without gateway restart

## Phase 5: Distribution <span class="status status-blocked">Blocked</span>

- [ ] npm publish (blocked: need npm auth)
- [ ] `npx openspawn` works out of the box
- [ ] Go binary releases via goreleaser
- [ ] Docker image for standalone mode
- [ ] Serve llms.txt at openspawn.ai/llms.txt (currently in docs/ only)

## Phase 6: Ecosystem <span class="status status-planned">Future</span>

- [ ] Python SDK
- [ ] ORG.md spec extraction (`org-md-spec` repo)
- [ ] MCP tool registry listing
- [ ] Integration guides for CrewAI, LangGraph
- [ ] Managed LLM pool (monetization)
- [ ] System prompt inclusion in major agent frameworks

## Open Decisions

| Question | Options | Decision |
|----------|---------|----------|
| Coordination layer | Files vs SQLite vs Redis | **SQLite + MCP** (decided) |
| Dashboard bundling | Embed in Go binary vs npx fetch | TBD |
| npm package structure | Go binary wrapper vs pure JS | TBD |
| When to extract ORG.md spec | After 10 adopters | TBD timing |

## Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| npm auth | Can't publish CLI to npm | Need credentials from Adam |
| GitHub Actions disabled | agentdennis account flagged | Appeal drafted, need Adam to send |
