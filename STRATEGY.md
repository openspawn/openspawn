# OpenSpawn Strategy

**Last Updated:** 2026-03-02  
**Status:** Active development, pre-launch

---

## Core Positioning

**"The coordination layer for AI agent organizations."**

OpenSpawn (branded as BikiniBottom for demo) is infrastructure that sits *on top* of OpenClaw, not competitive with it:

- **OpenClaw** → transport/infrastructure layer (runtime, tools, messaging)
- **OpenSpawn** → coordination layer (org structure, task management, governance)

**Relationship:** Complementary, not competitive. OpenSpawn agents run *on* OpenClaw.

---

## Market Differentiation

### vs. Claude Code Agent Teams (Anthropic)
- **Them:** Session-scoped, ephemeral, flat hierarchy, Claude-only
- **Us:** Persistent governed organizations, multi-model, hierarchical structure
- **Moat:** "Your agents remember. Your org endures."

### vs. CrewAI / LangGraph / AutoGen
- **Them:** Frameworks — you build agents with their SDK
- **Us:** Infrastructure — coordinate agents from *any* framework via open protocols (A2A, MCP)

---

## Strategic Priorities (Current)

1. **MCP + CLI first** — widest surface area, easiest integration, no transport lock-in
2. **Dogfooding** — use OpenSpawn to build OpenSpawn (current: Adam → Dennis → CEO → web-eng/docs-writer)
3. **File-based state** — `.openspawn/tasks.json` — no database, Git-friendly
4. **Protocol-first** — A2A discovery, MCP tools, model router agnostic
5. **Demo polish** — live dashboard at `bikinibottom.ai`, auth-gated team dashboard at `team.openspawn.ai`

---

## Current Phase: Foundation (Feb-Mar 2026)

### Shipped
- ✅ ORG.md spec + zero-dep parser
- ✅ MCP server (13 tools, stdio + HTTP)
- ✅ CLI (`openspawn init`, `org tree`, task commands)
- ✅ npm package `openspawn@0.1.0`
- ✅ Kanban dashboard (real task data via static .openspawn/tasks.json)
- ✅ Homepage positioning refresh (persistent orgs vs ephemeral teams)
- ✅ Basic auth on team.openspawn.ai

### In Progress
- Real-time task data sync (GitHub token or MCP server on VPS)
- Authentik SSO (forward auth for team.openspawn.ai)
- End-to-end demo recording

### Next
- **Integration roadmap** — document paths for CrewAI, LangGraph, AutoGen (see `docs/strategy/integrations-and-growth.md`)
- **Agent communication rethink** — structured messages vs chat (potential differentiator)
- **Public launch** — positioned as "org infra for AI agents"

---

## Open Questions / Risks

1. **Inter-agent communication abstraction** — chat is wrong for agents. Need structured task lifecycle + shared state. Could be major moat if we solve it first.
2. **GitHub account flags** — agentdennis account flagged (Actions disabled, can't add collaborators). Appeal submitted, waiting on GitHub Support.
3. **OpenClaw community reception** — monitoring via daily intel digest. No signals yet on how they'll perceive us (complementary vs competitive).
4. **Auth UX** — basic auth is stopgap. Authentik SSO needs forward auth config (blocked on session auth vs API token issue).

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-28 | MCP + CLI before ACP | Widest compatibility, least framework lock-in |
| 2026-03-01 | File-based state (no DB) | Git-friendly, zero-ops, transparent state |
| 2026-03-01 | Zero-dep org parser | Fast, simple, no Markdown AST complexity |
| 2026-03-01 | Dogfood with real team | Validates UX, surfaces bugs, proves concept |
| 2026-03-01 | Positioning: coordination layer *on* OpenClaw | Complementary, not competitive — avoid ecosystem conflict |

---

## Competitive Intelligence

### Anthropic (Claude Code Agent Teams)
- **Launched:** Feb 2026
- **Positioning:** Ephemeral agent teams, session-scoped
- **Threat Level:** Medium — validates market, but reinforces our persistent-org moat
- **Response:** Homepage comparison table added (PR #455)

### OpenClaw Ecosystem
- **Monitoring:** Daily digest from AnswerOverflow → #intel channel (9 AM AST)
- **Signals:** None yet. Community focused on runtime/tools, not org coordination.

---

## Success Metrics (TBD)

- npm downloads (current: just launched)
- GitHub stars (current: private repo)
- Demo sign-ups (current: no gate)
- Integration guides written (CrewAI, LangGraph, AutoGen)
- Agent count in live deployments

---

**Next review:** End of week (Mar 7) or when major competitive/market signal emerges.
