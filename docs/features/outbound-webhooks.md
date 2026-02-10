# Outbound Webhooks

Outbound webhooks allow OpenSpawn to send HTTP callbacks to external services when events occur in your organization. This enables integrations with third-party tools, custom workflows, and real-time notifications.

## Overview

OpenSpawn supports two types of webhooks:

- **Post-Hooks**: Fire after an action completes (async, non-blocking)
- **Pre-Hooks**: Fire before an action occurs and can block/approve the action

## Available Event Types

| Event Type | Description | When It Fires |
|------------|-------------|---------------|
| `task.created` | A new task is created | After task creation |
| `task.assigned` | A task is assigned to an agent | After assignment |
| `task.transition` | Task status changes | After status transition |
| `agent.spawned` | A new agent is created | After agent creation |
| `agent.status_changed` | Agent status changes | After status change |
| `credit.spent` | Credits are spent | After credit deduction |
| `credit.transfer` | Credits are transferred between agents | After transfer |
| `*` | All events | Receives all event types |

## Webhook Payload Format

All webhooks receive a JSON payload with the following structure:

```json
{
  "event": "task.transition",
  "timestamp": "2025-02-09T22:50:00.000Z",
  "data": {
    "id": "task-123",
    "status": "done",
    "assigneeId": "agent-456",
    "title": "Complete API integration",
    "previousStatus": "in_progress"
  }
}
```

### Headers

Every webhook request includes the following headers:

- `Content-Type: application/json`
- `X-OpenSpawn-Event: <event-type>` — The event type (e.g., `task.created`)
- `X-OpenSpawn-Delivery: <uuid>` — Unique delivery ID for idempotency
- `X-OpenSpawn-Signature: sha256=<hmac>` — HMAC signature (if secret configured)

## Signature Verification

If you configure a webhook secret, OpenSpawn signs each payload with HMAC-SHA256. Verify the signature to ensure the request came from OpenSpawn:

### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express middleware
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-openspawn-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.json({ received: true });
});
```

### Python Example

```python
import hmac
import hashlib

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    expected_signature = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# Flask example
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-OpenSpawn-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, os.environ['WEBHOOK_SECRET']):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Process webhook...
    return jsonify({'received': True})
```

## Pre-Hooks: Blocking Actions

Pre-hooks fire **before** an action occurs and can block it by returning `allow: false`. This is useful for:

- Compliance checks (e.g., legal review before task transitions)
- Budget approvals (e.g., block credit spending above a threshold)
- Custom business rules (e.g., require manager approval for high-priority tasks)

### Pre-Hook Response Format

Your pre-hook endpoint must return a JSON response within the configured timeout (default 5 seconds):

```json
{
  "allow": true,
  "reason": "Compliance check passed"
}
```

Or to block the action:

```json
{
  "allow": false,
  "reason": "Budget exceeded: request manager approval"
}
```

### Pre-Hook Behavior

- **Timeout**: If your endpoint doesn't respond within the configured timeout, the action proceeds (fail-open)
- **Blocking**: Only pre-hooks with `canBlock: true` can actually block actions
- **Multiple Pre-Hooks**: If multiple blocking pre-hooks fire, **all** must return `allow: true` for the action to proceed
- **Error Handling**: On error, pre-hooks fail open (action proceeds) to prevent webhook issues from blocking operations

### Example: Budget Guardian Pre-Hook

```javascript
app.post('/budget-check', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'credit.spent') {
    const { amount, agentId, currentBalance } = data;
    
    // Block spending if it would put agent below 100 credits
    if (currentBalance - amount < 100) {
      return res.json({
        allow: false,
        reason: `Insufficient balance: would drop to ${currentBalance - amount} credits`
      });
    }
  }
  
  res.json({ allow: true });
});
```

## Retry Logic

OpenSpawn automatically retries failed webhook deliveries:

- **Attempts**: 3 total attempts (1 initial + 2 retries)
- **Backoff**: Exponential backoff (1s, 2s, 4s)
- **Timeout**: 10 seconds per attempt
- **Failure Tracking**: After 10 consecutive failures, webhooks are automatically disabled

## Security: SSRF Protection

OpenSpawn validates webhook URLs to prevent SSRF (Server-Side Request Forgery) attacks:

- ❌ Localhost addresses (`localhost`, `127.0.0.1`, `::1`)
- ❌ Private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
- ❌ Link-local addresses (`169.254.0.0/16`)
- ✅ Public HTTPS/HTTP URLs only

If you need to test webhooks locally, use a tool like [ngrok](https://ngrok.com/) or [webhook.site](https://webhook.site/).

## Dashboard Setup

### Creating a Webhook

1. Navigate to **Settings → Webhooks**
2. Click **Add Webhook**
3. Choose **Post-Hook** (async notifications) or **Pre-Hook** (blocking approvals)
4. Configure:
   - **Name**: Descriptive name (e.g., "Slack Notifications")
   - **URL**: Your endpoint URL
   - **Secret**: Auto-generated or custom (for signature verification)
   - **Events**: Select which events to receive
   - **Timeout** (pre-hooks only): Response timeout in seconds

### Testing a Webhook

Click the **Test** button on any webhook to send a test payload:

```json
{
  "event": "test",
  "timestamp": "2025-02-09T22:50:00.000Z",
  "data": {
    "message": "This is a test webhook from OpenSpawn"
  }
}
```

## GraphQL API

You can also manage webhooks via the GraphQL API:

### Queries

```graphql
# List all webhooks
query {
  webhooks(orgId: "org-123") {
    id
    name
    url
    events
    enabled
    hookType
    canBlock
    failureCount
    lastTriggeredAt
  }
}

