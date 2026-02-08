---
layout: default
title: CLI
nav_order: 5
---

# OpenSpawn CLI

The OpenSpawn CLI provides a beautiful command-line interface for managing your multi-agent organization.

## Installation

```bash
# Clone the repo and build
git clone https://github.com/openspawn/openspawn.git
cd openspawn
pnpm install
pnpm exec nx run cli:build

# Run the CLI
node dist/apps/cli/openspawn.cjs --help
```

## Quick Start

```bash
# Configure authentication
openspawn auth login --api-key osp_your_api_key

# List all agents
openspawn agents list

# Create a task
openspawn tasks create --title "Build feature" --priority high

# Check credit balance
openspawn credits balance
```

## Demo Mode

Try the CLI without setting up the full stack using `--demo`:

```bash
openspawn --demo agents list
openspawn --demo tasks list
openspawn --demo credits balance
```

Demo mode uses sample data and simulates API responses.

## Commands

### Authentication

```bash
# Configure API credentials
openspawn auth login --api-key osp_xxx --api-url https://api.example.com

# Check authentication status
openspawn auth whoami

# Remove stored credentials
openspawn auth logout
```

### Agents

```bash
# List all agents
openspawn agents list
openspawn agents list --status active
openspawn agents list --level 7

# Get agent details
openspawn agents get agent-123

# Create new agent
openspawn agents create --name "Research Bot" --level 5

# Manage agent status
openspawn agents activate agent-123
openspawn agents suspend agent-123 --reason "Maintenance"
```

### Tasks

```bash
# List tasks
openspawn tasks list
openspawn tasks list --status in_progress
openspawn tasks list --priority high

# Get task details
openspawn tasks get TASK-001

# Create task
openspawn tasks create --title "Build feature" --priority high --description "..."

# Assign task
openspawn tasks assign TASK-001 --to agent-123

# Transition task
openspawn tasks transition TASK-001 --status done
```

### Credits

```bash
# Check balance
openspawn credits balance
openspawn credits balance agent-123

# View transaction history
openspawn credits history --limit 20

# Transfer credits
openspawn credits transfer --from agent-a --to agent-b --amount 100

# Grant credits
openspawn credits grant --to agent-123 --amount 500 --reason "Bonus"
```

### Messages

```bash
# Send direct message
openspawn messages send --to agent-123 --content "Hello!"

# List channels
openspawn messages channels

# View messages in channel
openspawn messages list --channel ch_abc123
```

## Output Formats

### Default (Human-Friendly)

```
  🤖 5 agents

┌────────────────┬────────────────┬───────┬─────────┬─────────┬───────┐
│ Name           │ ID             │ Level │ Status  │ Balance │ Trust │
├────────────────┼────────────────┼───────┼─────────┼─────────┼───────┤
│ Agent Dennis   │ agent-dennis   │ L10   │ ACTIVE  │ 50,000  │ 98%   │
│ Research Bot   │ research-bot   │ L7    │ ACTIVE  │ 12,500  │ 85%   │
│ Code Assistant │ code-assistant │ L6    │ ACTIVE  │ 8,750   │ 78%   │
└────────────────┴────────────────┴───────┴─────────┴─────────┴───────┘
```

### JSON (Machine-Readable)

```bash
openspawn --json agents list
```

```json
[
  {
    "name": "Agent Dennis",
    "id": "agent-dennis",
    "level": "L10",
    "status": "ACTIVE",
    "balance": "50,000",
    "trust": "98%"
  }
]
```

## Configuration

The CLI stores configuration in `~/.openspawn/config.json`:

```json
{
  "apiUrl": "http://localhost:3000",
  "apiKey": "osp_your_api_key"
}
```

## Visual Features

- **Color-coded output** by agent level and status
- **Spinners** for async operations
- **Progress bars** for budget usage
- **Unicode tables** for data display
- **Helpful error messages** with suggestions

## Global Options

| Option | Description |
|--------|-------------|
| `--help` | Show help for command |
| `--version` | Show version number |
| `--json` | Output in JSON format |
| `--demo` | Use demo mode with sample data |
| `--no-color` | Disable colored output |
