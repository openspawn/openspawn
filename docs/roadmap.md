---
title: Roadmap
layout: default
nav_order: 3
---

# Roadmap
{: .fs-9 }

Where BikiniBottom is heading.
{: .fs-6 .fw-300 }

---

## Completed

### Phases 1–8: Core Platform ✅

| Phase | Feature | PRs |
|-------|---------|-----|
| 1 | Auth, Settings, Config | #1–#10 |
| 2 | Agent Registration & Leveling | #11–#25 |
| 3 | Task Assignment & Credits | #26–#50 |
| 4 | Event Logging & Webhooks | #51–#75 |
| 5 | Dashboard & Real-time UI | #76–#100 |
| 6 | Trust, Reputation & Promotions | #101–#115 |
| 7 | Self-Claim, Peer Messaging, Pre-hooks | #116–#122 |
| 8 | Orchestrator Mode, Task Rejection | #123–#125 |

### Phase A: SDKs & Webhooks ✅

- TypeScript SDK (`libs/sdk/`)
- Python SDK (`sdks/python/`)
- Outbound webhooks (event subscriptions)
- Inbound webhooks (external task creation)

### Phase B: Integrations ✅

- GitHub bidirectional sync
- Linear.app integration
- OpenTelemetry observability
- OpenClaw agent skill
- Claude Code Agent Teams guide

### UI/UX Overhaul (4 phases) ✅

- **Phase 1 "Feel Professional"**: Cmd+K, chart upgrades, empty states, semantic colors
- **Phase 2 "Feel Alive"**: Real-time presence, sparklines, notifications, page transitions, timeline
- **Phase 3 "Feel Custom"**: Split panels, dashboard widgets, 5 ocean themes, onboarding tour
- **Phase 4 "Feel Mobile"**: Responsive redesign, touch graph, PWA, mobile status

---

## In Progress

### Phase C: Framework Adapters 🔄

Making BikiniBottom work seamlessly with popular agent frameworks.

- [ ] LangGraph adapter docs & examples
- [ ] CrewAI adapter docs & examples
- [ ] AutoGen integration guide
- [ ] Framework-agnostic webhook patterns

### Dashboard Improvements 🔄

- [x] Global side panel system
- [x] Base-UI migration (replaced Radix)
- [x] Team detail panels
- [ ] Agent Teams org chart enhancements
- [ ] Collapsible sidebar refinements

---

## Planned

### Phase D: Marketplace 📋

A marketplace for sharing agent configurations, team templates, and integration recipes.

- Agent template marketplace
- Team configuration sharing
- Integration recipe library
- Community contributions

### 32-Agent Sandbox 🧪

Proof-of-concept with 32 minimal agents demonstrating the full platform capabilities.

---

## Contributing

Have ideas for the roadmap? [Open a discussion](https://github.com/openspawn/openspawn/discussions) or [submit a PR](https://github.com/openspawn/openspawn/pulls).
