---
title: Inbound Webhooks
layout: default
parent: Features
nav_order: 6
---

# Inbound Webhooks

Inbound webhooks allow external services to create tasks in BikiniBottom via HTTP POST requests. This enables seamless integration with tools like GitHub Actions, Zapier, n8n, and custom automation workflows.

## Table of Contents

- [Overview](#overview)
- [Setup Guide](#setup-guide)
- [Authentication](#authentication)
- [Payload Format](#payload-format)
- [Batch Creation](#batch-creation)
- [Example Integrations](#example-integrations)
- [Dashboard Setup](#dashboard-setup)
- [Best Practices](#best-practices)

## Overview

Inbound webhooks provide a simple HTTP API for creating tasks from external systems. Each webhook key has:

- **Unique URL**: A dedicated endpoint for receiving webhook requests
- **API Key**: Simple authentication via URL parameter
- **HMAC Secret**: Optional signature verification for enhanced security
- **Default Settings**: Auto-apply agent assignment, priority, and tags

## Setup Guide

### 1. Create a Webhook Key

Navigate to **Settings → Inbound** in the BikiniBottom dashboard, then:

1. Click **Create Key**
2. Enter a descriptive name (e.g., "GitHub Actions", "Zapier Automation")
3. Optionally configure:
   - **Default Agent**: Auto-assign tasks to a specific agent
   - **Default Priority**: Set default priority level (LOW, NORMAL, HIGH, URGENT)
   - **Default Tags**: Automatically tag tasks (comma-separated)
4. Click **Create Key**

### 2. Get Your Webhook URL

After creating the key, the dashboard will display:

- **Webhook URL**: `https://your-instance.com/api/webhooks/inbound/{key}`
- **API Key**: The `{key}` value (e.g., `iwk_abc123...`)
- **HMAC Secret**: For signature verification (optional but recommended)

### 3. Test Your Webhook

Use the provided curl example to test:

```bash
curl -X POST https://your-instance.com/api/webhooks/inbound/iwk_your_key_here \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test task from webhook",
    "description": "Testing inbound webhook integration",
    "priority": "NORMAL"
  }'
```

## Authentication

### URL-Based Authentication (Simple)

The simplest method is including the API key in the URL:

```bash
POST https://your-instance.com/api/webhooks/inbound/iwk_your_key_here
```

This is convenient for quick integrations but exposes the key in logs.

### HMAC Signature Verification (Recommended)

For production use, verify requests using HMAC-SHA256 signatures:

1. **Generate Signature**:
   ```javascript
   const crypto = require('crypto');
   const payload = JSON.stringify(requestBody);
   const signature = crypto
     .createHmac('sha256', webhookSecret)
     .update(payload)
     .digest('hex');
   ```

2. **Send Signature in Header**:
   ```bash
   curl -X POST {webhook_url} \
     -H "Content-Type: application/json" \
     -H "X-BikiniBottom-Signature: {signature}" \
     -d '{...}'
   ```

3. **Server Verification**: BikiniBottom automatically verifies the signature if provided.

## Payload Format

### Single Task Creation

**Endpoint**: `POST /webhooks/inbound/{key}`

**Request Body**:

```json
{
  "title": "Task title (required)",
  "description": "Detailed task description (optional)",
  "priority": "LOW | NORMAL | HIGH | URGENT (optional)",
  "tags": ["tag1", "tag2"] (optional),
  "assigneeId": "agent-uuid (optional)",
  "metadata": {
    "custom": "data",
    "source": "external-system"
  } (optional)
}
```

**Response**:

```json
{
  "id": "task-uuid",
  "identifier": "TASK-123",
  "title": "Task title",
  "status": "BACKLOG",
  "priority": "NORMAL",
  "metadata": {
    "createdViaWebhook": true,
    "webhookKeyId": "key-uuid",
    "webhookKeyName": "GitHub Actions",
    "custom": "data"
  },
  ...
}
```

### Field Behavior

- **title**: Required, max 500 characters
- **description**: Optional, plain text or markdown
- **priority**: Falls back to webhook key default, then `NORMAL`
- **tags**: Merged with webhook key default tags
- **assigneeId**: Falls back to webhook key default agent
- **metadata**: Custom data preserved; webhook metadata added automatically

### Tasks Created via Webhook

Tasks created through inbound webhooks are automatically tagged with:

- **metadata.createdViaWebhook**: `true`
- **metadata.webhookKeyId**: UUID of the webhook key used
- **metadata.webhookKeyName**: Human-readable name of the webhook key

In the dashboard, these tasks display a **webhook badge** for easy identification.

## Batch Creation

Create multiple tasks in a single request:

**Endpoint**: `POST /webhooks/inbound/{key}/batch`

**Request Body**:

```json
{
  "tasks": [
    {
      "title": "First task",
      "priority": "HIGH",
      "tags": ["batch"]
    },
    {
      "title": "Second task",
      "description": "Task description",
      "metadata": {"batch_id": "xyz"}
    }
  ]
}
```

**Response**: Array of created tasks

```json
[
  { "id": "task-1", "identifier": "TASK-123", ... },
  { "id": "task-2", "identifier": "TASK-124", ... }
]
```

**Limits**: Batch size is not explicitly limited, but consider:
- Network timeouts (typically 30-60 seconds)
- Memory constraints
- Best practice: 10-50 tasks per batch

## Example Integrations

### GitHub Actions

Automatically create tasks from GitHub issues, pull requests, or workflow events:

```yaml
name: Create BikiniBottom Task

on:
  issues:
    types: [opened]

jobs:
  create-task:
    runs-on: ubuntu-latest
    steps:
      - name: Create task in BikiniBottom
        run: |
          curl -X POST ${{ secrets.OPENSPAWN_WEBHOOK_URL }} \
            -H "Content-Type: application/json" \
            -H "X-BikiniBottom-Signature: $(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "${{ secrets.OPENSPAWN_SECRET }}" | sed 's/^.* //')" \
            -d "$PAYLOAD"
        env:
          PAYLOAD: |
            {
              "title": "${{ github.event.issue.title }}",
              "description": "${{ github.event.issue.body }}",
              "priority": "NORMAL",
              "tags": ["github", "issue"],
              "metadata": {
                "github_issue_number": ${{ github.event.issue.number }},
                "github_url": "${{ github.event.issue.html_url }}",
                "author": "${{ github.event.issue.user.login }}"
              }
            }
```

### Zapier

1. Create a **Zapier Webhook** trigger
2. Use **Webhooks by Zapier** → **POST**
3. Configure:
   - **URL**: Your webhook URL
   - **Payload Type**: JSON
   - **Data**: Map fields from your trigger
   - **Headers**: Add `X-BikiniBottom-Signature` if using HMAC

### n8n

1. Add **HTTP Request** node
2. Configure:
   - **Method**: POST
   - **URL**: Your webhook URL
   - **Authentication**: None (key in URL) or Header Auth
   - **Body**: JSON with task fields
   - **Headers**: `Content-Type: application/json`, optional signature

### Python Script

```python
import requests
import hmac
import hashlib
import json

def create_openspawn_task(webhook_url, secret, task_data):
    payload = json.dumps(task_data)
    signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    headers = {
        'Content-Type': 'application/json',
        'X-BikiniBottom-Signature': signature
    }
    
    response = requests.post(webhook_url, data=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
task = {
    "title": "Automated task from Python",
    "description": "Generated by automation script",
    "priority": "HIGH",
    "tags": ["automation", "python"],
    "metadata": {"script_version": "1.0"}
}

result = create_openspawn_task(
    "https://openspawn.com/api/webhooks/inbound/iwk_...",
    "your-webhook-secret",
    task
)
print(f"Created task: {result['identifier']}")
```

### JavaScript/Node.js

```javascript
const crypto = require('crypto');
const fetch = require('node-fetch');

async function createBikiniBottomTask(webhookUrl, secret, taskData) {
  const payload = JSON.stringify(taskData);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BikiniBottom-Signature': signature,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

// Usage
const task = {
  title: 'Automated task from Node.js',
  description: 'Generated by automation script',
  priority: 'HIGH',
  tags: ['automation', 'nodejs'],
  metadata: { script_version: '1.0' },
};

createBikiniBottomTask(
  'https://openspawn.com/api/webhooks/inbound/iwk_...',
  'your-webhook-secret',
  task
).then((result) => {
  console.log(`Created task: ${result.identifier}`);
});
```

## Dashboard Setup

### Creating Keys

1. Navigate to **Settings** → **Inbound** tab
2. Click **Create Key**
3. Fill in:
   - **Name**: Descriptive label (e.g., "Production Zapier")
   - **Default Agent**: Optional auto-assignment
   - **Default Priority**: Optional default
   - **Default Tags**: Comma-separated (e.g., "webhook,external")

### Managing Keys

- **Show Details**: View URL, key, secret, and curl example
- **Enable/Disable**: Temporarily disable without deleting
- **Rotate**: Generate new key and secret (old credentials immediately invalid)
- **Delete**: Permanently remove (cannot be undone)

### Monitoring

- **Last Used**: Shows when the webhook was last triggered
- **Task List**: Webhook-created tasks show a **webhook badge**

## Best Practices

### Security

1. **Use HMAC Signatures**: Always verify signatures in production
2. **Rotate Keys Regularly**: Especially after team member changes
3. **Use HTTPS**: Never send webhooks over unencrypted HTTP
4. **Limit Scope**: Create separate keys for different integrations
5. **Monitor Usage**: Check "Last Used" timestamps for anomalies

### Performance

1. **Batch When Possible**: Use `/batch` endpoint for multiple tasks
2. **Validate Before Sending**: Avoid unnecessary API calls
3. **Handle Errors**: Implement retry logic with exponential backoff
4. **Avoid Loops**: Don't create webhooks that trigger themselves

### Organization

1. **Descriptive Names**: Use clear webhook key names (e.g., "GitHub PR Automation")
2. **Tag Consistently**: Use default tags to identify webhook sources
3. **Document Integrations**: Keep a list of active webhooks and their purposes
4. **Archive Old Keys**: Disable or delete unused webhooks

### Error Handling

Handle common HTTP status codes:

- **200 OK**: Task created successfully
- **400 Bad Request**: Invalid payload (check required fields)
- **401 Unauthorized**: Invalid signature or disabled key
- **404 Not Found**: Invalid webhook key
- **500 Internal Server Error**: Server issue (retry with backoff)

Example retry logic:

```python
import time
import requests

def create_task_with_retry(url, data, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code >= 500 and attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                time.sleep(wait_time)
            else:
                raise
```

## Troubleshooting

### "Webhook key not found or disabled"

- Verify the key in the URL matches the dashboard
- Check if the key is enabled (Settings → Inbound)
- Ensure you're using the correct environment URL

### "Invalid webhook signature"

- Verify you're using the correct secret
- Ensure the payload is JSON-stringified consistently
- Check that the signature is sent in `X-BikiniBottom-Signature` header

### Tasks Not Appearing

- Check the organization ID matches your dashboard
- Verify the task was created (check API response)
- Refresh the dashboard or check filters

### "Raw body not available for signature verification"

- Ensure you're sending `Content-Type: application/json`
- Verify the request body is valid JSON

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/inbound/{key}` | Create a single task |
| POST | `/webhooks/inbound/{key}/batch` | Create multiple tasks |
| POST | `/inbound-webhooks` | Create a webhook key (dashboard) |
| GET | `/inbound-webhooks` | List webhook keys (dashboard) |
| GET | `/inbound-webhooks/{id}` | Get a webhook key (dashboard) |
| PATCH | `/inbound-webhooks/{id}` | Update a webhook key (dashboard) |
| DELETE | `/inbound-webhooks/{id}` | Delete a webhook key (dashboard) |
| POST | `/inbound-webhooks/{id}/rotate` | Rotate key and secret (dashboard) |

### Rate Limits

Inbound webhooks respect the global API rate limits:

- **Default**: 100 requests per minute per webhook key
- **Burst**: Up to 200 requests in 10 seconds
- **Headers**: Check `X-RateLimit-*` headers in responses

## Support

For additional help:

- **Documentation**: https://docs.openspawn.com
- **GitHub Issues**: https://github.com/openspawn/openspawn/issues
- **Community**: https://discord.gg/openspawn

---

**Last Updated**: 2026-02-09  
**Version**: 1.0
