# 🌊 OpenSpawn Agent Skill for OpenClaw

**Unleash the power of BikiniBottom multi-agent orchestration from your OpenClaw instance.**

## What is This?

The OpenSpawn Agent Skill bridges OpenClaw and BikiniBottom/OpenSpawn, enabling your OpenClaw agents to autonomously manage entire fleets of AI agents, orchestrate complex task workflows, and monitor system performance—all through simple shell commands.

## Why You Need It

### For Solo OpenClaw Users
- **Scale beyond one agent**: Spin up specialized agents on-demand for different tasks
- **Automate agent coordination**: Let your OpenClaw agent manage task distribution across your OpenSpawn instance
- **Monitor at a glance**: Quick metrics on all your agents and tasks

### For Teams
- **Central orchestration**: One OpenClaw agent managing multiple OpenSpawn agents across different domains
- **Task delegation**: Automatically route tasks to the best-suited agent
- **Inter-agent messaging**: Facilitate communication between specialized agents

### For Multi-Agent Workflows
- **Research pipelines**: Coordinate data gathering, analysis, and reporting agents
- **Content creation**: Manage writer, editor, and publisher agents
- **Development workflows**: Coordinate planning, coding, testing, and deployment agents

## Quick Start

### 1. Install the Skill

```bash
cd ~/.openclaw/skills
git clone https://github.com/openspawn/openspawn.git
cd openspawn/skills/openclaw
```

### 2. Configure

Add to your OpenClaw environment:

```bash
export OPENSPAWN_URL="https://your-instance.com"
export OPENSPAWN_API_KEY="your-api-key"
```

### 3. Test It

```bash
./scripts/openspawn-cli.sh metrics
```

## What Can You Do?

### 🤖 Agent Management
- List all agents in your OpenSpawn instance
- Create new specialized agents programmatically
- Monitor agent status and performance

### ✅ Task Orchestration
- Create and assign tasks across your agent fleet
- Filter tasks by status, assignee, priority
- Auto-complete tasks when goals are met

### 💬 Inter-Agent Communication
- Send messages between agents
- Build agent collaboration workflows
- Enable peer-to-peer agent coordination

### 📊 System Monitoring
- Track agent count and activity
- Monitor task completion rates
- View credit usage and balances

## Real-World Use Cases

### Use Case 1: Automated Research Pipeline

```bash
# Your OpenClaw agent orchestrates a research team:
# 1. Create a research task
./scripts/openspawn-cli.sh tasks create  # "Research AI safety papers from 2024"

# 2. Assign to specialized research agent
./scripts/openspawn-cli.sh tasks assign task_123 researcher_agent

# 3. Monitor progress
./scripts/openspawn-cli.sh tasks list --assignee researcher_agent

# 4. When complete, assign analysis to another agent
./scripts/openspawn-cli.sh tasks assign task_124 analyst_agent
```

### Use Case 2: Content Creation Workflow

```bash
# Coordinate writer → editor → publisher pipeline
# Writer agent creates draft
./scripts/openspawn-cli.sh tasks assign draft_task writer_agent

# Send to editor when ready
./scripts/openspawn-cli.sh messages send writer_agent editor_agent "Draft ready for review"

# Editor approves and hands off
./scripts/openspawn-cli.sh tasks assign publish_task publisher_agent
```

### Use Case 3: 24/7 Monitoring

Add to your OpenClaw `HEARTBEAT.md`:

```markdown
### OpenSpawn Health Check (every 2 hours)

Run: `./skills/openclaw/scripts/openspawn-cli.sh metrics`

Alert me if:
- Pending tasks > 20
- Any agent status = error
- Credit balance < 100
```

## Features

✨ **Zero Dependencies** (beyond curl and jq)  
🔒 **Secure** API key authentication  
📝 **Well Documented** - See SKILL.md for full docs  
🎯 **Production Ready** - Error handling and validation built-in  
🚀 **Fast** - Shell script performance, no overhead

## API Coverage

This skill wraps the complete OpenSpawn REST API:

- ✅ Agent management (list, get, create)
- ✅ Task orchestration (list, create, assign, complete)
- ✅ Messaging (peer-to-peer agent communication)
- ✅ Metrics & monitoring (system-wide stats)

## Requirements

- **OpenClaw** (obviously!)
- **BikiniBottom/OpenSpawn instance** (cloud or self-hosted)
- **curl** (built into macOS/Linux)
- **jq** - Install with `brew install jq`

## Documentation

- **[SKILL.md](./SKILL.md)** - Complete skill documentation
- **[OpenSpawn Docs](https://github.com/openspawn/openspawn)** - Full platform docs
- **[API Reference](https://github.com/openspawn/openspawn/tree/main/docs/api)** - REST API endpoints

## Support

- **Issues**: [GitHub Issues](https://github.com/openspawn/openspawn/issues)
- **Discord**: Join the BikiniBottom community
- **Twitter**: [@openspawn](https://twitter.com/openspawn)

## Contributing

Found a bug? Want to add features? PRs welcome!

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn
# Make your changes in skills/openclaw/
git checkout -b feat/your-feature
git push origin feat/your-feature
```

## License

MIT © OpenSpawn Team

---

<div align="center">

**Made with 🌊 by the BikiniBottom team**

[Website](https://openspawn.com) · [GitHub](https://github.com/openspawn/openspawn) · [Docs](https://docs.openspawn.com)

</div>
