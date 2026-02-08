# Changelog

All notable changes to OpenSpawn are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-08

### Added

#### Phase 1: Authentication & Events
- JWT + OAuth + TOTP 2FA authentication for humans
- HMAC-SHA256 signing for agent requests
- API key management with scoped permissions
- Role-based access control (RBAC)
- Event logging with severity levels
- Nonce-based replay protection

#### Phase 2: Agent Operations
- 10-level agent hierarchy (L1-L10)
- Agent onboarding and activation workflow
- Parent-child relationships with capacity limits
- Agent capabilities with proficiency levels
- Budget management per agent

#### Phase 3: Task Workflow
- Task templates with variable substitution
- Automatic task routing based on capabilities
- Task dependencies and blocking
- Task comments and approval workflows
- Kanban-style task status flow

#### Phase 4: Credit System
- Credit earning on task completion
- Spending tracking with model usage
- Budget limits and enforcement
- Credit analytics and trends
- Alert system for spending anomalies

#### Phase 5: Trust & Reputation
- Trust scores (0-100)
- Reputation levels (NEW → ELITE)
- Automatic reputation updates on task outcomes
- Promotion thresholds and auto-promotion
- Trust leaderboard
- Manual bonus/penalty (HR role)

#### Phase 6: Escalation & Consensus
- Task escalation to higher-level agents
- Multi-agent consensus voting
- Deadline-based vote expiration
- Resolution tracking and audit trail

#### Dashboard
- Real-time network visualization (ReactFlow + ELK)
- Dark/light mode theming
- Animated agent avatars (DiceBear)
- Activity toast notifications
- Guided tour for first-time users
- Reputation tab with leaderboard

#### Demo Mode
- Simulation engine with realistic events
- Multiple scenarios (fresh, startup, growth, enterprise)
- Playback controls (play/pause/speed)
- No backend required (MSW-free)

#### MCP Server
- 20+ tools for agent automation
- Task, credit, message, trust, escalation tools
- HMAC-authenticated API client

### Infrastructure
- Nx monorepo with pnpm
- NestJS API with TypeORM
- React dashboard with Vite
- PostgreSQL 16 database
- Docker Compose deployment
- GitHub Actions CI/CD
- GitHub Pages documentation

---

[Unreleased]: https://github.com/openspawn/openspawn/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/openspawn/openspawn/releases/tag/v0.1.0
