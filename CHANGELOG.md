# Changelog

All notable changes to OpenSpawn will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## 2026.3.3

### Added

- AI discoverability: noscript content, 18 auto-generated .md doc pages, .well-known/agent.json (A2A v0.3)
- PoweredByBadge component (inline/banner/card variants)
- GqlThrottlerGuard for GraphQL context handling
- Public query decorators for dashboard read access
- llms.txt updated with per-page .md links (Mintlify-style)
- VISION.md, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md

### Fixed

- Canonical URLs: openspawn.dev -> openspawn.ai across all meta tags
- GraphQL production crash (ThrottlerGuard request.ip)
- MCP client re-exports (dashboard-data barrel incomplete)
- Demo build (removed dead protected-route import)
- Docker build (scripts/ copy, lockfile sync)

## 2026.3.2

### Added

- Monorepo restructure Phase 1: design-tokens, dashboard-ui, dashboard-data, test-utils libraries
- Monorepo restructure Phase 2: apps/demo and apps/team split from dashboard
- Auth hardening: basic auth on team.openspawn.ai, status.openspawn.ai, Authentik admin
- GraphQL formatError sanitization in production
- api.openspawn.ai deployed (NestJS, PostgreSQL, GraphQL + REST)
- status.openspawn.ai deployed (Gatus monitoring)
- docs.openspawn.ai redirect to openspawn.ai/docs

### Fixed

- Team dashboard dark mode
- API URL wiring (VITE_API_URL priority fix)
- Outline moved to wiki.openspawn.ai (502 fix with HTTP 1.1 transport)

## 2026.3.1

### Added

- Competitive research document
- 121 new tests (total 444 across monorepo)
- CEO Agent architecture and deployment
- Discord server (OpenSpawn Ops) for inter-agent communication
- Ollama local fallback model (qwen2.5:14b)

### Fixed

- CEO crash-loop (invalid thinking keys)
- BikiniBottom root URL redirect
- Compaction buffer (reserveTokensFloor: 5000)

## 2026.2.24

### Added

- PRs #388-398: Tech debt sprint, Groq LLM replay, dashboard polish, demo UX, product tour
- 112 new tests across monorepo

## 2026.2.16

### Added

- PRs #275-370: Initial platform build
- Live demo at bikinibottom.ai (75-second choreographed replay)
- OpenSpawn website at openspawn.ai
- MCP server with 7 tools
- A2A v0.3 agent cards
- 7 industry templates
- CLI: npx openspawn init
