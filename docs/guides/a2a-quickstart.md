# A2A Quick Start

Get two agents talking in 5 minutes.

## Prerequisites

- Node.js 20+
- OpenSpawn CLI installed (`npm i -g openspawn`)
- Two OpenClaw agent instances (or one for testing)

## 1. Start the Router

```bash
cd tools/a2a-router
npx tsx src/index.ts
```

You should see:
```
🔄 A2A Router listening on http://127.0.0.1:3380
   Health: http://127.0.0.1:3380/health
   JSON-RPC: http://127.0.0.1:3380/a2a/jsonrpc
   Discovery: http://127.0.0.1:3380/.well-known/agent.json
```

## 2. Register Your Agents

Register the sender:
```bash
curl -s -X POST http://127.0.0.1:3380/a2a/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "dennis",
    "name": "Dennis",
    "gateway_url": "http://127.0.0.1:3381",
    "skills": ["coding", "devops"]
  }' | jq .
```

Register the target:
```bash
curl -s -X POST http://127.0.0.1:3380/a2a/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "drinkify",
    "name": "Drinkify",
    "gateway_url": "http://127.0.0.1:3382",
    "skills": ["drinks", "inventory"]
  }' | jq .
```

Verify they're registered:
```bash
openspawn a2a agents
```

## 3. Install the Reporter Skill

The target agent needs to know how to report results. Copy the `a2a-reporter` skill:

```bash
cp -r skills/a2a-reporter/ ~/.openclaw/workspace/skills/a2a-reporter/
```

This teaches the agent to call back the router when it finishes a task.

## 4. Send a Message

```bash
openspawn a2a send drinkify "What are you working on?"
```

The CLI will:
1. Create a task on the router
2. Router delivers it to drinkify's gateway
3. Poll until drinkify reports back

For fire-and-forget:
```bash
openspawn a2a send drinkify "Deploy staging" --async
# → 📤 Task created: abc-123
#    Use: openspawn a2a task abc-123
```

## 5. Check the Result

```bash
openspawn a2a task <task-id>
```

Output:
```
✅ Task abc-123

  Status:  completed
  From:    dennis
  To:      drinkify
  Created: 2026-03-25T12:00:00.000Z

  Message: What are you working on?

  Result: Currently working on inventory sync and the new cocktail recommendation engine.
```

## Using the JSON-RPC API Directly

If you prefer raw API calls over the CLI:

```bash
# Send a message
curl -s -X POST http://127.0.0.1:3380/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "message/send",
    "params": {
      "agentId": "drinkify",
      "senderId": "dennis",
      "message": {
        "kind": "message",
        "messageId": "msg-001",
        "role": "user",
        "parts": [{"kind": "text", "text": "What are you working on?"}]
      }
    }
  }' | jq .

# Get task status
curl -s -X POST http://127.0.0.1:3380/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tasks/get",
    "params": {"taskId": "TASK_ID_HERE"}
  }' | jq .
```

## Verify Compliance

Test that the router is A2A v1.0 compliant:

```bash
openspawn a2a test
```

```
A2A Compliance Test — http://127.0.0.1:3380
✅ Agent discovery (/.well-known/agent.json)
✅ message/send — creates task
✅ tasks/get — retrieves task
✅ tasks/list — pagination works
✅ tasks/cancel — cancels task
✅ Error handling — invalid JSON
✅ Error handling — unknown method
✅ Error handling — missing params

8/8 tests passed — A2A v1.0 compliant ✓
```

## Next Steps

- Read the [full A2A Protocol Guide](./a2a-protocol.md) for the complete API reference
- Set up push notifications with `gateway_token` for HMAC-signed webhooks
- Explore agent discovery at `/.well-known/agent.json`
