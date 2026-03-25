# A2A Reporter

Report task completion back to the OpenSpawn A2A router when you receive an A2A task.

## When to Use
When you receive a message containing `[a2a:task:<id>]` — this means another agent sent you a task via the A2A protocol.

## How It Works

1. Messages with `[a2a:task:<uuid>]` at the start are A2A tasks from other agents
2. Do the requested work normally
3. When done, report completion:

```bash
curl -s -X POST http://127.0.0.1:3380/a2a/tasks/<task-id>/complete \
  -H "Content-Type: application/json" \
  -d '{"agentId":"YOUR_AGENT_ID","status":"completed","result":"Brief summary of what you did and the outcome"}'
```

4. If you fail or get blocked:

```bash
curl -s -X POST http://127.0.0.1:3380/a2a/tasks/<task-id>/complete \
  -H "Content-Type: application/json" \
  -d '{"agentId":"YOUR_AGENT_ID","status":"failed","result":"What went wrong and why"}'
```

## Important
- The task ID is the UUID after `[a2a:task:` — extract it from the message
- Always report completion or failure — the sending agent is waiting
- Keep the result summary concise but useful
- Your agent ID is in your IDENTITY.md or AGENTS.md