# Get a specific webhook
query {
  webhook(orgId: "org-123", id: "webhook-456") {
    id
    name
    url
    events
    enabled
  }
}
```

### Mutations

```graphql
# Create a webhook
mutation {
  createWebhook(
    orgId: "org-123"
    input: {
      name: "Slack Notifications"
      url: "https://hooks.slack.com/services/T00/B00/XXX"
      events: ["task.created", "task.transition"]
      hookType: POST
    }
  ) {
    id
    name
    url
  }
}

# Update a webhook
mutation {
  updateWebhook(
    orgId: "org-123"
    id: "webhook-456"
    input: {
      enabled: false
    }
  ) {
    id
    enabled
  }
}

# Delete a webhook
mutation {
  deleteWebhook(orgId: "org-123", id: "webhook-456")
}

# Test a webhook
mutation {
  testWebhook(orgId: "org-123", id: "webhook-456")
}
```

## REST API

### Endpoints

- `GET /webhooks` — List all webhooks
- `GET /webhooks/:id` — Get a specific webhook
- `POST /webhooks` — Create a webhook
- `PATCH /webhooks/:id` — Update a webhook
- `DELETE /webhooks/:id` — Delete a webhook
- `POST /webhooks/:id/test` — Send a test event

### Example: Create Webhook

```bash
curl -X POST https://api.openspawn.com/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Compliance Pre-Check",
    "url": "https://compliance.example.com/webhook",
    "secret": "your-secret-key",
    "events": ["task.transition"],
    "hookType": "pre",
    "canBlock": true,
    "timeoutMs": 5000
  }'
```

## Common Use Cases

### 1. Slack Notifications

Receive real-time notifications in Slack when tasks are created or completed:

```javascript
// Use Slack Incoming Webhooks
const webhook = {
  name: "Slack Notifications",
  url: "https://hooks.slack.com/services/T00/B00/XXX",
  events: ["task.created", "task.completed", "task.transition"],
  hookType: "post"
};
```

### 2. Compliance Workflow

Block task transitions until compliance review is complete:

```javascript
// Pre-hook that checks if legal review is required
app.post('/compliance-check', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'task.transition' && data.status === 'done' && data.requiresLegalReview) {
    // Check if legal sign-off exists
    const approved = checkLegalApproval(data.id);
    
    return res.json({
      allow: approved,
      reason: approved ? 'Legal review complete' : 'Awaiting legal sign-off'
    });
  }
  
  res.json({ allow: true });
});
```

### 3. Budget Alerts

Send alerts when credit spending exceeds thresholds:

```javascript
app.post('/budget-alert', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'credit.spent' && data.amount > 1000) {
    sendAlertToFinance({
      agentId: data.agentId,
      amount: data.amount,
      reason: data.reason
    });
  }
  
  res.json({ received: true });
});
```

### 4. Analytics Pipeline

Stream all events to your analytics platform:

```javascript
const webhook = {
  name: "Analytics Pipeline",
  url: "https://analytics.company.com/ingest/openspawn",
  events: ["*"],  // All events
  hookType: "post"
};
```

## Best Practices

1. **Use Secrets**: Always configure a webhook secret and verify signatures
2. **Idempotency**: Use the `X-OpenSpawn-Delivery` header to detect duplicate deliveries
3. **Respond Quickly**: Webhooks have a 10-second timeout; for long operations, queue the work
4. **Monitor Failures**: Watch `failureCount` and `lastError` to detect issues early
5. **Test Before Production**: Use the test button to verify your endpoint before going live
6. **Fail-Open for Pre-Hooks**: Design pre-hooks to fail open (allow) on errors to avoid blocking operations
7. **Log Everything**: Keep audit logs of all webhook deliveries for compliance and debugging

## Troubleshooting

### Webhook Not Firing

- Check that the webhook is **enabled**
- Verify the **event types** match the action (e.g., `task.created` vs `task.transition`)
- Check `failureCount` — webhooks disable after 10 failures

### Signature Verification Failed

- Ensure you're using the correct **secret**
- Verify you're hashing the **raw request body** (before JSON parsing)
- Check that both sides use the same encoding (UTF-8)

### Pre-Hook Not Blocking

- Confirm `canBlock: true` is set
- Verify your endpoint returns the response within the **timeout**
- Check that you're returning valid JSON with `allow: false`

### SSRF Protection Error

- Webhook URLs cannot target localhost or private IPs
- Use [ngrok](https://ngrok.com/) or [webhook.site](https://webhook.site/) for local testing
- Ensure your production URL is publicly accessible

## Migration Guide

If you have existing webhook integrations:

1. **Review Event Types**: Some event names may have changed
2. **Update Signature Verification**: Ensure you're verifying `X-OpenSpawn-Signature`
3. **Test Pre-Hooks**: Pre-hook behavior may differ from previous versions
4. **Check Timeouts**: Default timeout is now 10s for post-hooks, 5s for pre-hooks

## Support

- **Documentation**: [docs.openspawn.com](https://docs.openspawn.com)
- **API Reference**: [api.openspawn.com/graphql](https://api.openspawn.com/graphql)
- **Support**: support@openspawn.com
