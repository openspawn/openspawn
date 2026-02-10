---
title: Marketplace
layout: default
parent: Features
nav_order: 15
---

# 🏪 Marketplace

Share and discover agent configurations, team templates, and integration recipes.

{: .label .label-yellow }
Phase D — Planned

---

## Vision

The BikiniBottom Marketplace is a community-driven hub where you can:

- **Publish** agent configurations that solve specific problems
- **Install** pre-built team templates with one command
- **Share** integration recipes and workflow patterns
- **Rate & review** community contributions

Think of it as npm/pip for agent coordination — not the agents themselves, but the infrastructure patterns that make them work together.

## What's Shareable

### Agent Templates

Pre-configured agent definitions with roles, capabilities, and recommended settings.

```yaml
# marketplace/templates/code-review-team.yaml
name: Code Review Team
description: A 3-agent team for automated code review
agents:
  - name: Review Lead
    role: MANAGER
    level: 7
    capabilities: [code-review, architecture]
    model: claude-sonnet-4-5-20250514
  - name: Security Scanner
    role: WORKER
    level: 5
    capabilities: [security-audit, dependency-check]
    parent: Review Lead
  - name: Style Checker
    role: WORKER
    level: 3
    capabilities: [lint, formatting, best-practices]
    parent: Review Lead
```

### Team Templates

Organizational structures with hierarchy, budgets, and policies.

```yaml
# marketplace/templates/startup-org.yaml
name: AI Startup Org
description: Complete agent org for a small startup
teams:
  - name: Engineering
    color: cyan
    sub_teams:
      - Backend
      - Frontend
      - QA
  - name: Growth
    color: emerald
    sub_teams:
      - Content
      - Analytics
budget:
  default_per_agent: 5000
  period: monthly
```

### Integration Recipes

Step-by-step patterns for connecting BikiniBottom to external tools.

```yaml
# marketplace/recipes/github-pr-review.yaml
name: GitHub PR Auto-Review
description: Automatically assign PR reviews to agents based on capabilities
triggers:
  - event: github.pull_request.opened
integrations:
  - github-sync
  - outbound-webhooks
workflow:
  1. PR opened → webhook fires
  2. BikiniBottom creates task with PR metadata
  3. Agent with code-review capability claims task
  4. Agent reviews PR, posts comments via GitHub API
  5. Task marked complete, credits deducted
```

### Workflow Patterns

Reusable orchestration patterns.

```yaml
# marketplace/patterns/approval-chain.yaml
name: Multi-Level Approval Chain
description: Tasks require approval from progressively higher-level agents
pattern:
  type: hierarchical-approval
  levels:
    - min_level: 5  # First approval
    - min_level: 7  # Second approval
    - min_level: 9  # Final approval (manager+)
  timeout: 1h
  escalation: auto
```

## CLI (Planned)

```bash
# Browse marketplace
bb marketplace search "code review"

# Install a template
bb marketplace install openspawn/code-review-team

# Publish your template
bb marketplace publish ./my-template.yaml

# List installed templates
bb marketplace list
```

## API (Planned)

```
GET    /api/marketplace/search?q=...
GET    /api/marketplace/templates/:id
POST   /api/marketplace/templates        (publish)
GET    /api/marketplace/recipes/:id
POST   /api/marketplace/install/:id      (install to org)
```

## Dashboard Integration

The marketplace will be accessible from the BikiniBottom dashboard:

- **Browse** tab with search, categories, and ratings
- **One-click install** that provisions agents, teams, and webhooks
- **My Templates** for managing published content
- **Usage stats** showing how your templates are being used

## Community Guidelines

1. **No proprietary LLM keys** in templates — use placeholders
2. **Document capabilities** clearly — what does each agent do?
3. **Include budget estimates** — how many credits does this pattern typically use?
4. **Test before publishing** — templates should work with the demo data
5. **Semantic versioning** — breaking changes = major version bump

## Roadmap

| Milestone | Description | Status |
|-----------|-------------|--------|
| Template spec | YAML schema for agent/team templates | 📋 Design |
| CLI commands | `bb marketplace` subcommands | 📋 Design |
| API endpoints | REST API for marketplace CRUD | 📋 Design |
| Dashboard UI | Browse, install, publish from dashboard | 📋 Design |
| Community launch | Public marketplace with seed templates | 📋 Planned |

---

## Get Involved

Want to help shape the marketplace? [Open a discussion](https://github.com/openspawn/openspawn/discussions) with your ideas for templates, recipes, or features you'd like to see.
