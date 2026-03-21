# SKILL.md Compatibility Guide

> How OpenSpawn skills relate to gstack, Claude Code, and OpenClaw skill formats.

---

## Overview

Multiple tools in the AI agent ecosystem use `SKILL.md` files to define agent capabilities. This guide documents the common format, differences, and how to ensure portability across platforms.

## Format Comparison

### Common Subset (Works Everywhere)

All platforms support these frontmatter fields:

```yaml
---
name: my-skill
version: 1.0.0
description: What this skill does.
---
```

And a markdown body with instructions, examples, and documentation.

### Platform-Specific Extensions

| Field | OpenSpawn | gstack | Claude Code | OpenClaw |
|-------|-----------|--------|-------------|----------|
| `name` | ✅ Required | ✅ Required | ✅ Used | ✅ Required |
| `version` | ✅ | ✅ | ❌ | ❌ |
| `description` | ✅ Required | ✅ Required | ✅ Used in `<description>` | ✅ Used |
| `allowed-tools` | ✅ Optional | ✅ Required | ❌ | ❌ |
| `benefits-from` | ✅ Optional | ✅ Optional | ❌ | ❌ |
| `hooks` | ❌ | ✅ Optional | ❌ | ❌ |
| Preamble bash | ❌ | ✅ (telemetry, etc.) | ❌ | ❌ |

### OpenSpawn SKILL.md

```yaml
---
name: reviewer-ceo
version: 1.0.0
description: |
  CEO-level scope reviewer for agent organizations.
allowed-tools:
  - Read
  - Write
  - Bash
benefits-from:
  - office-hours
---

# Reviewer (CEO)

[Skill instructions...]
```

**Characteristics:**
- Frontmatter with `name`, `version`, `description`
- Optional `allowed-tools` for capability-based agent matching
- Optional `benefits-from` for skill dependency chains
- No telemetry, no preamble scripts
- Can be used as ORG.md agent role definitions

### gstack SKILL.md

```yaml
---
name: plan-ceo-review
version: 1.0.0
description: |
  CEO/founder-mode plan review...
benefits-from: [office-hours]
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl -->

## Preamble (run first)
[bash scripts for telemetry, sessions, upgrade checks...]

## Completeness Principle
[Injected ethos...]

## Search Before Building
[Injected ethos...]
```

**Characteristics:**
- Generated from `.tmpl` templates
- Heavy preamble with telemetry, session tracking, upgrade checks
- Ethos sections (completeness, search) injected into every skill
- `AskUserQuestion` as a tool (Claude Code specific)
- Contributor mode with field reports

### Claude Code Skills

```
.claude/skills/
  my-skill/
    SKILL.md
```

**Characteristics:**
- Stored in `.claude/skills/` directory
- Loaded by Claude Code automatically
- No strict frontmatter requirement
- Focus on instructional content

### OpenClaw Skills

```
~/.openclaw/workspace/skills/
  my-skill/
    SKILL.md
    scripts/    (optional)
    references/ (optional)
```

**Characteristics:**
- Stored in workspace skills directory
- `<description>` tag used for skill matching
- May include `scripts/` and `references/` directories
- Loaded by OpenClaw agent on skill match

## Importing Skills

### gstack → OpenSpawn

```bash
openspawn skills import https://github.com/garrytan/gstack.git
```

When importing gstack skills, OpenSpawn:
1. Copies the skill directory
2. Validates the SKILL.md frontmatter
3. Strips gstack-specific preamble (telemetry, upgrade checks)
4. Preserves the instructional content

### OpenClaw → OpenSpawn

```bash
openspawn skills import ~/.openclaw/workspace/skills/my-skill
```

### Claude Code → OpenSpawn

```bash
openspawn skills import .claude/skills/my-skill
```

## Exporting Skills

### OpenSpawn → Claude Code

```bash
openspawn skills export docs/templates/org-roles/reviewer-ceo.yaml -o .claude/skills/
```

### OpenSpawn → OpenClaw

```bash
openspawn skills export docs/templates/org-roles/reviewer-ceo.yaml -o ~/.openclaw/workspace/skills/
```

## Best Practices

1. **Always include `name` and `description`** — the universal common subset
2. **Version your skills** — helps with updates and compatibility tracking
3. **Keep instructions platform-agnostic** — don't assume Claude Code's `AskUserQuestion` or gstack's preamble
4. **Use `allowed-tools` sparingly** — list only what's actually needed, not every possible tool
5. **Test portability** — run `openspawn skills validate <path>` before publishing

## Schema Reference

```yaml
---
# Required
name: string         # Unique skill identifier
description: string  # What this skill does (1-3 sentences)

# Recommended
version: string      # SemVer (e.g., "1.0.0")

# Optional
allowed-tools:       # List of tools this skill needs
  - Read
  - Write
  - Bash
benefits-from:       # Skills that enhance this one
  - office-hours
---

# Skill Title

[Markdown instructions, examples, and documentation]
```

---

*This guide covers compatibility as of March 2026. Formats may evolve.*
