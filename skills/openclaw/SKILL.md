# OpenSpawn Agent Skill

Manage BikiniBottom/OpenSpawn agents, tasks, and metrics from OpenClaw.

## What It Does

This skill enables OpenClaw agents to interact with a BikiniBottom/OpenSpawn instance, allowing you to:

- **Manage Agents**: List, view details, and create AI agents
- **Orchestrate Tasks**: Create, assign, list, and complete tasks
- **Facilitate Communication**: Send peer-to-peer messages between agents
- **Monitor Metrics**: Track agent counts, task statistics, and credit usage

## Configuration

Set these environment variables in your OpenClaw configuration:

```bash
export OPENSPAWN_URL="https://your-openspawn-instance.com"
export OPENSPAWN_API_KEY="your-api-key-here"
```

### Getting Your API Key

1. Log into your BikiniBottom/OpenSpawn dashboard
2. Navigate to Settings → API Keys
3. Generate a new API key for OpenClaw integration
4. Store it securely in your environment

## Available Commands

All commands are available through the `openspawn-cli.sh` script.

### Agent Management

#### List All Agents
```bash
./scripts/openspawn-cli.sh agents list
```

Returns a JSON array of all agents with their IDs, names, roles, and status.

#### Get Agent Details
```bash
./scripts/openspawn-cli.sh agents get <agent-id>
```

Returns detailed information about a specific agent.

#### Create a New Agent
```bash
./scripts/openspawn-cli.sh agents create
```

Interactive prompt to create a new agent. You'll be asked for:
- Name
- Role/persona
- Model preference
- Initial instructions

### Task Management

#### List Tasks
```bash
# List all tasks
./scripts/openspawn-cli.sh tasks list

# Filter by status
./scripts/openspawn-cli.sh tasks list --status pending

# Filter by assignee
./scripts/openspawn-cli.sh tasks list --assignee <agent-id>
```

#### Create a Task
```bash
./scripts/openspawn-cli.sh tasks create
```

Interactive prompt to create a new task with title, description, and priority.

#### Assign a Task
```bash
./scripts/openspawn-cli.sh tasks assign <task-id> <agent-id>
```

Assigns a task to a specific agent.

#### Complete a Task
```bash
./scripts/openspawn-cli.sh tasks complete <task-id>
```

Marks a task as completed.

### Communication

#### Send Peer Message
```bash
./scripts/openspawn-cli.sh messages send <from-agent-id> <to-agent-id> "Message content"
```

Sends a message from one agent to another within the OpenSpawn network.

### Metrics & Monitoring

#### Get Dashboard Metrics
```bash
./scripts/openspawn-cli.sh metrics
```

Returns system-wide metrics including:
- Total agent count
- Active agents
- Task statistics (pending, in-progress, completed)
- Credit usage and balance

## Usage Examples

### Example 1: Check System Status

```bash
# Get overall metrics
./scripts/openspawn-cli.sh metrics

# List all agents
./scripts/openspawn-cli.sh agents list

# Check pending tasks
./scripts/openspawn-cli.sh tasks list --status pending
```

### Example 2: Create and Assign a Task Workflow

```bash
# Create a new task (follow prompts)
./scripts/openspawn-cli.sh tasks create

# List agents to find the right one
./scripts/openspawn-cli.sh agents list

# Assign task to agent
./scripts/openspawn-cli.sh tasks assign task_abc123 agent_xyz789

# Later, mark it complete
./scripts/openspawn-cli.sh tasks complete task_abc123
```

### Example 3: Agent Communication

```bash
# Send a message between agents
./scripts/openspawn-cli.sh messages send agent_001 agent_002 "Please review the latest data analysis"
```

## Integration with OpenClaw

When using this skill in OpenClaw, the agent can autonomously:

- Monitor your OpenSpawn instance for task completion
- Create agents on-demand for specialized work
- Orchestrate multi-agent workflows
- Report on system performance

### Automated Heartbeat Check

Add to your `HEARTBEAT.md`:

```markdown
### OpenSpawn Status (check 2x/day)

- Run `cd ~/skills/openclaw && ./scripts/openspawn-cli.sh metrics`
- Alert if pending tasks > 10
- Alert if any agents are stuck (status = error)
```

## API Endpoints Used

This skill wraps the following OpenSpawn REST API endpoints:

- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create agent
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/assign` - Assign task
- `PATCH /api/tasks/:id/complete` - Complete task
- `POST /api/messages` - Send message
- `GET /api/metrics` - Get metrics

## Requirements

- **curl** - For HTTP requests
- **jq** - For JSON parsing and formatting

Install on macOS:
```bash
brew install jq
```

Install on Linux:
```bash
sudo apt-get install jq
```

## Troubleshooting

### "Authentication failed"
- Verify `OPENSPAWN_API_KEY` is set correctly
- Check that your API key hasn't expired
- Ensure your IP is not blocked

### "Connection refused"
- Verify `OPENSPAWN_URL` is correct
- Check that your OpenSpawn instance is running
- Test with: `curl -I $OPENSPAWN_URL/health`

### "jq: command not found"
- Install jq using the commands above

## Security Notes

- Never commit API keys to version control
- Use environment variables or secret managers
- Rotate API keys periodically
- Limit API key permissions to minimum required scope

## Support

- **Documentation**: https://github.com/openspawn/openspawn/tree/main/docs
- **Issues**: https://github.com/openspawn/openspawn/issues
- **Discord**: Join the BikiniBottom community

---

**Version**: 1.0.0  
**Author**: OpenSpawn Team  
**License**: MIT
