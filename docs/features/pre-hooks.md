---
title: Pre-Hooks
layout: default
parent: Features
nav_order: 4
---

# Pre-Hooks with Blocking

Webhooks that fire BEFORE an action occurs, with the ability to block the action based on external validation.

## Overview

Pre-hooks allow external systems to approve or reject actions before they execute. This is useful for:

- **Compliance checks** - Verify actions meet regulatory requirements
- **Budget approvals** - Block spending above thresholds
- **Quality gates** - Require external review before task completion
- **Custom business rules** - Enforce organization-specific policies

## Database Schema

New columns added to `webhooks` table:

```sql
hook_type VARCHAR(10) DEFAULT 'post'  -- 'pre' or 'post'
can_block BOOLEAN DEFAULT false       -- Whether pre-hook can block actions
timeout_ms INT DEFAULT 5000           -- Timeout for pre-hook execution
```

## API

### Create Pre-Hook

```http
POST /webhooks
Content-Type: application/json

{
  "name": "Compliance Check",
  "url": "https://compliance.example.com/webhook",
  "events": ["task.transition"],
  "hookType": "pre",
  "canBlock": true,
  "timeoutMs": 5000
}
```

### Pre-Hook Request Payload

When a pre-hook fires, BikiniBottom sends:

```json
{
  "event": "task.transition",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "taskId": "uuid",
    "taskIdentifier": "TASK-001",
    "taskTitle": "Implement feature X",
    "fromStatus": "IN_PROGRESS",
    "toStatus": "DONE",
    "actorId": "agent-uuid",
    "hookType": "pre",
    "requiresResponse": true
  }
}
```

Headers include:
- `X-BikiniBottom-Event`: Event type
- `X-BikiniBottom-Hook-Type`: "pre"
- `X-BikiniBottom-Signature`: HMAC signature (if secret configured)

### Pre-Hook Response

Your endpoint must respond with JSON:

```json
{
  "allow": true
}
```

Or to block the action:

```json
{
  "allow": false,
  "reason": "Requires manager approval for this transition"
}
```

### Timeout Behavior

- Pre-hooks have a configurable timeout (1-30 seconds)
- If timeout is exceeded, the action **proceeds** (fail-open)
- This prevents blocking operations due to webhook failures

## Supported Events

Pre-hooks can be configured for:

| Event | Description |
|-------|-------------|
| `task.transition` | Task status changes (especially → DONE) |
| `task.created` | New task creation |
| `agent.spawned` | New agent creation |
| `credit.spent` | Credit spending (useful for budget controls) |
| `*` | All events |

## Error Handling

- **Network failures**: Action proceeds (fail-open)
- **Non-2xx response**: Treated as error, action proceeds
- **Invalid JSON**: Treated as error, action proceeds
- **After 10 consecutive failures**: Webhook is auto-disabled

## Dashboard UI

The Settings → Webhooks tab now includes:

- Hook type toggle (Pre-Hook vs Post-Hook)
- Blocking toggle for pre-hooks
- Timeout configuration slider
- Visual indicators for blocking hooks
- Test button with pre-hook response display

## Demo Simulation

The demo mode includes simulated pre-hooks that occasionally block actions, demonstrating the feature with toast notifications.

## Best Practices

1. **Keep pre-hooks fast** - Set reasonable timeouts (3-5s recommended)
2. **Design for failure** - Pre-hooks fail-open to prevent blocking on issues
3. **Log decisions** - BikiniBottom emits `webhook.executed` events for audit
4. **Test thoroughly** - Use the test button before enabling blocking

## Example: Budget Approval Hook

```javascript
// Express.js endpoint
app.post('/webhooks/budget-check', (req, res) => {
  const { data } = req.body;
  
  if (data.amount > 1000) {
    return res.json({
      allow: false,
      reason: `Amount ${data.amount} exceeds approval threshold of 1000`
    });
  }
  
  res.json({ allow: true });
});
```

Closes #109
