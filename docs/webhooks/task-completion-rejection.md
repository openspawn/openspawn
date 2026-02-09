# Task Completion Rejection

Phase 8.3 introduces the ability for pre-hooks to reject task completion with feedback. When a task attempts to transition to DONE, a `task.complete` pre-hook can block it and provide actionable feedback to the assignee.

## Overview

Instead of simply blocking the transition with an error, the completion rejection feature:

1. **Keeps the task in REVIEW** status
2. **Attaches feedback** explaining what needs to be fixed
3. **Tracks rejection count** for visibility
4. **Shows beautiful UI** highlighting the required fixes
5. **Clears feedback** when the task moves back to IN_PROGRESS

This creates a smooth workflow for quality gates like code review, QA testing, or compliance checks.

## Webhook Response Format

When a pre-hook wants to reject task completion, respond with:

```json
{
  "allow": false,
  "reason": "Missing unit tests for new functionality. Please add tests covering the edge cases."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `allow` | boolean | Set to `false` to reject completion |
| `reason` | string | Detailed feedback for the assignee |

## Example Webhook Implementations

### Quality Assurance Review

```typescript
// POST /webhooks/qa-review
app.post('/webhooks/qa-review', async (req, res) => {
  const { event, data } = req.body;
  
  if (event !== 'task.complete') {
    return res.json({ allow: true });
  }
  
  const { task } = data;
  
  // Check for test coverage
  if (!task.metadata?.testsCovered) {
    return res.json({
      allow: false,
      reason: 'Missing unit tests. Please ensure code coverage is above 80%.'
    });
  }
  
  // Check for documentation
  if (task.metadata?.hasApiChanges && !task.metadata?.docsUpdated) {
    return res.json({
      allow: false,
      reason: 'API documentation not updated. Please update the relevant docs.'
    });
  }
  
  return res.json({ allow: true });
});
```

### Security Review Gate

```typescript
// POST /webhooks/security-review
app.post('/webhooks/security-review', async (req, res) => {
  const { event, data } = req.body;
  
  if (event !== 'task.complete') {
    return res.json({ allow: true });
  }
  
  const { task } = data;
  
  // Check if task touches sensitive areas
  const sensitivePatterns = ['auth', 'payment', 'encryption', 'credentials'];
  const isSensitive = sensitivePatterns.some(p => 
    task.title.toLowerCase().includes(p)
  );
  
  if (isSensitive && !task.metadata?.securityReviewed) {
    return res.json({
      allow: false,
      reason: 'Security review required for changes touching sensitive areas. Please request a security review.'
    });
  }
  
  return res.json({ allow: true });
});
```

## Webhook Payload

When a `task.complete` event is triggered, your webhook receives:

```json
{
  "event": "task.complete",
  "timestamp": "2024-02-09T15:30:00Z",
  "data": {
    "hookType": "pre",
    "requiresResponse": true,
    "taskId": "123e4567-e89b-12d3-a456-426614174000",
    "taskIdentifier": "TASK-42",
    "taskTitle": "Implement user authentication",
    "task": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "identifier": "TASK-42",
      "title": "Implement user authentication",
      "description": "Add OAuth2 login flow",
      "status": "REVIEW",
      "priority": "HIGH",
      "assigneeId": "agent-456",
      "creatorId": "agent-123",
      "metadata": {
        "testsCovered": true,
        "docsUpdated": false
      }
    },
    "actorId": "agent-456",
    "assigneeId": "agent-456"
  }
}
```

## Task Metadata After Rejection

When a task completion is rejected, the following metadata is added:

```typescript
{
  metadata: {
    rejectionFeedback: "Missing unit tests for new functionality",
    rejectedAt: "2024-02-09T15:30:00Z",
    rejectedBy: "QA Review, Security Gate",
    rejectionCount: 1
  }
}
```

The `rejectionCount` is preserved even after the feedback is cleared, allowing you to track how many times a task was rejected.

## GraphQL Schema

The `TaskType` now includes a `rejection` field:

```graphql
type TaskRejectionType {
  feedback: String!
  rejectedAt: DateTime!
  rejectedBy: String!
  rejectionCount: Int!
}

type TaskType {
  # ... existing fields
  rejection: TaskRejectionType
}
```

Query example:

```graphql
query Task($orgId: ID!, $id: ID!) {
  task(orgId: $orgId, id: $id) {
    id
    title
    status
    rejection {
      feedback
      rejectedAt
      rejectedBy
      rejectionCount
    }
  }
}
```

## Events

When a task completion is rejected, a `task.completion_rejected` event is emitted:

```json
{
  "type": "task.completion_rejected",
  "orgId": "org-123",
  "actorId": "agent-456",
  "entityType": "task",
  "entityId": "task-789",
  "data": {
    "from": "REVIEW",
    "feedback": "Missing unit tests",
    "rejectedBy": ["QA Review"]
  }
}
```

## UI/UX

The dashboard shows rejection feedback prominently:

1. **Task Cards** - Amber border and "needs fixes" badge
2. **Rejection Preview** - Feedback shown directly on the card
3. **Detail Sidebar** - Full rejection banner with:
   - Rejection source and timestamp
   - Required fixes panel
   - Rejection count badge
   - "Resume Work" button
4. **List View** - Rejection count indicator

## Workflow

```
                   ┌─────────────────┐
                   │   IN_PROGRESS   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │     REVIEW      │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  Attempt DONE   │
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │     Pre-Hook Check        │
              └─────────────┬─────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│    allow: true  │                   │   allow: false  │
│                 │                   │   + feedback    │
└────────┬────────┘                   └────────┬────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│      DONE       │                   │ REVIEW + banner │
│   (completed)   │                   │  (with fixes)   │
└─────────────────┘                   └────────┬────────┘
                                               │
                                      ┌────────▼────────┐
                                      │  Fix the issues │
                                      └────────┬────────┘
                                               │
                                      ┌────────▼────────┐
                                      │   IN_PROGRESS   │
                                      │ (feedback clear)│
                                      └────────┬────────┘
                                               │
                                               ▼
                                         (retry flow)
```

## Best Practices

1. **Be Specific** - Provide actionable feedback that tells the agent exactly what needs to be fixed
2. **Use Multiple Webhooks** - Separate concerns (QA, security, compliance) into different hooks
3. **Track Patterns** - Monitor rejection counts to identify training needs
4. **Set Timeouts** - Configure appropriate `timeoutMs` for external reviews
5. **Fail Open** - On webhook errors, consider allowing completion to avoid blocking
