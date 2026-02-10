---
title: OpenClaw Skill
layout: default
parent: Features
nav_order: 10
---

# OpenClaw Integration

{: .no_toc }

Bridge OpenClaw and BikiniBottom to enable autonomous multi-agent orchestration from a single OpenClaw instance.

{: .fs-6 .fw-300 }

---

## Table of Contents

{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The **OpenClaw Agent Skill** allows OpenClaw agents to interact with BikiniBottom/BikiniBottom instances, enabling powerful multi-agent orchestration workflows. Your OpenClaw agent becomes a meta-orchestrator, managing entire fleets of specialized AI agents.

### What is OpenClaw?

[OpenClaw](https://github.com/chand1012/openclaw) is an open-source AI agent framework that provides persistent, long-running agents with memory, skills, and tool use. Think of it as a personal AI assistant that lives on your machine or server.

### The Integration

This skill transforms OpenClaw into a control plane for BikiniBottom/BikiniBottom:

```
┌─────────────────┐
│   OpenClaw      │  ← Your personal agent
│   Agent         │
└────────┬────────┘
         │
         │ BikiniBottom Skill
         │
         ▼
┌─────────────────────────────────┐
│  BikiniBottom/BikiniBottom         │
│  ┌──────────┐  ┌──────────┐    │
│  │ Agent 1  │  │ Agent 2  │    │  ← Specialized agents
│  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐    │
│  │ Agent 3  │  │ Agent 4  │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

## Installation

### Prerequisites

- OpenClaw installed and configured
- BikiniBottom/BikiniBottom instance (cloud or self-hosted)
- API key from your BikiniBottom instance
- `jq` installed (`brew install jq` on macOS)

### Setup

1. **Clone the skill into your OpenClaw skills directory:**

```bash
cd ~/.openclaw/skills
git clone https://github.com/openspawn/openspawn.git
cd openspawn/skills/openclaw
```

2. **Configure environment variables:**

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export OPENSPAWN_URL="https://your-openspawn-instance.com"
export OPENSPAWN_API_KEY="your-api-key-here"
```

Or use a `.env` file in your OpenClaw workspace.

3. **Verify installation:**

```bash
./scripts/openspawn-cli.sh metrics
```

## Core Capabilities

### 1. Agent Management

Create and manage specialized agents within your BikiniBottom instance.

**List all agents:**
```bash
./scripts/openspawn-cli.sh agents list
```

**Get agent details:**
```bash
./scripts/openspawn-cli.sh agents get agent_abc123
```

**Create a new agent:**
```bash
./scripts/openspawn-cli.sh agents create
# Interactive prompts for name, role, model, instructions
```

### 2. Task Orchestration

Coordinate work across multiple agents.

**List tasks with filters:**
```bash
# All tasks
./scripts/openspawn-cli.sh tasks list

# Pending tasks only
./scripts/openspawn-cli.sh tasks list --status pending

# Tasks for specific agent
./scripts/openspawn-cli.sh tasks list --assignee agent_123
```

**Create and assign tasks:**
```bash
# Create task (interactive)
./scripts/openspawn-cli.sh tasks create

# Assign to agent
./scripts/openspawn-cli.sh tasks assign task_456 agent_123

# Mark complete
./scripts/openspawn-cli.sh tasks complete task_456
```

### 3. Inter-Agent Communication

Enable peer-to-peer messaging between agents.

```bash
./scripts/openspawn-cli.sh messages send agent_001 agent_002 "Analysis complete, ready for review"
```

### 4. System Monitoring

Track performance and resource usage.

```bash
./scripts/openspawn-cli.sh metrics
```

Returns:
- Total agent count
- Active agents
- Task statistics (pending, in-progress, completed)
- Credit usage and balance

## Usage Patterns

### Pattern 1: Automated Heartbeat Monitoring

Add to your OpenClaw `HEARTBEAT.md`:

```markdown
### BikiniBottom Status Check (2x daily)

**Command:** `cd ~/.openclaw/skills/openspawn/skills/openclaw && ./scripts/openspawn-cli.sh metrics`

**Alert conditions:**
- Pending tasks > 20
- Any agent with status = error
- Credit balance < 100

**Last checked:** Track in memory/heartbeat-state.json
```

Your OpenClaw agent will now autonomously monitor your BikiniBottom instance and alert you to issues.

### Pattern 2: Research Pipeline Orchestration

```bash
# Your OpenClaw agent coordinates a multi-stage research workflow

# 1. Create research task
task_id=$(./scripts/openspawn-cli.sh tasks create | jq -r '.id')

# 2. Assign to research agent
./scripts/openspawn-cli.sh tasks assign $task_id researcher_agent

# 3. Wait for completion (check in heartbeat)
# ...

# 4. Create analysis task
analysis_id=$(./scripts/openspawn-cli.sh tasks create | jq -r '.id')

# 5. Send message to analyst
./scripts/openspawn-cli.sh messages send researcher_agent analyst_agent \
  "Research complete, data ready for analysis"

# 6. Assign analysis task
./scripts/openspawn-cli.sh tasks assign $analysis_id analyst_agent
```

### Pattern 3: On-Demand Agent Creation

```bash
# User asks OpenClaw: "I need someone to analyze this dataset"

# OpenClaw creates a specialized data analyst agent
./scripts/openspawn-cli.sh agents create
# Name: Data Analyst 2024-02-10
# Role: Statistical data analyst
# Model: gpt-4
# Instructions: Expert in statistical analysis, Python, pandas

# Creates task and assigns
./scripts/openspawn-cli.sh tasks create
./scripts/openspawn-cli.sh tasks assign task_789 analyst_new
```

### Pattern 4: Daily Standup Report

Add a cron job or heartbeat task:

```bash
# Generate daily team report
agents=$(./scripts/openspawn-cli.sh agents list)
tasks=$(./scripts/openspawn-cli.sh tasks list --status in-progress)
metrics=$(./scripts/openspawn-cli.sh metrics)

# OpenClaw formats this into a digest and sends via email/Telegram
```

## Advanced Workflows

### Multi-Stage Content Pipeline

1. **Writer Agent** creates draft → task_001
2. **Editor Agent** reviews and edits → task_002
3. **SEO Agent** optimizes for search → task_003
4. **Publisher Agent** publishes to platform → task_004

All orchestrated by a single OpenClaw agent monitoring task completion and assigning the next stage.

### Distributed Research Team

- **Scraper Agent**: Gather data from sources
- **Analyzer Agent**: Process and analyze data
- **Summarizer Agent**: Create executive summaries
- **Reporter Agent**: Generate formatted reports

OpenClaw coordinates handoffs via messages and task assignments.

### Development Workflow

- **Planner Agent**: Break down features into tasks
- **Coder Agent**: Implement features
- **Tester Agent**: Run tests and validate
- **Deployer Agent**: Deploy to production

OpenClaw manages the pipeline, ensuring each stage completes before moving forward.

## Security Best Practices

### API Key Management

**❌ Don't:**
- Commit API keys to Git
- Share keys in chat logs
- Use the same key across environments

**✅ Do:**
- Use environment variables
- Rotate keys periodically
- Use separate keys for dev/staging/production
- Set key permissions to minimum required scope

### Network Security

- Use HTTPS for all API communication (enforced by default)
- Restrict API access by IP if possible
- Monitor API usage for anomalies

### Access Control

- Give OpenClaw agents only the permissions they need
- Review agent actions in BikiniBottom audit logs
- Set up alerts for sensitive operations

## Troubleshooting

### "Authentication failed"

**Cause:** Invalid or expired API key

**Fix:**
1. Verify `OPENSPAWN_API_KEY` is set: `echo $OPENSPAWN_API_KEY`
2. Generate new key from BikiniBottom dashboard
3. Update environment variable

### "Connection refused"

**Cause:** BikiniBottom instance not reachable

**Fix:**
1. Verify URL: `echo $OPENSPAWN_URL`
2. Check instance status: `curl -I $OPENSPAWN_URL/health`
3. Ensure no firewall blocking

### "jq: command not found"

**Cause:** Missing dependency

**Fix:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Other Linux
# Install via package manager
```

### Agent not appearing in list

**Cause:** Pagination or filter issue

**Fix:**
- Check if using any filters: `tasks list` vs `tasks list --status pending`
- Verify agent was created: check the response from `agents create`
- Check directly by ID: `agents get <agent-id>`

## API Reference

The skill wraps these BikiniBottom REST endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents/:id` | GET | Get agent details |
| `/api/agents` | POST | Create new agent |
| `/api/tasks` | GET | List tasks (with filters) |
| `/api/tasks` | POST | Create new task |
| `/api/tasks/:id/assign` | PATCH | Assign task to agent |
| `/api/tasks/:id/complete` | PATCH | Mark task complete |
| `/api/messages` | POST | Send peer message |
| `/api/metrics` | GET | Get system metrics |

See the [BikiniBottom API documentation](/docs/api) for detailed endpoint specifications.

## Examples

See the [SKILL.md](https://github.com/openspawn/openspawn/blob/main/skills/openclaw/SKILL.md) file for comprehensive usage examples.

## Community

- **GitHub**: [openspawn/openspawn](https://github.com/openspawn/openspawn)
- **Discord**: Join the BikiniBottom community
- **Issues**: [Report bugs or request features](https://github.com/openspawn/openspawn/issues)

## Contributing

Found a bug? Have an idea for improvement?

1. Fork the repo
2. Create a feature branch
3. Make your changes in `skills/openclaw/`
4. Submit a pull request

We welcome contributions!

---

{: .fs-3 }
**Next Steps:** Check out the [CLI documentation](/cli) and [case studies](/case-studies) for more advanced workflows.
