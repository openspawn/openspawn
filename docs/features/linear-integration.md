---
title: Linear Integration
layout: default
parent: Features
nav_order: 8
---

# Linear Integration

BikiniBottom integrates with Linear.app for bidirectional issue synchronization.

## Features

### Inbound Sync (Linear → BikiniBottom)
- Automatically create tasks from Linear issues
- Sync comments to messages
- Track issue status changes

### Outbound Sync (BikiniBottom → Linear)
- Update Linear issues when tasks complete
- Post comments on status changes
- Sync assignee information

## Setup

1. Go to Settings → Integrations → Linear
2. Click "Add Connection"
3. Enter your Linear team ID and API key
4. Configure sync settings
5. Add webhook URL to your Linear settings

## Configuration

### Sync Settings
- **createTaskOnIssue**: Create BikiniBottom tasks from Linear issues
- **createTaskOnComment**: Sync Linear comments as messages
- **closeIssueOnComplete**: Close Linear issues when tasks complete
- **commentOnStatusChange**: Post updates to Linear on status changes
- **syncAssignee**: Sync task assignees to Linear

## API

### REST Endpoints
- `POST /api/linear/connections` - Create connection
- `GET /api/linear/connections` - List connections
- `PATCH /api/linear/connections/:id` - Update connection
- `DELETE /api/linear/connections/:id` - Delete connection
- `POST /api/linear/webhook` - Webhook receiver

### GraphQL
```graphql
query {
  linearConnections(orgId: "org-id") {
    id
    name
    teamId
    enabled
  }
}
```

## Webhook Verification

All webhooks are verified using HMAC-SHA256 signatures for security.

## Related
- [GitHub Integration](./github-integration.md)
- [Webhook System](./webhooks.md)
