---
title: Agent Modes
layout: default
parent: Features
nav_order: 1
---

# Agent Modes

Agent modes provide operational restrictions that control what actions an agent can perform. This is inspired by Claude Code's "delegate mode" - allowing you to create coordination-focused agents that manage other agents without doing work themselves.

## Available Modes

### Worker Mode (Default)
**Full operational access**

Workers can do everything - execute tasks, spawn agents, send messages, and perform all available actions. This is the default mode for most agents.

```typescript
// Register a worker agent
POST /api/v1/agents/register
{
  "agentId": "worker-001",
  "name": "Task Executor",
  "mode": "worker"
}
```

### Orchestrator Mode
**Coordination only**

Orchestrators are leadership agents that coordinate work but don't execute tasks themselves. Think of them as managers, CEOs, or HR directors.

**Allowed actions:**
- Spawn new agents
- Assign tasks to workers
- Send messages
- Approve/reject work
- Create tasks

**Blocked actions:**
- Execute tasks directly
- Claim work for themselves

```typescript
// Register an orchestrator agent (CEO, HR, Manager)
POST /api/v1/agents/register
{
  "agentId": "ceo",
  "name": "Chief Executive Officer",
  "role": "founder",
  "mode": "orchestrator",
  "level": 10
}
```

### Observer Mode
**Read-only access**

Observers can monitor the system but cannot make any changes. Useful for audit agents, monitoring dashboards, or external integrations that need visibility.

**Allowed actions:**
- View data
- Monitor activity
- Read messages and tasks

**Blocked actions:**
- All modifications

```typescript
// Register an observer agent
POST /api/v1/agents/register
{
  "agentId": "auditor",
  "name": "Compliance Monitor",
  "mode": "observer"
}
```

## Using Mode Guards in API Endpoints

You can protect endpoints to require specific modes:

```typescript
import { RequiresMode, AgentModeGuard } from '../auth';
import { AgentMode } from '@openspawn/shared-types';

@Controller('tasks')
@UseGuards(AgentModeGuard)
export class TasksController {
  
  // Only workers can execute tasks
  @Post(':id/execute')
  @RequiresMode(AgentMode.WORKER)
  async executeTask() { ... }
  
  // Workers and orchestrators can create tasks
  @Post()
  @RequiresMode(AgentMode.WORKER, AgentMode.ORCHESTRATOR)
  async createTask() { ... }
  
  // Anyone can read (no decorator = all modes allowed)
  @Get()
  async listTasks() { ... }
}
```

## Checking Mode in Code

```typescript
import { isModeAllowed, AgentMode } from '@openspawn/shared-types';

// Check if an action is allowed for a mode
if (isModeAllowed(agent.mode, 'execute')) {
  await executeTask(taskId);
} else {
  throw new ForbiddenException('Orchestrators cannot execute tasks directly');
}
```

## Dashboard UI

The dashboard displays agent modes with distinctive badges:

- **Worker**: 💼 Green badge - full access
- **Orchestrator**: 🌐 Purple badge - coordination only  
- **Observer**: 👁 Gray badge - read only

You can change an agent's mode in the Edit Agent dialog or via the API.

## Best Practices

1. **CEO/Founder agents** should be orchestrators - they coordinate but don't do the work
2. **HR agents** recruiting new workers should be orchestrators
3. **Task executor agents** should be workers
4. **Monitoring/audit systems** should be observers
5. **Start restrictive** - you can always upgrade mode later

## Example: Multi-Agent Company

```
CEO (orchestrator, L10)
├── HR Director (orchestrator, L9)
│   └── Recruiter (worker, L5)
├── CTO (orchestrator, L9)
│   ├── Senior Dev (worker, L7)
│   └── Junior Dev (worker, L4)
└── Auditor (observer, L8)
```

The CEO and HR Director coordinate; Senior/Junior Devs execute work; the Auditor watches everything.
